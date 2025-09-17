const { pool } = require('./config/database');

async function checkUserPermissions() {
  try {
    // Check Aamir user permissions
    console.log('=== CHECKING USER PERMISSIONS ===\n');

    // Get all roles
    const [roles] = await pool.query('SELECT id, name, level FROM roles ORDER BY level DESC');
    console.log('Available Roles:');
    roles.forEach(role => {
      console.log(`  ${role.id}: ${role.name} (level ${role.level})`);
    });
    console.log('');

    // Check if modules table exists
    try {
      const [modules] = await pool.query('SELECT id, module_name, description FROM modules WHERE is_active = 1 ORDER BY module_name');
      console.log('Available Modules:');
      modules.forEach(module => {
        console.log(`  ${module.id}: ${module.module_name} - ${module.description || 'No description'}`);
      });
      console.log('');
    } catch (error) {
      console.log('⚠️ Modules table does not exist. Using old permission structure.');
      console.log('');
    }

    // Check Aamir role permissions
    const [aamirRole] = await pool.query(`
      SELECT id, name, level FROM roles WHERE name = 'Aamir' LIMIT 1
    `);
    
    if (aamirRole.length === 0) {
      console.log('❌ No role named "Aamir" found');
      
      // Check if there's a user named Aamir
      const [aamirUser] = await pool.query(`
        SELECT u.id, u.username, u.role_id, r.name as role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.username LIKE '%aamir%' OR u.username LIKE '%Aamir%'
      `);
      
      if (aamirUser.length > 0) {
        console.log('Found Aamir user:');
        aamirUser.forEach(user => {
          console.log(`  User ID: ${user.id}, Username: ${user.username}, Role: ${user.role_name} (ID: ${user.role_id})`);
        });
        
        // Get permissions for Aamir's actual role
        const roleId = aamirUser[0].role_id;
        await checkRolePermissions(roleId, aamirUser[0].role_name);
      }
    } else {
      console.log(`✅ Found Aamir role: ID ${aamirRole[0].id}, Level ${aamirRole[0].level}`);
      await checkRolePermissions(aamirRole[0].id, aamirRole[0].name);
    }

  } catch (error) {
    console.error('Error checking permissions:', error);
  } finally {
    process.exit(0);
  }
}

async function checkRolePermissions(roleId, roleName) {
  try {
    // First try with modules table
    let permissions;
    try {
      const [result] = await pool.query(`
        SELECT 
          p.id as permission_id,
          p.permission_key,
          p.permission_name,
          p.description as permission_desc,
          m.module_name,
          m.description as module_desc,
          p.http_method,
          p.api_endpoint
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        LEFT JOIN modules m ON p.module_id = m.id
        WHERE rp.role_id = ? AND p.is_active = 1
        ORDER BY m.module_name, p.permission_key
      `, [roleId]);
      permissions = result;
    } catch (error) {
      // Fallback to query without modules table
      const [result] = await pool.query(`
        SELECT 
          p.id as permission_id,
          p.name as permission_key,
          p.name as permission_name,
          p.display_name as permission_desc,
          p.category as module_name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ? AND p.is_active = 1
        ORDER BY p.category, p.name
      `, [roleId]);
      permissions = result;
    }

    console.log(`\n=== PERMISSIONS FOR ROLE: ${roleName} (ID: ${roleId}) ===`);
    
    if (permissions.length === 0) {
      console.log('❌ No permissions found for this role');
      return;
    }

    let currentModule = '';
    permissions.forEach(perm => {
      const moduleName = perm.module_name || 'General';
      
      if (moduleName !== currentModule) {
        console.log(`\n📂 ${moduleName.toUpperCase()} MODULE:`);
        currentModule = moduleName;
      }
      
      console.log(`  ✅ ${perm.permission_key || perm.permission_name}`);
      if (perm.permission_desc) {
        console.log(`     Description: ${perm.permission_desc}`);
      }
      if (perm.http_method && perm.api_endpoint) {
        console.log(`     API: ${perm.http_method} ${perm.api_endpoint}`);
      }
    });

    // Group by module for summary
    const byModule = {};
    permissions.forEach(perm => {
      const moduleName = perm.module_name || 'general';
      if (!byModule[moduleName]) {
        byModule[moduleName] = [];
      }
      byModule[moduleName].push(perm.permission_key || perm.permission_name);
    });

    console.log(`\n=== SUMMARY FOR ${roleName} ===`);
    Object.keys(byModule).forEach(module => {
      console.log(`${module}: ${byModule[module].join(', ')}`);
    });
  } catch (error) {
    console.error('Error checking role permissions:', error);
  }
}

checkUserPermissions();
