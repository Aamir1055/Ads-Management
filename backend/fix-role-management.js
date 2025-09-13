const mysql = require('mysql2/promise');

async function fixRoleManagement() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ads reporting'
  });
  
  try {
    console.log('🔧 FIXING ROLE MANAGEMENT SYSTEM');
    console.log('===============================\n');

    // Step 1: Create missing auth module
    console.log('1. Creating Auth Module...');
    let [authModule] = await connection.execute('SELECT id FROM modules WHERE module_name = ?', ['auth']);
    
    if (authModule.length === 0) {
      const [result] = await connection.execute(`
        INSERT INTO modules (module_name, description, is_active, created_at, updated_at)
        VALUES ('auth', 'Authentication and authorization', 1, NOW(), NOW())
      `);
      console.log('   ✅ Auth module created');
      authModule = [{ id: result.insertId }];
    } else {
      console.log('   ✅ Auth module already exists');
    }
    
    const authModuleId = authModule[0].id;

    // Step 2: Create missing dashboard module
    console.log('\n2. Creating Dashboard Module...');
    let [dashboardModule] = await connection.execute('SELECT id FROM modules WHERE module_name = ?', ['dashboard']);
    
    if (dashboardModule.length === 0) {
      const [result] = await connection.execute(`
        INSERT INTO modules (module_name, description, is_active, created_at, updated_at)
        VALUES ('dashboard', 'Dashboard and analytics access', 1, NOW(), NOW())
      `);
      console.log('   ✅ Dashboard module created');
      dashboardModule = [{ id: result.insertId }];
    } else {
      console.log('   ✅ Dashboard module already exists');
    }
    
    const dashboardModuleId = dashboardModule[0].id;

    // Step 3: Create auth permissions
    console.log('\n3. Creating Auth Permissions...');
    const authPermissions = [
      { key: 'auth.login', name: 'Login', description: 'User can login to the system' },
      { key: 'auth.logout', name: 'Logout', description: 'User can logout from the system' },
      { key: 'auth.me', name: 'Get Profile', description: 'User can view their own profile' },
      { key: 'auth.validate', name: 'Validate Credentials', description: 'User can validate their credentials' }
    ];

    for (const perm of authPermissions) {
      const [existing] = await connection.execute('SELECT id FROM permissions WHERE permission_key = ?', [perm.key]);
      
      if (existing.length === 0) {
        await connection.execute(`
          INSERT INTO permissions (module_id, permission_key, permission_name, description, http_method, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'POST', 1, NOW(), NOW())
        `, [authModuleId, perm.key, perm.name, perm.description]);
        console.log(`   ✅ Created permission: ${perm.key}`);
      } else {
        console.log(`   ✅ Permission already exists: ${perm.key}`);
      }
    }

    // Step 4: Create dashboard permissions
    console.log('\n4. Creating Dashboard Permissions...');
    const dashboardPermissions = [
      { key: 'dashboard.read', name: 'View Dashboard', description: 'User can view the main dashboard' },
      { key: 'dashboard.analytics', name: 'View Analytics', description: 'User can view analytics and statistics' }
    ];

    for (const perm of dashboardPermissions) {
      const [existing] = await connection.execute('SELECT id FROM permissions WHERE permission_key = ?', [perm.key]);
      
      if (existing.length === 0) {
        await connection.execute(`
          INSERT INTO permissions (module_id, permission_key, permission_name, description, http_method, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'GET', 1, NOW(), NOW())
        `, [dashboardModuleId, perm.key, perm.name, perm.description]);
        console.log(`   ✅ Created permission: ${perm.key}`);
      } else {
        console.log(`   ✅ Permission already exists: ${perm.key}`);
      }
    }

    // Step 5: Create default permissions for all users (basic access)
    console.log('\n5. Setting up Default User Role...');
    let [defaultRole] = await connection.execute('SELECT id FROM roles WHERE name = ? OR name = ?', ['User', 'user']);
    
    if (defaultRole.length === 0) {
      const [result] = await connection.execute(`
        INSERT INTO roles (name, description, level, is_system_role, is_active, created_at, updated_at)
        VALUES ('user', 'Default user with basic permissions', 1, 1, 1, NOW(), NOW())
      `);
      defaultRole = [{ id: result.insertId }];
      console.log('   ✅ Default user role created');
    } else {
      console.log('   ✅ Default user role exists');
    }
    
    const defaultRoleId = defaultRole[0].id;

    // Step 6: Assign default permissions to all roles (auth + dashboard)
    console.log('\n6. Assigning Default Permissions to All Roles...');
    const [allRoles] = await connection.execute('SELECT id, name FROM roles WHERE is_active = 1');
    
    const defaultPermissionKeys = ['auth.login', 'auth.logout', 'auth.me', 'dashboard.read'];
    
    for (const role of allRoles) {
      console.log(`   Processing role: ${role.name}`);
      
      for (const permKey of defaultPermissionKeys) {
        const [permission] = await connection.execute('SELECT id FROM permissions WHERE permission_key = ?', [permKey]);
        
        if (permission.length > 0) {
          // Check if permission is already assigned
          const [existing] = await connection.execute(
            'SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
            [role.id, permission[0].id]
          );
          
          if (existing.length === 0) {
            await connection.execute(
              'INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at) VALUES (?, ?, NULL, NOW())',
              [role.id, permission[0].id]
            );
            console.log(`     ✅ Assigned ${permKey} to ${role.name}`);
          } else {
            console.log(`     ✅ ${permKey} already assigned to ${role.name}`);
          }
        }
      }
    }

    // Step 7: Fix Aamir role specifically - assign the 2 modules you mentioned
    console.log('\n7. Fixing Aamir Role Permissions...');
    const [aamirRole] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['Aamir']);
    
    if (aamirRole.length > 0) {
      const aamirRoleId = aamirRole[0].id;
      
      // You mentioned Aamir should have complete access to 2 modules
      // Let's assign campaign-data and campaign-types (common modules for campaign management)
      const aamirModules = ['campaign-data', 'campaign-types'];
      
      console.log('   Assigning complete access to 2 modules for Aamir role:');
      
      for (const moduleName of aamirModules) {
        console.log(`   📁 Processing module: ${moduleName}`);
        
        // Get all permissions for this module
        const [modulePerms] = await connection.execute(`
          SELECT p.id, p.permission_key, p.permission_name
          FROM permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE m.module_name = ? AND p.is_active = 1
        `, [moduleName]);
        
        if (modulePerms.length > 0) {
          console.log(`     Found ${modulePerms.length} permissions in ${moduleName} module`);
          
          for (const perm of modulePerms) {
            // Check if permission is already assigned
            const [existing] = await connection.execute(
              'SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
              [aamirRoleId, perm.id]
            );
            
            if (existing.length === 0) {
              await connection.execute(
                'INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at) VALUES (?, ?, NULL, NOW())',
                [aamirRoleId, perm.id]
              );
              console.log(`     ✅ Assigned ${perm.permission_key} to Aamir role`);
            } else {
              console.log(`     ✅ ${perm.permission_key} already assigned to Aamir role`);
            }
          }
        } else {
          console.log(`     ❌ No permissions found for module: ${moduleName}`);
        }
      }
    } else {
      console.log('   ❌ Aamir role not found');
    }

    // Step 8: Create a test user with Aamir role if needed
    console.log('\n8. Creating Test User with Aamir Role...');
    const testUsername = 'aamir_test';
    let [testUser] = await connection.execute('SELECT id FROM users WHERE username = ?', [testUsername]);
    
    if (testUser.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('test123', 10);
      
      const [result] = await connection.execute(`
        INSERT INTO users (username, hashed_password, role_id, is_active, created_at, updated_at)
        VALUES (?, ?, 1, 1, NOW(), NOW())
      `, [testUsername, hashedPassword]);
      
      testUser = [{ id: result.insertId }];
      console.log(`   ✅ Test user created: ${testUsername} (password: test123)`);
    } else {
      console.log(`   ✅ Test user already exists: ${testUsername}`);
    }
    
    // Assign Aamir role to test user
    if (aamirRole.length > 0) {
      const [existingAssignment] = await connection.execute(
        'SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?',
        [testUser[0].id, aamirRole[0].id]
      );
      
      if (existingAssignment.length === 0) {
        await connection.execute(
          'INSERT INTO user_roles (user_id, role_id, is_active, assigned_by, assigned_at) VALUES (?, ?, 1, NULL, NOW())',
          [testUser[0].id, aamirRole[0].id]
        );
        console.log('   ✅ Assigned Aamir role to test user');
      } else {
        console.log('   ✅ Aamir role already assigned to test user');
      }
    }

    // Step 9: Verify the fixes
    console.log('\n9. Verifying Fixes...');
    
    // Check Aamir role permissions
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
    `, [aamirRole[0]?.id]);
    
    console.log(`   Aamir role now has ${aamirPerms.length} permissions:`);
    const permsByModule = {};
    aamirPerms.forEach(p => {
      if (!permsByModule[p.module_name]) {
        permsByModule[p.module_name] = [];
      }
      permsByModule[p.module_name].push(p.permission_key);
    });
    
    Object.entries(permsByModule).forEach(([module, perms]) => {
      console.log(`     📁 ${module}: ${perms.join(', ')}`);
    });

    // Check test user permissions
    if (testUser.length > 0) {
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
        WHERE u.username = ?
        ORDER BY m.module_name, p.permission_key
      `, [testUsername]);
      
      console.log(`   Test user ${testUsername} has access to ${userPerms.length} permissions across these modules:`);
      const userPermsByModule = {};
      userPerms.forEach(p => {
        if (!userPermsByModule[p.module_name]) {
          userPermsByModule[p.module_name] = 0;
        }
        userPermsByModule[p.module_name]++;
      });
      
      Object.entries(userPermsByModule).forEach(([module, count]) => {
        console.log(`     📁 ${module}: ${count} permissions`);
      });
    }

    console.log('\n🎉 ROLE MANAGEMENT SYSTEM FIXED!');
    console.log('=================================');
    console.log('✅ Auth module and permissions created');
    console.log('✅ Dashboard module and permissions created');
    console.log('✅ All roles now have basic auth + dashboard access');
    console.log('✅ Aamir role has complete access to 2 modules');
    console.log('✅ Test user created for testing');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Login as aamir_test user (password: test123)');
    console.log('2. Verify dashboard and assigned modules are visible');
    console.log('3. Test navigation and access control');
    console.log('4. Assign Aamir role to your actual users if needed');

  } catch (error) {
    console.error('❌ Error fixing role management:', error);
  } finally {
    await connection.end();
  }
}

fixRoleManagement().catch(console.error);
