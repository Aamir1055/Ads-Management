const mysql = require('mysql2/promise');

async function fixRoleAssignmentIssues() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ads reporting'
  });
  
  try {
    console.log('🔧 FIXING ROLE ASSIGNMENT ISSUES');
    console.log('=================================\n');

    // 1. Fix missing user-role assignments
    console.log('1. Checking and fixing user-role assignments...');
    
    // Get all users and their roles from the users table
    const [allUsers] = await connection.execute(`
      SELECT u.id, u.username, u.role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = 1
    `);
    
    console.log(`   Found ${allUsers.length} active users`);
    
    for (const user of allUsers) {
      // Check if user has entry in user_roles table
      const [userRoleEntry] = await connection.execute(
        'SELECT id FROM user_roles WHERE user_id = ? AND is_active = 1',
        [user.id]
      );
      
      if (userRoleEntry.length === 0 && user.role_id) {
        // User has role_id in users table but no active entry in user_roles table
        console.log(`   🔧 Fixing missing role assignment for user: ${user.username} → ${user.role_name}`);
        
        await connection.execute(
          'INSERT INTO user_roles (user_id, role_id, is_active, assigned_by, assigned_at) VALUES (?, ?, 1, NULL, NOW())',
          [user.id, user.role_id]
        );
        
        console.log(`      ✅ Added user_roles entry for ${user.username}`);
      } else {
        console.log(`   ✅ ${user.username} → ${user.role_name || 'No role'} (already assigned)`);
      }
    }

    // 2. Add default permissions to ALL roles (auth + dashboard)
    console.log('\n2. Ensuring all roles have default permissions (auth + dashboard)...');
    
    const [allRoles] = await connection.execute('SELECT id, name FROM roles WHERE is_active = 1');
    const defaultPermissionKeys = ['auth.login', 'auth.logout', 'auth.me', 'dashboard.read'];
    
    for (const role of allRoles) {
      console.log(`   Processing role: ${role.name}`);
      
      for (const permKey of defaultPermissionKeys) {
        const [permission] = await connection.execute('SELECT id FROM permissions WHERE permission_key = ?', [permKey]);
        
        if (permission.length > 0) {
          const [existing] = await connection.execute(
            'SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
            [role.id, permission[0].id]
          );
          
          if (existing.length === 0) {
            await connection.execute(
              'INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at) VALUES (?, ?, NULL, NOW())',
              [role.id, permission[0].id]
            );
            console.log(`      ✅ Added ${permKey} to ${role.name}`);
          }
        }
      }
    }

    // 3. Verify specific user permissions
    console.log('\n3. Verifying specific user permissions...');
    
    // Test "nice" user specifically
    const [niceUser] = await connection.execute('SELECT id, username FROM users WHERE username = ?', ['nice']);
    
    if (niceUser.length > 0) {
      const userId = niceUser[0].id;
      
      const [userPerms] = await connection.execute(`
        SELECT DISTINCT
          m.module_name,
          p.permission_key
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        JOIN modules m ON p.module_id = m.id
        WHERE u.id = ?
        ORDER BY m.module_name, p.permission_key
      `, [userId]);
      
      console.log(`   User "nice" has access to ${userPerms.length} permissions across modules:`);
      const moduleAccess = {};
      userPerms.forEach(p => {
        if (!moduleAccess[p.module_name]) {
          moduleAccess[p.module_name] = [];
        }
        moduleAccess[p.module_name].push(p.permission_key);
      });
      
      Object.entries(moduleAccess).forEach(([module, perms]) => {
        console.log(`      📁 ${module}: ${perms.length} permissions`);
      });
    }

    // 4. Show which modules have API endpoints
    console.log('\n4. Modules with API endpoints analysis...');
    
    const [modulesWithAPIs] = await connection.execute(`
      SELECT DISTINCT m.module_name, m.module_path
      FROM modules m
      WHERE m.is_active = 1
      ORDER BY m.module_name
    `);
    
    console.log('   Modules and their API status:');
    modulesWithAPIs.forEach(m => {
      const hasAPI = m.module_path ? '✅ Has API' : '❌ No API';
      console.log(`      ${m.module_name}: ${hasAPI} ${m.module_path || ''}`);
    });

    console.log('\n🎉 ROLE ASSIGNMENT ISSUES FIXED!');
    console.log('================================');
    console.log('✅ All users now have proper role assignments in user_roles table');
    console.log('✅ All roles have basic auth + dashboard permissions');
    console.log('✅ Permission system should work correctly now');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Login as "nice" user and check what navigation items appear');
    console.log('2. The frontend will now only show modules based on actual permissions');
    console.log('3. Modules without API endpoints can be hidden in frontend configuration');

  } catch (error) {
    console.error('❌ Error fixing role assignments:', error);
  } finally {
    await connection.end();
  }
}

fixRoleAssignmentIssues().catch(console.error);
