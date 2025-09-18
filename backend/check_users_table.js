const { pool } = require('./config/database');

(async () => {
  try {
    const [columns] = await pool.query('DESCRIBE users');
    console.log('Users table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });
    
    console.log('\nSample users:');
    const [users] = await pool.query('SELECT * FROM users LIMIT 3');
    users.forEach(user => {
      console.log(`  User ${user.id}: ${user.username}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
