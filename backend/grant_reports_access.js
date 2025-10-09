const { pool } = require('./config/database');

async function grantReportsAccess() {
  let connection;
  
  try {
    console.log('🔄 Granting Reports access to all users...');
    
    connection = await pool.getConnection();
    
    // Check current users
    const [users] = await connection.execute(`
      SELECT u.id, u.username, r.name as role_name, r.display_name as role_display_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.is_active = 1
    `);
    
    console.log('\n👥 Active users:');
    users.forEach(user => {
      console.log(`   - ${user.username} (ID: ${user.id}) - Role: ${user.role_display_name}`);
    });
    
    // Check Reports module and permissions
    const [reportsModule] = await connection.execute("SELECT * FROM modules WHERE name = 'Reports'");
    const [reportsPermissions] = await connection.execute("SELECT * FROM permissions WHERE category = 'reports'");
    
    console.log(`\n📊 Reports Module: ${reportsModule.length ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`🔐 Reports Permissions: ${reportsPermissions.length} found`);
    
    if (reportsModule.length === 0) {
      console.log('❌ Reports module not found in database!');
      return;
    }
    
    if (reportsPermissions.length === 0) {
      console.log('❌ No reports permissions found in database!');
      return;
    }
    
    // Get all active roles
    const [roles] = await connection.execute("SELECT * FROM roles WHERE is_active = 1");
    
    console.log(`\n👔 Active roles: ${roles.length}`);
    roles.forEach(role => {
      console.log(`   - ${role.display_name} (${role.name})`);
    });
    
    // Grant all reports permissions to all active roles
    console.log('\n🔄 Granting Reports permissions to all roles...');
    
    for (const role of roles) {
      console.log(`\n   Processing role: ${role.display_name}`);
      
      for (const permission of reportsPermissions) {
        try {
          await connection.execute(`
            INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
            VALUES (?, ?, NOW(), NOW())
          `, [role.id, permission.id]);
          
          console.log(`     ✅ Granted: ${permission.display_name}`);
        } catch (error) {
          console.log(`     ⚠️  Already exists: ${permission.display_name}`);
        }
      }
    }
    
    // Verify the permissions were granted
    const [verifyResults] = await connection.execute(`
      SELECT 
        r.name as role_name,
        r.display_name as role_display_name,
        COUNT(p.id) as reports_permissions_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.category = 'reports'
      WHERE r.is_active = 1
      GROUP BY r.id, r.name, r.display_name
      ORDER BY r.name
    `);
    
    console.log('\n✅ Verification Results:');
    verifyResults.forEach(result => {
      console.log(`   - ${result.role_display_name}: ${result.reports_permissions_count} reports permissions`);
    });
    
    // Check if the Reports module has a route field
    const [moduleStructure] = await connection.execute("DESCRIBE modules");
    const hasRouteField = moduleStructure.some(field => field.Field === 'route');
    
    if (hasRouteField) {
      console.log('\n🔄 Updating module route...');
      await connection.execute(`
        UPDATE modules 
        SET route = '/reports' 
        WHERE name = 'Reports'
      `);
      console.log('✅ Module route updated');
    }
    
    console.log('\n🎉 Reports access granted to all roles!');
    console.log('\n🚀 Next Steps:');
    console.log('1. Hard refresh your browser (Ctrl+F5)');
    console.log('2. Clear browser localStorage and sessionStorage');
    console.log('3. Log out completely');
    console.log('4. Log back in');
    console.log('5. The Reports module should now appear in the sidebar');
    
    // Also show what the user-access API should return
    console.log('\n📡 The user-access API should now include:');
    console.log('   Module: Reports');
    console.log('   Icon: BarChart3');
    console.log('   Href: /reports');
    
    return { success: true, users, roles, permissions: reportsPermissions };
    
  } catch (error) {
    console.error('❌ Failed to grant reports access:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Run the script
if (require.main === module) {
  grantReportsAccess()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { grantReportsAccess };