const mysql = require('mysql2/promise');

async function analyzeRolePermissions() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ads reporting'
  });
  
  try {
    console.log('=== ROLE MANAGEMENT ANALYSIS ===\n');

    // 1. Check if basic tables exist
    console.log('1. Database Structure:');
    const [rolesTables] = await connection.execute("SHOW TABLES LIKE '%role%'");
    const [permissionsTables] = await connection.execute("SHOW TABLES LIKE '%permission%'");
    const [modulesTables] = await connection.execute("SHOW TABLES LIKE '%module%'");
    const allTables = [...rolesTables, ...permissionsTables, ...modulesTables];
    console.log('   Available tables:', allTables.map(t => Object.values(t)[0]).join(', '));

    // 2. Check modules
    console.log('\n2. Available Modules:');
    const [modules] = await connection.execute('SELECT * FROM modules ORDER BY module_name');
    if (modules.length === 0) {
      console.log('   ❌ No modules found');
    } else {
      modules.forEach(m => {
        console.log(`   - ${m.module_name}: ${m.description || 'No description'}`);
      });
    }

    // 3. Check permissions
    console.log('\n3. Available Permissions by Module:');
    const [permissions] = await connection.execute(`
      SELECT 
        m.module_name,
        p.permission_key,
        p.permission_name,
        p.description
      FROM permissions p
      JOIN modules m ON p.module_id = m.id
      ORDER BY m.module_name, p.permission_key
    `);
    
    if (permissions.length === 0) {
      console.log('   ❌ No permissions found');
    } else {
      const permsByModule = {};
      permissions.forEach(p => {
        if (!permsByModule[p.module_name]) {
          permsByModule[p.module_name] = [];
        }
        permsByModule[p.module_name].push(p);
      });
      
      Object.entries(permsByModule).forEach(([moduleName, perms]) => {
        console.log(`   📁 ${moduleName}:`);
        perms.forEach(p => {
          console.log(`      - ${p.permission_key}: ${p.permission_name}`);
        });
      });
    }

    // 4. Check roles
    console.log('\n4. Available Roles:');
    const [roles] = await connection.execute('SELECT * FROM roles ORDER BY level DESC, name');
    if (roles.length === 0) {
      console.log('   ❌ No roles found');
    } else {
      roles.forEach(r => {
        console.log(`   - ${r.name} (Level ${r.level}): ${r.description || 'No description'}`);
      });
    }

    // 5. Check specific Aamir role
    console.log('\n5. Aamir Role Analysis:');
    const [aamirRole] = await connection.execute('SELECT * FROM roles WHERE name = ?', ['Aamir']);
    
    if (aamirRole.length === 0) {
      console.log('   ❌ Aamir role not found');
    } else {
      const role = aamirRole[0];
      console.log(`   ✅ Role found: ${role.name} (ID: ${role.id}, Level: ${role.level})`);
      console.log(`   Description: ${role.description || 'No description'}`);
      
      // Get Aamir role permissions
      const [aamirPerms] = await connection.execute(`
        SELECT 
          m.module_name,
          p.permission_key,
          p.permission_name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN modules m ON p.module_id = m.id
        WHERE rp.role_id = ?
        ORDER BY m.module_name, p.permission_key
      `, [role.id]);
      
      console.log(`   Current permissions (${aamirPerms.length} total):`);
      if (aamirPerms.length === 0) {
        console.log('      ❌ No permissions assigned');
      } else {
        const permsByModule = {};
        aamirPerms.forEach(p => {
          if (!permsByModule[p.module_name]) {
            permsByModule[p.module_name] = [];
          }
          permsByModule[p.module_name].push(p);
        });
        
        Object.entries(permsByModule).forEach(([moduleName, perms]) => {
          console.log(`      📁 ${moduleName}:`);
          perms.forEach(p => {
            console.log(`         - ${p.permission_key}: ${p.permission_name}`);
          });
        });
      }
    }

    // 6. Check users with Aamir role
    console.log('\n6. Users with Aamir Role:');
    if (aamirRole.length > 0) {
      const [users] = await connection.execute(`
        SELECT 
          u.id,
          u.username,
          ur.assigned_at,
          ur.is_active
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.id
        WHERE ur.role_id = ?
        ORDER BY ur.assigned_at DESC
      `, [aamirRole[0].id]);
      
      if (users.length === 0) {
        console.log('   ❌ No users assigned to Aamir role');
      } else {
        users.forEach(u => {
          const status = u.is_active ? '✅ Active' : '❌ Inactive';
          console.log(`   - ${u.username} (ID: ${u.id}) - ${status}`);
        });
      }
    }

    // 7. Check auth module specifically
    console.log('\n7. Auth Module Check:');
    const [authModule] = await connection.execute('SELECT * FROM modules WHERE module_name = ?', ['auth']);
    if (authModule.length === 0) {
      console.log('   ❌ Auth module not found');
    } else {
      console.log(`   ✅ Auth module exists (ID: ${authModule[0].id})`);
      
      const [authPerms] = await connection.execute(`
        SELECT permission_key, permission_name, description
        FROM permissions 
        WHERE module_id = ?
        ORDER BY permission_key
      `, [authModule[0].id]);
      
      console.log(`   Auth permissions (${authPerms.length} total):`);
      if (authPerms.length === 0) {
        console.log('      ❌ No auth permissions found');
      } else {
        authPerms.forEach(p => {
          console.log(`      - ${p.permission_key}: ${p.permission_name}`);
        });
      }
    }

    // 8. Check dashboard module
    console.log('\n8. Dashboard Module Check:');
    const [dashboardModule] = await connection.execute('SELECT * FROM modules WHERE module_name = ?', ['dashboard']);
    if (dashboardModule.length === 0) {
      console.log('   ❌ Dashboard module not found');
    } else {
      console.log(`   ✅ Dashboard module exists (ID: ${dashboardModule[0].id})`);
      
      const [dashPerms] = await connection.execute(`
        SELECT permission_key, permission_name, description
        FROM permissions 
        WHERE module_id = ?
        ORDER BY permission_key
      `, [dashboardModule[0].id]);
      
      console.log(`   Dashboard permissions (${dashPerms.length} total):`);
      if (dashPerms.length === 0) {
        console.log('      ❌ No dashboard permissions found');
      } else {
        dashPerms.forEach(p => {
          console.log(`      - ${p.permission_key}: ${p.permission_name}`);
        });
      }
    }

    // 9. Summary and recommendations
    console.log('\n🎯 SUMMARY & ISSUES IDENTIFIED:');
    console.log('=====================================');
    
    if (permissions.filter(p => p.module_name === 'auth').length === 0) {
      console.log('❌ ISSUE 1: No auth permissions found - users cannot login/logout');
    }
    
    if (permissions.filter(p => p.module_name === 'dashboard').length === 0) {
      console.log('❌ ISSUE 2: No dashboard permissions found - users cannot access dashboard');
    }
    
    if (aamirRole.length > 0) {
      const aamirPermsCount = permissions.filter(p => 
        aamirRole[0] && p.role_id === aamirRole[0].id
      ).length;
      
      if (aamirPermsCount === 0) {
        console.log('❌ ISSUE 3: Aamir role has no permissions - users cannot access any modules');
      }
    }
    
    console.log('\n📋 RECOMMENDED ACTIONS:');
    console.log('1. Create missing auth permissions (auth.login, auth.logout)');
    console.log('2. Create missing dashboard permissions (dashboard.read)');
    console.log('3. Assign basic permissions to all roles by default');
    console.log('4. Assign specific module permissions to Aamir role');
    console.log('5. Test frontend navigation with updated permissions');

  } finally {
    await connection.end();
  }
}

analyzeRolePermissions().catch(console.error);
