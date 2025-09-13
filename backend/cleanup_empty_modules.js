// cleanup_empty_modules.js - Remove modules that have no permissions (no actual API endpoints)
require('dotenv').config();
const { pool } = require('./config/database');

const cleanupEmptyModules = async () => {
  try {
    console.log('🧹 Finding and removing empty modules (modules with no permissions)...');
    
    // First, show what modules have no permissions
    console.log('\n📊 Modules with no permissions:');
    const [emptyModules] = await pool.query(`
      SELECT 
        m.id, 
        m.module_name, 
        m.description,
        COUNT(p.id) as permission_count
      FROM modules m 
      LEFT JOIN permissions p ON m.id = p.module_id 
      GROUP BY m.id, m.module_name, m.description
      HAVING COUNT(p.id) = 0
      ORDER BY m.module_name
    `);
    
    if (emptyModules.length === 0) {
      console.log('✅ No empty modules found!');
      return;
    }
    
    console.table(emptyModules);
    
    const moduleNamesToRemove = emptyModules.map(m => m.module_name);
    console.log(`\n🗑️  Removing empty modules: ${moduleNamesToRemove.join(', ')}`);
    
    // Remove any role permissions first (should be none, but just in case)
    console.log('   Checking for role permissions...');
    const [deleteRolePerms] = await pool.query(`
      DELETE rp FROM role_permissions rp 
      INNER JOIN permissions p ON rp.permission_id = p.id 
      INNER JOIN modules m ON p.module_id = m.id 
      WHERE m.id IN (${emptyModules.map(() => '?').join(',')})
    `, emptyModules.map(m => m.id));
    
    console.log(`   ✅ Removed ${deleteRolePerms.affectedRows} role permission assignments`);
    
    // Remove the modules themselves
    console.log('   Removing empty modules...');
    const [deleteModules] = await pool.query(`
      DELETE FROM modules 
      WHERE id IN (${emptyModules.map(() => '?').join(',')})
    `, emptyModules.map(m => m.id));
    
    console.log(`   ✅ Removed ${deleteModules.affectedRows} empty modules`);
    
    // Show remaining modules with permissions
    console.log('\n📊 Remaining modules (only those with actual API endpoints):');
    const [remainingModules] = await pool.query(`
      SELECT 
        m.id, 
        m.module_name, 
        m.description,
        COUNT(p.id) as permission_count
      FROM modules m 
      LEFT JOIN permissions p ON m.id = p.module_id 
      GROUP BY m.id, m.module_name, m.description
      HAVING COUNT(p.id) > 0
      ORDER BY m.module_name
    `);
    
    console.table(remainingModules);
    
    console.log('\n✨ Empty module cleanup completed successfully!');
    console.log('Now only modules with actual API endpoints will be shown in role management.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    process.exit(0);
  }
};

// Run the cleanup
cleanupEmptyModules();
