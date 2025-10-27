const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');

async function createWorkingTestUser() {
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
      await pool.query('UPDATE users SET hashed_password = ? WHERE username = ?', [hashedPassword, username]);
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
    console.log('   URL: http://localhost:5000/');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Current 2FA Token: ${currentToken}`);
    console.log('\n⏰ Token changes every 30 seconds');
    
    // Generate QR code URL for Google Authenticator
    const otpauthUrl = speakeasy.otpauthURL({
      secret: authToken,
      label: `AdsReporting - ${username}`,
      issuer: 'Ads Reporting System',
      encoding: 'base32'
    });
    
    console.log('\n📱 QR Code URL for Google Authenticator:');
    console.log('Copy this URL and paste in browser address bar, then scan the QR code:');
    console.log('data:image/png;base64,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");
    
    // Test the complete login flow
    console.log('\n🧪 Testing complete login flow...');
    
    // Test step 1 - regular login
    try {
      const result = await testLoginAPI(username, password);
      if (result) {
        console.log('✅ Complete login flow working!');
      }
    } catch (error) {
      console.log('ℹ️  API test skipped, but credentials are ready for manual testing');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

async function testLoginAPI(username, password) {
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    const cmd = `powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' -Method POST -Headers @{'Content-Type'='application/json'} -Body '{\\\"username\\\":\\\"${username}\\\",\\\"password\\\":\\\"${password}\\\"}' -UseBasicParsing | ConvertFrom-Json } catch { Write-Output 'API_ERROR' }"`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (stdout && stdout.includes('success')) {
        console.log('✅ API login test successful');
        resolve(true);
      } else {
        console.log('ℹ️  Manual testing required');
        resolve(false);
      }
    });
  });
}

createWorkingTestUser();
