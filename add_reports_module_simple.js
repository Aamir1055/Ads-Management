const { pool } = require('./config/database');

async function addReportsModule() {
  let connection;
  
  try {
    console.log('🔄 Adding Reports module to database...');
    
    connection = await pool.getConnection();
    
    // First, let's see what modules exist
    const [existingModules] = await connection.execute("SELECT * FROM modules ORDER BY id");
    console.log('\n📋 Existing modules:');
    existingModules.forEach(module => {
      console.log(`   - ${module.name} (${module.display_name}) -> ${module.href}`);
    });
    
    // Insert the Reports module
    const [insertResult] = await connection.execute(`
      INSERT INTO modules (name, display_name, description, icon, href, is_active, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
          display_name = VALUES(display_name),
          description = VALUES(description),
          icon = VALUES(icon),
          href = VALUES(href),
          is_active = VALUES(is_active),
          updated_at = NOW()
    `, ['Reports', 'Reports', 'Advertising campaign reports and analytics', 'BarChart3', '/reports', 1]);
    
    console.log(`✅ Insert result:`, insertResult);
    
    // Verify the module was added
    const [reportsModule] = await connection.execute("SELECT * FROM modules WHERE name = 'Reports'");
    
    if (reportsModule.length > 0) {
      console.log('✅ Reports module added successfully:');
      console.log('   ID:', reportsModule[0].id);
      console.log('   Name:', reportsModule[0].name);
      console.log('   Display Name:', reportsModule[0].display_name);
      console.log('   Href:', reportsModule[0].href);
      console.log('   Icon:', reportsModule[0].icon);
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
    
    // Check permissions
    const [reportsPermissions] = await connection.execute(`
      SELECT * FROM permissions 
      WHERE category = 'reports' OR category = 'Reports'
      ORDER BY name
    `);
    
    console.log(`\n🔐 Reports permissions (${reportsPermissions.length}):`);
    reportsPermissions.forEach(perm => {
      console.log(`   - ${perm.name}: ${perm.display_name} (module_id: ${perm.module_id})`);
    });
    
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
  addReportsModule()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addReportsModule };