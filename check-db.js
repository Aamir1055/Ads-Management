const mysql = require('mysql2/promise');

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: '77.42.45.79',
    user: 'adsuser',
    password: 'AdsPass123!',
    database: 'ads_management'
  });

  console.log('✅ Connected to database\n');

  // Check tables
  const [tables] = await connection.query('SHOW TABLES');
  console.log('📋 Tables in database:');
  tables.forEach(row => {
    const tableName = Object.values(row)[0];
    console.log(`  - ${tableName}`);
  });

  // Check if users table exists
  const hasUsersTable = tables.some(row => Object.values(row)[0] === 'users');
  
  if (hasUsersTable) {
    const [users] = await connection.query('SELECT id, username, email, role FROM users');
    console.log(`\n👥 Users (${users.length} total):`);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - Role: ${user.role}`);
    });
  } else {
    console.log('\n⚠️  No users table found - database needs to be initialized');
  }

  await connection.end();
}

checkDatabase().catch(console.error);
