const mysql = require('mysql2/promise');

async function checkTables() {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'ads reporting',
      port: 3306
    });
    
    console.log('🔍 Checking database tables...');
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('📋 Available tables:', tables.map(t => Object.values(t)[0]));
    
    // Check specific tables
    const requiredTables = ['campaigns', 'reports', 'permissions', 'role_permissions', 'modules', 'roles'];
    for (const table of requiredTables) {
      try {
        const [count] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${count[0].count} records`);
      } catch (error) {
        console.log(`❌ ${table}: Missing or error - ${error.message}`);
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

checkTables();
