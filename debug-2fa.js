const mysql = require('mysql2/promise');
const speakeasy = require('speakeasy');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ads_reporting',
  port: process.env.DB_PORT || 3306
};

async function debug2FA() {
  let connection;
  
  try {
    console.log('🔍 2FA Debug Tool');
    console.log('==================\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected\n');
    
    // Get all users with 2FA enabled
    const [users] = await connection.execute(`
      SELECT id, username, auth_token, is_2fa_enabled, created_at, updated_at 
      FROM users 
      WHERE is_2fa_enabled = 1 AND is_active = 1
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Found ${users.length} users with 2FA enabled:\n`);
    
    for (const user of users) {
      console.log(`👤 User: ${user.username} (ID: ${user.id})`);
      console.log(`🔐 2FA Enabled: ${user.is_2fa_enabled}`);
      console.log(`🔑 Auth Token: ${user.auth_token ? user.auth_token.substring(0, 10) + '...' : 'NULL'}`);
      console.log(`📅 Created: ${user.created_at}`);
      console.log(`🔄 Updated: ${user.updated_at}\n`);
      
      if (user.auth_token) {
        // Test token generation
        try {
          const currentToken = speakeasy.totp({
            secret: user.auth_token,
            encoding: 'base32'
          });
          console.log(`🧪 Current TOTP token for ${user.username}: ${currentToken}`);
          
          // Test verification with current token
          const isValid = speakeasy.totp.verify({
            secret: user.auth_token,
            encoding: 'base32',
            token: currentToken,
            window: 2
          });
          console.log(`✅ Token verification: ${isValid ? 'VALID' : 'INVALID'}\n`);
          
          // Show QR code URL for manual comparison
          const qrUrl = speakeasy.otpauthURL({
            secret: user.auth_token,
            label: `AdsReporting - ${user.username}`,
            issuer: 'Ads Reporting System',
            encoding: 'base32'
          });
          console.log(`🔗 OTP Auth URL: ${qrUrl}\n`);
          
        } catch (error) {
          console.error(`❌ Error generating token for ${user.username}:`, error.message);
        }
      } else {
        console.log(`⚠️  ${user.username} has 2FA enabled but no auth_token!\n`);
      }
      
      console.log('─'.repeat(50) + '\n');
    }
    
    if (users.length === 0) {
      console.log('⚠️  No users with 2FA enabled found.');
      console.log('💡 Create a user with 2FA enabled first, then run this debug tool.');
    }
    
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
    console.log('\n🔧 Make sure:');
    console.log('1. Database is running and accessible');
    console.log('2. Environment variables are set correctly');
    console.log('3. speakeasy package is installed');
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run debug
debug2FA();
