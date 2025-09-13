const { pool } = require('./config/database');

async function quickRoleTest() {
  console.log('🚀 Quick Role Management Test');
  console.log('==============================');

  try {
    // Test database connection
    console.log('\n1. Testing Database Connection...');
    const [result] = await pool.query('SELECT COUNT(*) as count FROM roles');
    console.log(`✅ Database connected. Found ${result[0].count} roles.`);

    // Check if basic tables exist
    console.log('\n2. Checking Table Structure...');
    const tables = ['roles', 'permissions', 'role_permissions', 'users'];
    
    for (const table of tables) {
      try {
        const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ Table '${table}' exists with ${rows[0].count} records`);
      } catch (error) {
        console.log(`❌ Table '${table}' missing or error:`, error.message);
      }
    }

    // Check existing roles
    console.log('\n3. Existing Roles...');
    const [roles] = await pool.query(`
      SELECT r.id, r.name, r.display_name, r.level, 
             COUNT(rp.permission_id) as permission_count,
             COUNT(u.id) as user_count
      FROM roles r 
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
      GROUP BY r.id
      ORDER BY r.level DESC
    `);

    console.log('📋 Current Roles:');
    roles.forEach(role => {
      console.log(`   • ${role.name} (Level ${role.level}) - ${role.user_count} users, ${role.permission_count} permissions`);
    });

    // Check existing permissions
    console.log('\n4. Existing Permissions...');
    const [permissions] = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM permissions 
      WHERE is_active = 1 
      GROUP BY category 
      ORDER BY category
    `);

    console.log('🔑 Permission Categories:');
    permissions.forEach(perm => {
      console.log(`   • ${perm.category}: ${perm.count} permissions`);
    });

    // Test role-based queries
    console.log('\n5. Testing Role-Based Queries...');
    
    // Find admin users
    const [adminUsers] = await pool.query(`
      SELECT u.username, r.name as role_name, r.level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.level >= 8 AND u.is_active = 1
    `);

    console.log(`👑 Admin Users (level 8+): ${adminUsers.length}`);
    adminUsers.forEach(user => {
      console.log(`   • ${user.username} (${user.role_name} - Level ${user.level})`);
    });

    // Check permission assignments
    console.log('\n6. Permission Assignment Test...');
    const [permissionCheck] = await pool.query(`
      SELECT 
        r.name as role_name,
        COUNT(DISTINCT rp.permission_id) as permission_count,
        GROUP_CONCAT(DISTINCT p.category) as categories
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = 1
      WHERE r.is_active = 1
      GROUP BY r.id, r.name
      ORDER BY permission_count DESC
      LIMIT 5
    `);

    console.log('🔗 Top 5 Roles by Permission Count:');
    permissionCheck.forEach(role => {
      console.log(`   • ${role.role_name}: ${role.permission_count} permissions (${role.categories || 'none'})`);
    });

    // Test module access
    console.log('\n7. Module Access Test...');
    const moduleTests = [
      { module: 'user-management', permission: 'users.read' },
      { module: 'dashboard', permission: 'dashboard.view' },
      { module: 'campaigns', permission: 'campaigns.read' },
      { module: 'reports', permission: 'reports.read' }
    ];

    for (const test of moduleTests) {
      const [accessCheck] = await pool.query(`
        SELECT 
          r.name as role_name,
          COUNT(DISTINCT u.id) as user_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
        WHERE p.name = ? AND p.is_active = 1
        GROUP BY r.id, r.name
        ORDER BY user_count DESC
      `, [test.permission]);

      console.log(`   📊 ${test.module} access (${test.permission}):`);
      if (accessCheck.length > 0) {
        accessCheck.forEach(role => {
          console.log(`      • ${role.role_name}: ${role.user_count} users`);
        });
      } else {
        console.log(`      ⚠️  No roles have access to ${test.permission}`);
      }
    }

    console.log('\n✅ Quick test completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   • ${roles.length} roles configured`);
    console.log(`   • ${permissions.reduce((sum, p) => sum + p.count, 0)} permissions available`);
    console.log(`   • ${adminUsers.length} admin users`);
    
    if (roles.length === 0) {
      console.log('\n⚠️  WARNING: No roles found! You need to set up roles first.');
    }
    
    if (adminUsers.length === 0) {
      console.log('\n⚠️  WARNING: No admin users found! You need at least one admin user.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
if (require.main === module) {
  quickRoleTest().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = quickRoleTest;
