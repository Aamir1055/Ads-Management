const { pool } = require('./config/database');

async function checkRoleAssignments() {
  try {
    console.log('🔍 Checking role assignments and permissions...\n');
    
    // Check all roles
    const [roles] = await pool.query(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM role_permissions WHERE role_id = r.id) as permission_count
      FROM roles r 
      ORDER BY r.level DESC
    `);
    console.log('🎭 All Roles:');
    roles.forEach(role => {
      console.log(`  - ${role.name} (ID: ${role.id}, Level: ${role.level}, Permissions: ${role.permission_count})`);
    });
    
    console.log('\n📋 Detailed Role Permissions:');
    
    // Check permissions for each role
    for (const role of roles) {
      const [rolePerms] = await pool.query(`
        SELECT p.name, p.display_name, p.category, m.name as module_name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN modules m ON p.module_id = m.id
        WHERE rp.role_id = ?
        ORDER BY m.name, p.name
      `, [role.id]);
      
      console.log(`\n  🎭 ${role.name}:`);
      if (rolePerms.length === 0) {
        console.log('    ❌ No permissions assigned');
      } else {
        const permsByModule = {};
        rolePerms.forEach(perm => {
          if (!permsByModule[perm.module_name]) {
            permsByModule[perm.module_name] = [];
          }
          permsByModule[perm.module_name].push(perm.name);
        });
        
        Object.keys(permsByModule).forEach(module => {
          console.log(`    📁 ${module}: ${permsByModule[module].join(', ')}`);
        });
      }
    }
    
    // Check current user assignments
    console.log('\n👥 Current User Role Assignments:');
    const [users] = await pool.query(`
      SELECT u.id, u.username, r.name as role_name, r.level
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `);
    users.forEach(user => {
      console.log(`  - ${user.username} (ID: ${user.id}) → ${user.role_name} (Level: ${user.level})`);
    });
    
    console.log('\n🏷️ Brand Module Access Analysis:');
    const [brandAccess] = await pool.query(`
      SELECT r.name as role_name, 
        GROUP_CONCAT(p.name) as brand_permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.name LIKE 'brands_%'
      GROUP BY r.id, r.name
      ORDER BY r.level DESC
    `);
    
    brandAccess.forEach(access => {
      const perms = access.brand_permissions ? access.brand_permissions.split(',') : [];
      console.log(`  - ${access.role_name}: ${perms.length > 0 ? perms.join(', ') : 'NO BRAND ACCESS'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking role assignments:', error);
    process.exit(1);
  }
}

checkRoleAssignments();
