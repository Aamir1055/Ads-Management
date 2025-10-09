const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ads reporting',
  charset: 'utf8mb4'
};

async function checkAdminUser() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Showing all tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Available tables:');
    console.table(tables);
    
    console.log('\n🔍 Checking users table structure...');
    const [structure] = await connection.execute('DESCRIBE users');
    console.log('Users table structure:');
    console.table(structure);
    
    console.log('\n🔍 Checking admin user credentials...');
    
    const [users] = await connection.execute(`
      SELECT *
      FROM users
      WHERE username = 'admin' OR id = 35
      ORDER BY id
    `);
    
    console.log('Admin users found:');
    console.table(users);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkAdminUser().catch(console.error);