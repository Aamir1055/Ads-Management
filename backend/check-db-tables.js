const { pool } = require('./config/database');

async function checkTables() {
  try {
    console.log('🔍 Checking for role-related tables...');
    
    // Show all tables
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('📋 All tables:', tableNames);
    
    // Check for role-related tables
    const roleTables = tableNames.filter(t => t.toLowerCase().includes('role'));
    console.log('🎭 Role-related tables:', roleTables);
    
    // Check brands module in modules table
    const [modules] = await pool.query('SELECT * FROM modules WHERE name = ? OR display_name LIKE ?', ['brands', '%brand%']);
    console.log('🏷️ Brands module:', modules);
    
    // Check role permissions for roles module
    const [rolePermissions] = await pool.query(`
      SELECT p.*, m.name as module_name 
      FROM permissions p 
      JOIN modules m ON p.module_id = m.id 
      WHERE m.name = 'roles' OR p.name LIKE 'roles_%'
    `);
    console.log('🎭 Role permissions:', rolePermissions);
    
    // Check brand permissions
    const [brandPermissions] = await pool.query(`
      SELECT p.*, m.name as module_name 
      FROM permissions p 
      JOIN modules m ON p.module_id = m.id 
      WHERE m.name = 'brands' OR p.name LIKE 'brands_%'
    `);
    console.log('🏷️ Brand permissions:', brandPermissions);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkTables();
