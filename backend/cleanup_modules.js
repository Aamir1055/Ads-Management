// cleanup_modules.js - Remove unnecessary modules and their permissions
require('dotenv').config();
const { pool } = require('./config/database');

const cleanupModules = async () => {
  try {
    console.log('🧹 Starting module cleanup...');
    
    // First, show what we're working with
    console.log('\n📊 Current modules:');
    const [currentModules] = await pool.query(`
      SELECT 
        m.id, 
        m.module_name, 
        m.description,
        COUNT(p.id) as permission_count
      FROM modules m 
      LEFT JOIN permissions p ON m.id = p.module_id 
      GROUP BY m.id, m.module_name, m.description
      ORDER BY m.module_name
    `);
    
    console.table(currentModules);
    
    const modulesToRemove = [
      'auth',
      'dashboard', 
      'test_module_1757582394075',
      'test_module_1757582490860'
    ];
    
    console.log(`\n🗑️  Removing modules: ${modulesToRemove.join(', ')}`);
    
    // Remove role permissions for these modules first
    console.log('   Removing role permissions...');
    const [deleteRolePerms] = await pool.query(`
      DELETE rp FROM role_permissions rp 
      INNER JOIN permissions p ON rp.permission_id = p.id 
      INNER JOIN modules m ON p.module_id = m.id 
      WHERE m.module_name IN (?, ?, ?, ?)
    `, modulesToRemove);
    
    console.log(`   ✅ Removed ${deleteRolePerms.affectedRows} role permission assignments`);
    
    // Remove permissions for these modules
    console.log('   Removing permissions...');
    const [deletePerms] = await pool.query(`
      DELETE p FROM permissions p 
      INNER JOIN modules m ON p.module_id = m.id 
      WHERE m.module_name IN (?, ?, ?, ?)
    `, modulesToRemove);
    
    console.log(`   ✅ Removed ${deletePerms.affectedRows} permissions`);
    
    // Remove the modules themselves
    console.log('   Removing modules...');
    const [deleteModules] = await pool.query(`
      DELETE FROM modules 
      WHERE module_name IN (?, ?, ?, ?)
    `, modulesToRemove);
    
    console.log(`   ✅ Removed ${deleteModules.affectedRows} modules`);
    
    // Show remaining modules
    console.log('\n📊 Remaining modules:');
    const [remainingModules] = await pool.query(`
      SELECT 
        m.id, 
        m.module_name, 
        m.description,
        COUNT(p.id) as permission_count
      FROM modules m 
      LEFT JOIN permissions p ON m.id = p.module_id 
      GROUP BY m.id, m.module_name, m.description
      ORDER BY m.module_name
    `);
    
    console.table(remainingModules);
    
    console.log('\n✨ Module cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    process.exit(0);
  }
};

// Run the cleanup
cleanupModules();
