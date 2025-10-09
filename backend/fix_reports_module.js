const { pool } = require('./config/database');

async function fixReportsModule() {
  let connection;
  
  try {
    console.log('🔄 Checking database structure and adding Reports module...');
    
    connection = await pool.getConnection();
    
    // Check the structure of modules table
    const [moduleColumns] = await connection.execute("DESCRIBE modules");
    console.log('\n📋 Modules table structure:');
    moduleColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
    });
    
    // Get existing modules
    const [existingModules] = await connection.execute("SELECT * FROM modules ORDER BY id");
    console.log('\n📋 Existing modules:');
    existingModules.forEach(module => {
      console.log(`   - ID: ${module.id}, Name: ${module.name}, Display: ${module.display_name}`);
    });
    
    // Insert the Reports module (without href since it doesn't exist)
    const [insertResult] = await connection.execute(`
      INSERT INTO modules (name, display_name, description, icon, is_active, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
          display_name = VALUES(display_name),
          description = VALUES(description),
          icon = VALUES(icon),
          is_active = VALUES(is_active),
          updated_at = NOW()
    `, ['Reports', 'Reports', 'Advertising campaign reports and analytics', 'BarChart3', 1]);
    
    console.log(`✅ Insert result - Affected rows: ${insertResult.affectedRows}, Insert ID: ${insertResult.insertId}`);
    
    // Verify the module was added
    const [reportsModule] = await connection.execute("SELECT * FROM modules WHERE name = 'Reports'");
    
    if (reportsModule.length > 0) {
      console.log('✅ Reports module added successfully:');
      console.log('   ID:', reportsModule[0].id);
      console.log('   Name:', reportsModule[0].name);
      console.log('   Display Name:', reportsModule[0].display_name);
      console.log('   Icon:', reportsModule[0].icon);
      console.log('   Active:', reportsModule[0].is_active);
    } else {
      console.log('❌ Reports module not found after insertion');
    }
    
    // Update existing reports permissions to link to the module
    const moduleId = reportsModule[0]?.id;
    if (moduleId) {
      const [updateResult] = await connection.execute(`
        UPDATE permissions 
        SET module_id = ? 
        WHERE category = 'reports' AND module_id IS NULL
      `, [moduleId]);
      
      console.log(`✅ Updated ${updateResult.affectedRows} permissions to link to Reports module`);
    }
    
    // Check permissions structure
    const [permissionColumns] = await connection.execute("DESCRIBE permissions");
    console.log('\n📋 Permissions table structure:');
    permissionColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check reports permissions
    const [reportsPermissions] = await connection.execute(`
      SELECT * FROM permissions 
      WHERE category = 'reports' OR category = 'Reports'
      ORDER BY name
    `);
    
    console.log(`\n🔐 Reports permissions (${reportsPermissions.length}):`);
    reportsPermissions.forEach(perm => {
      console.log(`   - ${perm.name}: ${perm.display_name} (module_id: ${perm.module_id})`);
    });
    
    // Check role permissions for reports
    const [rolePermissions] = await connection.execute(`
      SELECT 
          r.name as role_name,
          r.display_name as role_display_name,
          COUNT(p.id) as permissions_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id AND (p.category = 'reports' OR p.category = 'Reports')
      GROUP BY r.id, r.name, r.display_name
      HAVING permissions_count > 0
      ORDER BY r.name
    `);
    
    console.log('\n👥 Role permissions for reports:');
    if (rolePermissions.length > 0) {
      rolePermissions.forEach(rp => {
        console.log(`   - ${rp.role_display_name || rp.role_name}: ${rp.permissions_count} permissions`);
      });
    } else {
      console.log('   - No roles have reports permissions yet');
    }
    
    console.log('\n🎉 Reports Module Setup Complete!');
    console.log('\n🚀 Next Steps:');
    console.log('1. Refresh your frontend application');
    console.log('2. Log out and log back in');
    console.log('3. The Reports module should now appear in the sidebar');
    
    return { success: true, module: reportsModule[0], permissions: reportsPermissions };
    
  } catch (error) {
    console.error('❌ Failed to add Reports module:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Run the script
if (require.main === module) {
  fixReportsModule()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixReportsModule };
