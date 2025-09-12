const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testLoginCredentials() {
  console.log('🔍 Testing login credentials for 2FA users...\n');
  
  try {
    const { pool } = require('./config/database');
    
    // Get 2FA users with their hashed passwords
    const [users] = await pool.query(`
      SELECT id, username, hashed_password, is_2fa_enabled 
      FROM users 
      WHERE is_2fa_enabled = 1 AND is_active = 1
    `);
    
    console.log(`Found ${users.length} users with 2FA enabled:`);
    
    // Test common passwords
    const commonPasswords = ['admin123', 'password123', 'testpass123', 'Password123', '123456'];
    
    for (const user of users) {
      console.log(`\n👤 Testing user: ${user.username} (ID: ${user.id})`);
      
      for (const password of commonPasswords) {
        const isMatch = await bcrypt.compare(password, user.hashed_password);
        if (isMatch) {
          console.log(`✅ FOUND MATCHING PASSWORD for ${user.username}: "${password}"`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

testLoginCredentials();
