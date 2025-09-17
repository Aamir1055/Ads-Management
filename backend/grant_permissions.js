const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ads reporting'
};

async function grantPermissions() {
  let connection;
  
  try {
    console.log('🔧 Granting permissions to super admin...');
    connection = await mysql.createConnection(dbConfig);
    
    // Check table structure
    const [structure] = await connection.execute("DESCRIBE role_permissions");
    console.log('📋 role_permissions table structure:');
    structure.forEach(col => console.log(`  ${col.Field}: ${col.Type}`));
    
    // Get super admin role ID
    const [superAdminRole] = await connection.execute(`
      SELECT id FROM roles WHERE name = 'super_admin'
    `);
    
    if (superAdminRole.length === 0) {
      console.log('❌ Super admin role not found');
      return;
    }
    
    const superAdminId = superAdminRole[0].id;
    console.log(`📋 Super Admin Role ID: ${superAdminId}`);
    
    // Get all active permissions
    const [permissions] = await connection.execute(`
      SELECT id, name FROM permissions WHERE is_active = 1 ORDER BY name
    `);
    
    console.log(`📋 Found ${permissions.length} active permissions`);
    
    // Grant all permissions to super admin (simplified INSERT)
    let grantedCount = 0;
    for (const permission of permissions) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)
        `, [superAdminId, permission.id]);
        grantedCount++;
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    console.log(`✅ Granted ${grantedCount} permissions to super admin`);
    
    // Update admin user
    await connection.execute(`
      UPDATE users SET 
        role_name = 'super_admin',
        role_id = ?
      WHERE id = 35
    `, [superAdminId]);
    
    console.log('✅ Updated admin user role');
    
    // Final check
    const [finalCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM role_permissions rp
      INNER JOIN roles r ON rp.role_id = r.id
      WHERE r.name = 'super_admin'
    `);
    
    console.log(`✅ Super admin now has ${finalCount[0].count} permissions`);
    
    // Show what modules are available
    const [modules] = await connection.execute(`
      SELECT m.name, m.display_name, COUNT(p.id) as permission_count
      FROM modules m
      LEFT JOIN permissions p ON m.id = p.module_id AND p.is_active = 1
      WHERE m.is_active = 1
      GROUP BY m.id, m.name, m.display_name
      ORDER BY m.order_index
    `);
    
    console.log('\n📋 Available modules and permissions:');
    modules.forEach(module => {
      console.log(`  ${module.display_name}: ${module.permission_count} permissions`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

grantPermissions();
