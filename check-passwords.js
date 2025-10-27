require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkPasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Get all users with their hashed passwords
    const [users] = await connection.execute(`
      SELECT username, hashed_password 
      FROM users 
      WHERE username IN ('ahmed', 'aamir', 'testadmin')
    `);
    
    console.log('User password hashes:');
    users.forEach(user => {
      console.log(`${user.username}: ${user.hashed_password}`);
    });

    // Test common passwords
    const testPasswords = ['Admin123!', 'password', '123456', 'admin'];
    
    for (const user of users) {
      console.log(`\nTesting passwords for ${user.username}:`);
      for (const testPassword of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(testPassword, user.hashed_password);
          if (isMatch) {
            console.log(`✓ ${user.username} password is: ${testPassword}`);
          }
        } catch (error) {
          console.log(`Error testing ${testPassword} for ${user.username}:`, error.message);
        }
      }
    }

  } finally {
    await connection.end();
  }
}

checkPasswords().catch(console.error);
