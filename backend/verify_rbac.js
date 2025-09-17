const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ads reporting'
};

async function verifyRBAC() {
  let connection;
  
  try {
    console.log('🔍 Verifying RBAC Setup...');
    connection = await mysql.createConnection(dbConfig);
    
    // Check if role_permissions table exists
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'role_permissions'
    `);
    
    if (tables.length === 0) {
      console.log('❌ Missing role_permissions table - creating it...');
      await connection.execute(`
        CREATE TABLE \`role_permissions\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`role_id\` int(11) NOT NULL,
          \`permission_id\` int(11) NOT NULL,
          \`granted_at\` timestamp NOT NULL DEFAULT current_timestamp(),
          \`granted_by\` int(11) DEFAULT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`unique_role_permission\` (\`role_id\`, \`permission_id\`),
          CONSTRAINT \`role_permissions_ibfk_1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`role_permissions_ibfk_2\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\` (\`id\`) ON DELETE CASCADE
        )
      `);
      console.log('✅ Created role_permissions table');
    } else {
      console.log('✅ role_permissions table exists');
    }
    
    // Check for brands module
    const [brandModule] = await connection.execute(`
      SELECT * FROM modules WHERE name = 'brands'
    `);
    
    if (brandModule.length === 0) {
      console.log('❌ Missing brands module - creating it...');
      await connection.execute(`
        INSERT INTO \`modules\` (\`name\`, \`display_name\`, \`description\`, \`icon\`, \`route\`, \`order_index\`, \`is_active\`) VALUES
        ('brands', 'Brand Management', 'Manage brands and brand information', 'tag', '/brands', 10, 1)
      `);
      console.log('✅ Created brands module');
    } else {
      console.log('✅ Brands module exists');
    }
    
    // Check for brand permissions
    const [brandPerms] = await connection.execute(`
      SELECT * FROM permissions WHERE name LIKE 'brands_%'
    `);
    
    if (brandPerms.length < 4) {
      console.log('❌ Missing brand permissions - creating them...');
      const brandModuleId = brandModule.length > 0 ? brandModule[0].id : 10;
      
      const brandPermissions = [
        ['brands_create', 'Create Brands', 'Create new brand entries'],
        ['brands_read', 'View Brands', 'View brand information'], 
        ['brands_update', 'Update Brands', 'Edit brand information'],
        ['brands_delete', 'Delete Brands', 'Delete brand entries']
      ];
      
      for (const [name, display_name, description] of brandPermissions) {
        try {
          await connection.execute(`
            INSERT IGNORE INTO \`permissions\` (\`name\`, \`display_name\`, \`description\`, \`category\`, \`is_active\`, \`module_id\`) VALUES
            (?, ?, ?, 'brands', 1, ?)
          `, [name, display_name, description, brandModuleId]);
        } catch (error) {
          // Ignore duplicate entries
        }
      }
      console.log('✅ Created brand permissions');
    } else {
      console.log('✅ Brand permissions exist');
    }
    
    // Check for super admin role
    const [superAdmin] = await connection.execute(`
      SELECT * FROM roles WHERE name = 'super_admin'
    `);
    
    if (superAdmin.length === 0) {
      console.log('❌ Missing super_admin role - creating it...');
      await connection.execute(`
        INSERT INTO \`roles\` (\`name\`, \`display_name\`, \`description\`, \`level\`, \`is_active\`, \`is_system_role\`) VALUES
        ('super_admin', 'Super Administrator', 'Full system access with all permissions', 10, 1, 1)
      `);
      console.log('✅ Created super_admin role');
    } else {
      console.log('✅ Super admin role exists');
    }
    
    // Get the super admin role ID
    const [superAdminRole] = await connection.execute(`
      SELECT id FROM roles WHERE name = 'super_admin'
    `);
    const superAdminId = superAdminRole[0].id;
    
    // Grant all permissions to super admin
    console.log('🔧 Granting all permissions to super admin...');
    await connection.execute(`
      INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`, \`granted_by\`)
      SELECT ?, p.id, 35
      FROM \`permissions\` p
      WHERE p.is_active = 1
    `, [superAdminId]);
    
    // Update admin user to use super_admin role
    await connection.execute(`
      UPDATE \`users\` SET 
        \`role_name\` = 'super_admin',
        \`role_id\` = ?
      WHERE \`id\` = 35
    `, [superAdminId]);
    
    console.log('✅ Updated admin user role assignment');
    
    // Display final status
    console.log('\n📊 Final Status:');
    
    const [finalModules] = await connection.execute("SELECT COUNT(*) as count FROM modules WHERE is_active = 1");
    console.log(`✅ Active Modules: ${finalModules[0].count}`);
    
    const [finalPerms] = await connection.execute("SELECT COUNT(*) as count FROM permissions WHERE is_active = 1");
    console.log(`✅ Active Permissions: ${finalPerms[0].count}`);
    
    const [finalRoles] = await connection.execute("SELECT COUNT(*) as count FROM roles WHERE is_active = 1");
    console.log(`✅ Active Roles: ${finalRoles[0].count}`);
    
    const [finalRolePerms] = await connection.execute("SELECT COUNT(*) as count FROM role_permissions");
    console.log(`✅ Role-Permission Assignments: ${finalRolePerms[0].count}`);
    
    const [adminUser] = await connection.execute(`
      SELECT u.username, u.role_name, r.display_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = 35
    `);
    
    if (adminUser.length > 0) {
      console.log(`✅ Admin User: ${adminUser[0].username} (${adminUser[0].role_name} - ${adminUser[0].display_name})`);
    }
    
    console.log('\n✅ RBAC verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyRBAC();
