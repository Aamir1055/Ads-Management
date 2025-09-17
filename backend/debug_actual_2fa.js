const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

async function debugActual2FA() {
  console.log('🔍 Debugging 2FA with actual database values...\n');
  
  try {
    const { pool } = require('./config/database');
    
    // Get user "ahmed" (ID 14) - visible in your screenshot
    const [users] = await pool.query(`
      SELECT id, username, auth_token, is_2fa_enabled, hashed_password 
      FROM users 
      WHERE username = 'ahmed' AND is_active = 1
    `);
    
    if (users.length === 0) {
      console.log('❌ User "ahmed" not found');
      return;
    }
    
    const user = users[0];
    console.log('👤 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   2FA Enabled: ${user.is_2fa_enabled}`);
    console.log(`   Auth Token: ${user.auth_token}`);
    
    if (!user.auth_token) {
      console.log('❌ No auth token stored for this user!');
      return;
    }
    
    // Generate QR code URL to compare with what you scanned
    console.log('\n📱 Generating QR Code URL...');
    const otpauthUrl = speakeasy.otpauthURL({
      secret: user.auth_token,
      label: `AdsReporting - ${user.username}`,
      issuer: 'Ads Reporting System',
      encoding: 'base32'
    });
    
    console.log('OTPAuth URL:', otpauthUrl);
    
    // Generate QR code
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    console.log('\nQR Code (scan this with your authenticator):');
    console.log(qrCodeDataUrl);
    
    // Generate current TOTP token
    const currentToken = speakeasy.totp({
      secret: user.auth_token,
      encoding: 'base32'
    });
    
    console.log(`\n🔐 Current TOTP Token: ${currentToken}`);
    
    // Test verification with the current token
    const isValid = speakeasy.totp.verify({
      secret: user.auth_token,
      encoding: 'base32',
      token: currentToken,
      window: 2
    });
    
    console.log(`✅ Token verification: ${isValid}`);
    
    // Generate tokens for the next few time windows
    console.log('\n🕐 Next few tokens:');
    for (let i = 0; i < 3; i++) {
      const futureToken = speakeasy.totp({
        secret: user.auth_token,
        encoding: 'base32',
        time: (Date.now() / 1000) + (i * 30)
      });
      console.log(`   +${i * 30}s: ${futureToken}`);
    }
    
    // Test common passwords for this user
    console.log('\n🔑 Testing common passwords...');
    const bcrypt = require('bcryptjs');
    const commonPasswords = ['password123', 'admin123', 'testpass123', 'Password123', '123456', 'ahmed123', 'ahmed'];
    
    for (const password of commonPasswords) {
      const isMatch = await bcrypt.compare(password, user.hashed_password);
      if (isMatch) {
        console.log(`✅ FOUND PASSWORD: "${password}"`);
        
        console.log(`\n📋 Complete Login Instructions:`);
        console.log(`1. Go to: http://localhost:5000/`);
        console.log(`2. Username: ${user.username}`);
        console.log(`3. Password: ${password}`);
        console.log(`4. 2FA Token: ${currentToken} (or from your Google Authenticator)`);
        console.log(`\n⚠️  Make sure your Google Authenticator is using the QR code above!`);
        break;
      }
    }
    
    // Test API login
    console.log('\n🧪 Testing API login...');
    
    // We'll test with a known working password if found
    // For now, let's just test the 2FA part directly
    console.log('Testing 2FA endpoint directly...');
    
    const { exec } = require('child_process');
    const cmd = `powershell -Command "Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login-2fa' -Method POST -Headers @{'Content-Type'='application/json'} -Body '{\\\"user_id\\\":${user.id},\\\"token\\\":\\\"${currentToken}\\\"}' -UseBasicParsing | Select-Object -ExpandProperty Content"`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.log('API Test Error:', error.message);
      } else {
        console.log('API Test Result:', stdout);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugActual2FA();
