const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('🔍 Checking user login credentials...\n');
    
    // Get all users
    const [users] = await pool.query('SELECT id, username, password FROM users ORDER BY id');
    
    console.log(`👥 Users in database (${users.length} total):`);
    for (const user of users) {
      console.log(`   User ${user.id}: "${user.username}" (password hash: ${user.password.substring(0, 20)}...)`);
    }
    
    console.log('\n🧪 Testing common passwords for priyankjp...');
    
    const priyankUser = users.find(u => u.username === 'priyankjp');
    if (!priyankUser) {
      console.log('❌ User priyankjp not found');
      process.exit(1);
    }
    
    const commonPasswords = [
      'admin123',
      'password',
      '123456',
      'priyankjp',
      'admin',
      'test123',
      '',
      'password123',
      '12345678',
      'qwerty123'
    ];
    
    console.log(`\n🔑 Testing passwords for user: ${priyankUser.username}`);
    let foundPassword = null;
    
    for (const testPassword of commonPasswords) {
      try {
        const isMatch = await bcrypt.compare(testPassword, priyankUser.password);
        if (isMatch) {
          console.log(`✅ Found matching password: "${testPassword}"`);
          foundPassword = testPassword;
          break;
        } else {
          console.log(`❌ Password "${testPassword}" doesn't match`);
        }
      } catch (error) {
        console.log(`❌ Error testing password "${testPassword}": ${error.message}`);
      }
    }
    
    if (!foundPassword) {
      console.log('\n💡 None of the common passwords worked.');
      console.log('Try using the admin user instead, or reset the password for priyankjp');
      
      // Test admin user
      const adminUser = users.find(u => u.username === 'admin');
      if (adminUser) {
        console.log('\n🔍 Testing admin user...');
        for (const testPassword of commonPasswords) {
          try {
            const isMatch = await bcrypt.compare(testPassword, adminUser.password);
            if (isMatch) {
              console.log(`✅ Admin password found: "${testPassword}"`);
              break;
            }
          } catch (error) {
            // Continue silently
          }
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
