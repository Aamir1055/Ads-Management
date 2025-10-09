const { pool } = require('./config/database');

async function testUserAccess() {
  let connection;
  
  try {
    console.log('🔄 Testing user access for Reports module...');
    
    connection = await pool.getConnection();
    
    // Get admin user
    const [users] = await connection.execute(`
      SELECT u.id, u.username, r.name as role_name, r.display_name as role_display_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.username = 'admin' AND u.is_active = 1
      LIMIT 1
    `);
    
    if (users.length === 0) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    const adminUser = users[0];
    console.log(`\n👤 Testing for user: ${adminUser.username} (Role: ${adminUser.role_display_name})`);
    
    // Simulate what the user-access API should return
    const [userModules] = await connection.execute(`
      SELECT DISTINCT
        m.id,
        m.name,
        m.display_name,
        m.description,
        m.icon,
        m.route,
        m.order_index
      FROM modules m
      INNER JOIN permissions p ON m.id = p.module_id
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN users u ON u.role_id = rp.role_id
      WHERE u.id = ? AND m.is_active = 1 AND p.is_active = 1
      ORDER BY m.order_index ASC, m.name ASC
    `, [adminUser.id]);
    
    console.log(`\n📊 Modules accessible to ${adminUser.username}:`);
    userModules.forEach(module => {
      console.log(`   - ${module.name} (${module.display_name})`);
      console.log(`     Icon: ${module.icon}`);
      console.log(`     Route: ${module.route}`);
      console.log(`     Order: ${module.order_index}`);
      console.log('');
    });
    
    const reportsModule = userModules.find(m => m.name === 'Reports');
    
    if (reportsModule) {
      console.log('✅ Reports module IS accessible to admin user');
      console.log(`   Details: ${JSON.stringify(reportsModule, null, 2)}`);
      
      // Check permissions
      const [permissions] = await connection.execute(`
        SELECT p.name, p.display_name, p.description
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN users u ON u.role_id = rp.role_id
        WHERE u.id = ? AND p.category = 'reports' AND p.is_active = 1
      `, [adminUser.id]);
      
      console.log(`\n🔐 Reports permissions for ${adminUser.username}:`);
      permissions.forEach(perm => {
        console.log(`   - ${perm.name}: ${perm.display_name}`);
      });
      
    } else {
      console.log('❌ Reports module is NOT accessible to admin user');
      console.log('\n🔍 Debug: Checking role permissions...');
      
      const [rolePerms] = await connection.execute(`
        SELECT p.name, p.display_name, p.category
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN roles r ON r.id = rp.role_id
        WHERE r.id = ?
      `, [adminUser.role_id]);
      
      console.log(`Role permissions for ${adminUser.role_display_name}:`);
      rolePerms.forEach(perm => {
        console.log(`   - ${perm.category}.${perm.name}: ${perm.display_name}`);
      });
    }
    
    return { success: true, userModules, reportsModule };
    
  } catch (error) {
    console.error('❌ Failed to test user access:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Run the script
if (require.main === module) {
  testUserAccess()
    .then(() => {
      console.log('\n✅ Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testUserAccess };