const mysql = require('mysql2/promise');

async function checkTableStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ads reporting'
  });
  
  try {
    console.log('🔍 CHECKING TABLE STRUCTURES');
    console.log('============================\n');

    const tables = ['roles', 'permissions', 'modules', 'role_permissions', 'user_roles', 'users'];
    
    for (const table of tables) {
      console.log(`📋 ${table} table structure:`);
      
      try {
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        columns.forEach(col => {
          console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${col.Key ? col.Key : ''}`);
        });
        console.log();
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkTableStructure().catch(console.error);
