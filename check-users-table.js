const { pool } = require('./config/database');

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure...\n');
    
    const [columns] = await pool.query('SHOW COLUMNS FROM users');
    console.log('👥 Users table columns:');
    columns.forEach(col => console.log(`   ${col.Field}: ${col.Type}`));
    
    console.log('\n📊 Sample user data:');
    const [users] = await pool.query('SELECT * FROM users WHERE username = "Aamir" LIMIT 1');
    if (users.length > 0) {
      console.log('Found Aamir:', Object.keys(users[0]));
      console.table(users[0]);
    } else {
      console.log('No user found with username Aamir');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersTable();
