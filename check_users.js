const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  try {
    const [users] = await pool.query(`
      SELECT username, hashed_password, is_active 
      FROM users 
      WHERE username IN ('admin', 'aamir', 'testadmin') 
      ORDER BY username
    `);

    console.log('🔍 Admin User Credentials Check:');
    console.log('===============================');

    for (const user of users) {
      console.log(`\n👤 Username: ${user.username}`);
      console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log(`   Has Password: ${user.hashed_password ? 'Yes' : 'No'}`);
      
      if (user.hashed_password) {
        console.log(`   Hash Sample: ${user.hashed_password.substring(0, 30)}...`);
        
        // Test common passwords
        const commonPasswords = ['admin', 'password', '123456', 'admin123', user.username];
        
        for (const testPass of commonPasswords) {
          try {
            const isMatch = await bcrypt.compare(testPass, user.hashed_password);
            if (isMatch) {
              console.log(`   ✅ PASSWORD FOUND: "${testPass}"`);
              break;
            }
          } catch (error) {
            // Skip if hash comparison fails
          }
        }
      }
    }

    // Also check if there are any users without password hashes
    const [noPassUsers] = await pool.query(`
      SELECT username, is_active 
      FROM users 
      WHERE (hashed_password IS NULL OR hashed_password = '') 
      AND is_active = 1
      LIMIT 5
    `);

    if (noPassUsers.length > 0) {
      console.log('\n⚠️  Users without passwords:');
      noPassUsers.forEach(user => {
        console.log(`   • ${user.username}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
