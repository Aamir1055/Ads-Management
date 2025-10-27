const { pool } = require('./config/database');

async function testRoleAccess() {
  console.log('🚀 Role Management Access Test');
  console.log('==============================');

  try {
    // Test module access with correct permission names
    console.log('\n📊 Module Access Test...');
    const moduleTests = [
      { module: 'User Management', permission: 'users_read' },
      { module: 'Campaign Management', permission: 'campaigns_read' },
      { module: 'Campaign Data', permission: 'campaign_data_read' },
      { module: 'Reports', permission: 'reports_read' },
      { module: 'Cards', permission: 'cards_read' }
    ];

    for (const test of moduleTests) {
      const [accessCheck] = await pool.query(`
        SELECT 
          r.name as role_name,
          r.level,
          COUNT(DISTINCT u.id) as user_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
        WHERE p.name = ? AND p.is_active = 1 AND r.is_active = 1
        GROUP BY r.id, r.name, r.level
        ORDER BY r.level DESC, user_count DESC
      `, [test.permission]);

      console.log(`\n   🔐 ${test.module} (${test.permission}):`);
      if (accessCheck.length > 0) {
        let totalUsers = 0;
        accessCheck.forEach(role => {
          console.log(`      • ${role.role_name} (Level ${role.level}): ${role.user_count} users`);
          totalUsers += role.user_count;
        });
        console.log(`      📊 Total users with access: ${totalUsers}`);
      } else {
        console.log(`      ❌ No roles have access to ${test.permission}`);
      }
    }

    // Test admin permissions
    console.log('\n\n👑 Administrative Access Test...');
    const adminTests = [
      { module: 'Role Management', permission: 'role_management' },
      { module: 'User Creation', permission: 'users_create' },
      { module: 'User Role Management', permission: 'users_manage_roles' },
      { module: 'System Settings', permission: 'system_settings' }
    ];

    for (const test of adminTests) {
      const [adminAccess] = await pool.query(`
        SELECT 
          r.name as role_name,
          r.level,
          COUNT(DISTINCT u.id) as user_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
        WHERE p.name = ? AND p.is_active = 1 AND r.is_active = 1
        GROUP BY r.id, r.name, r.level
        ORDER BY r.level DESC
      `, [test.permission]);

      console.log(`\n   🛡️  ${test.module} (${test.permission}):`);
      if (adminAccess.length > 0) {
        adminAccess.forEach(role => {
          console.log(`      • ${role.role_name} (Level ${role.level}): ${role.user_count} users`);
        });
      } else {
        console.log(`      ❌ No roles have access to ${test.permission}`);
      }
    }

    // Check specific user permissions
    console.log('\n\n🧑 Sample User Permission Check...');
    const [userPermissions] = await pool.query(`
      SELECT DISTINCT
        u.username,
        r.name as role_name,
        r.level,
        p.name as permission_name,
        p.category
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.is_active = 1 AND p.is_active = 1
      AND u.username IN ('admin', 'aamir', 'testadmin')
      ORDER BY u.username, p.category, p.name
    `);

    let currentUser = '';
    userPermissions.forEach(up => {
      if (up.username !== currentUser) {
        console.log(`\n   👤 ${up.username} (${up.role_name} - Level ${up.level}):`);
        currentUser = up.username;
      }
      console.log(`      • ${up.permission_name} (${up.category})`);
    });

    // Test API endpoint simulation
    console.log('\n\n🌐 API Access Simulation...');
    
    // Simulate checking if a user can access user management
    const testUser = 'admin';
    const [userCanAccess] = await pool.query(`
      SELECT 
        u.username,
        r.name as role_name,
        CASE 
          WHEN COUNT(p.id) > 0 THEN 'ALLOWED'
          ELSE 'DENIED'
        END as access_status
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.name = 'users_read'
      WHERE u.username = ? AND u.is_active = 1
      GROUP BY u.id, u.username, r.name
    `, [testUser]);

    if (userCanAccess.length > 0) {
      const access = userCanAccess[0];
      console.log(`   🔍 User '${access.username}' (${access.role_name}) accessing User Management: ${access.access_status}`);
    } else {
      console.log(`   ❌ User '${testUser}' not found or inactive`);
    }

    console.log('\n✅ Role access test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testRoleAccess();
