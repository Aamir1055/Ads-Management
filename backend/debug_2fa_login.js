const User = require('./models/User');
const speakeasy = require('speakeasy');

async function debug2FALogin() {
  console.log('🔍 Starting 2FA Login Debug...\n');
  
  try {
    // Get all users with 2FA enabled
    console.log('📋 Getting users with 2FA enabled...');
    const { pool } = require('./config/database');
    const [users] = await pool.query(`
      SELECT id, username, auth_token, is_2fa_enabled 
      FROM users 
      WHERE is_2fa_enabled = 1 AND is_active = 1
    `);
    
    console.log(`Found ${users.length} users with 2FA enabled:`);
    users.forEach(user => {
      console.log(`- User ID: ${user.id}, Username: ${user.username}, Has Token: ${!!user.auth_token}`);
    });
    
    if (users.length === 0) {
      console.log('❌ No users with 2FA found!');
      return;
    }
    
    // Test with first user
    const testUser = users[0];
    console.log(`\n🧪 Testing with user: ${testUser.username} (ID: ${testUser.id})`);
    
    if (!testUser.auth_token) {
      console.log('❌ User has no auth_token stored!');
      return;
    }
    
    // Generate current TOTP token for this user's secret
    console.log(`\n🔐 Generating current TOTP token for user's secret...`);
    const currentToken = speakeasy.totp({
      secret: testUser.auth_token,
      encoding: 'base32'
    });
    
    console.log(`Current TOTP token: ${currentToken}`);
    console.log(`Secret (first 8 chars): ${testUser.auth_token.substring(0, 8)}...`);
    
    // Test manual verification
    console.log(`\n🔍 Manual TOTP verification test:`);
    const manualVerify = speakeasy.totp.verify({
      secret: testUser.auth_token,
      encoding: 'base32',
      token: currentToken,
      window: 2
    });
    console.log(`Manual verification result: ${manualVerify}`);
    
    // Test using User.verify2FA method
    console.log(`\n🔍 Testing User.verify2FA method:`);
    const modelVerify = await User.verify2FA(testUser.id, currentToken);
    console.log(`User.verify2FA result: ${modelVerify}`);
    
    // Test with previous/next tokens too (in case of time sync issues)
    console.log(`\n🕐 Testing time window tolerance:`);
    const prevToken = speakeasy.totp({
      secret: testUser.auth_token,
      encoding: 'base32',
      time: (Date.now() / 1000) - 30 // 30 seconds ago
    });
    
    const nextToken = speakeasy.totp({
      secret: testUser.auth_token,
      encoding: 'base32',
      time: (Date.now() / 1000) + 30 // 30 seconds in future
    });
    
    console.log(`Previous token (-30s): ${prevToken}`);
    console.log(`Next token (+30s): ${nextToken}`);
    
    const prevVerify = await User.verify2FA(testUser.id, prevToken);
    const nextVerify = await User.verify2FA(testUser.id, nextToken);
    
    console.log(`Previous token verification: ${prevVerify}`);
    console.log(`Next token verification: ${nextVerify}`);
    
    console.log(`\n✅ Use this token in your authenticator test: ${currentToken}`);
    console.log(`\n📝 Instructions:`);
    console.log(`1. Login with username: ${testUser.username}`);
    console.log(`2. When prompted for 2FA, enter: ${currentToken}`);
    console.log(`3. This token is valid for ~30 seconds from now`);
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
  
  process.exit(0);
}

debug2FALogin();
