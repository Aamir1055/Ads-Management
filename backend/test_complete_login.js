const speakeasy = require('speakeasy');
const fetch = require('node-fetch'); // You might need to install this

async function testCompleteLogin() {
  console.log('🔍 Testing complete login flow...\n');
  
  try {
    // Get user data first
    const { pool } = require('./config/database');
    const [users] = await pool.query(`
      SELECT id, username, auth_token 
      FROM users 
      WHERE is_2fa_enabled = 1 AND is_active = 1 
      LIMIT 1
    `);
    
    if (users.length === 0) {
      console.log('❌ No 2FA users found');
      return;
    }
    
    const user = users[0];
    console.log(`👤 Testing with user: ${user.username} (ID: ${user.id})`);
    
    // Generate current token
    const currentToken = speakeasy.totp({
      secret: user.auth_token,
      encoding: 'base32'
    });
    
    console.log(`🔐 Generated token: ${currentToken}`);
    
    // Test the 2FA login endpoint directly
    console.log('\\n🌐 Testing /api/auth/login-2fa endpoint...');
    
    const response = await fetch('http://localhost:5000/api/auth/login-2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user.id,
        token: currentToken
      })
    });
    
    const result = await response.json();
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response body:`, result);
    
    if (response.ok) {
      console.log('✅ 2FA login successful!');
    } else {
      console.log('❌ 2FA login failed!');
    }
    
    // Also test with a few different time windows
    console.log('\\n🕐 Testing different time windows...');
    
    for (let offset of [-60, -30, 0, 30, 60]) {
      const timeToken = speakeasy.totp({
        secret: user.auth_token,
        encoding: 'base32',
        time: (Date.now() / 1000) + offset
      });
      
      const timeResponse = await fetch('http://localhost:5000/api/auth/login-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          token: timeToken
        })
      });
      
      console.log(`Offset ${offset}s - Token: ${timeToken} - Status: ${timeResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

testCompleteLogin();
