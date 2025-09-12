const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');

async function createSimpleTestUser() {
  console.log('🔧 Creating test user with known credentials...\n');
  
  try {
    const { pool } = require('./config/database');
    
    // Create user with known password
    const username = 'testuser2fa';
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Use the same working 2FA secret from ahmed
    const authToken = 'GYZTCUTVKVTEEUB4LJRGIYZDNZDUSRJX';
    
    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    
    if (existing.length > 0) {
      console.log('⚠️  Test user already exists. Updating password...');
      await pool.query('UPDATE users SET hashed_password = ?, auth_token = ? WHERE username = ?', [hashedPassword, authToken, username]);
    } else {
      // Create new user
      await pool.query(`
        INSERT INTO users (username, hashed_password, role_id, auth_token, is_2fa_enabled, is_active, created_at, updated_at)
        VALUES (?, ?, 2, ?, 1, 1, NOW(), NOW())
      `, [username, hashedPassword, authToken]);
      console.log('✅ Created new test user');
    }
    
    // Generate current token
    const currentToken = speakeasy.totp({
      secret: authToken,
      encoding: 'base32'
    });
    
    console.log('🎉 Test User Ready!');
    console.log('📋 Login Credentials:');
    console.log('   URL: http://localhost:3001/');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Current 2FA Token: ${currentToken}`);
    console.log('\n⏰ Token changes every 30 seconds');
    
    console.log('\n📱 For Google Authenticator:');
    console.log('   Manual Entry Secret: GYZTCUTVKVTEEUB4LJRGIYZDNZDUSRJX');
    console.log('   Account Name: AdsReporting - testuser2fa');
    console.log('   Issuer: Ads Reporting System');
    
    console.log('\n🧪 Now try logging in at the frontend!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

createSimpleTestUser();
