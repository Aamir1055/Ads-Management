const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkIndiaPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'ads reporting'
  });

  try {
    // Get India user data
    const [users] = await connection.execute(
      'SELECT id, username, hashed_password, role_id, is_active FROM users WHERE username = ?', 
      ['India']
    );

    if (users.length === 0) {
      console.log('India user not found');
      return;
    }

    const user = users[0];
    console.log('India user found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role ID: ${user.role_id}`);
    console.log(`  Active: ${user.is_active}`);
    console.log(`  Password hash: ${user.hashed_password.substring(0, 20)}...`);

    // Try common passwords
    const commonPasswords = ['India123', 'password', 'india123', 'india', 'India', '123456', 'test123'];
    
    console.log('\nTrying common passwords...');
    for (const password of commonPasswords) {
      try {
        const isMatch = await bcrypt.compare(password, user.hashed_password);
        if (isMatch) {
          console.log(`✅ FOUND PASSWORD: ${password}`);
          return password;
        } else {
          console.log(`❌ ${password} - no match`);
        }
      } catch (error) {
        console.log(`❌ ${password} - error checking: ${error.message}`);
      }
    }
    
    console.log('\n❌ None of the common passwords worked');
    console.log('You may need to reset the password for India user');
    
  } finally {
    await connection.end();
  }
}

checkIndiaPassword().catch(console.error);
