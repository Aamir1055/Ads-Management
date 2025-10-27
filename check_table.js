const { pool } = require('./config/database');

async function checkTable() {
  try {
    console.log('📋 Users Table Structure:');
    console.log('========================');
    
    const [result] = await pool.query('DESCRIBE users');
    result.forEach(col => {
      console.log(`${col.Field} (${col.Type}) - Null: ${col.Null} - Key: ${col.Key} - Default: ${col.Default}`);
    });

    console.log('\n👤 Sample Users:');
    const [users] = await pool.query('SELECT * FROM users LIMIT 3');
    users.forEach(user => {
      console.log(`${user.id}: ${user.username} - Active: ${user.is_active}`);
      Object.keys(user).forEach(key => {
        if (key.toLowerCase().includes('pass')) {
          console.log(`  Password field: ${key} = ${user[key] ? 'Has value' : 'Empty'}`);
        }
      });
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();
