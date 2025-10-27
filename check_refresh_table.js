require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkRefreshTable() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ads reporting',
      port: process.env.DB_PORT || 3306
    });

    const [rows] = await connection.execute("SHOW TABLES LIKE 'refresh_tokens'");
    
    if (rows.length > 0) {
      console.log('✅ refresh_tokens table exists');
      
      // Check table structure
      const [structure] = await connection.execute('DESCRIBE refresh_tokens');
      console.log('\n📋 Table structure:');
      structure.forEach(col => {
        console.log(`   ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? '[' + col.Key + ']' : ''}`);
      });
      
      // Check existing tokens
      const [tokens] = await connection.execute('SELECT COUNT(*) as count FROM refresh_tokens');
      console.log(`\n📊 Total tokens in table: ${tokens[0].count}`);
    } else {
      console.log('❌ refresh_tokens table does NOT exist');
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkRefreshTable();
