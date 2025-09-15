const User = require('./models/User');
const { pool } = require('./config/database');

/**
 * Test script to create a user with 2FA enabled for testing the new first-login setup flow
 */
async function createTestUser() {
  try {
    console.log('🧪 Creating test user with 2FA enabled...');
    
    // Create a test user with 2FA enabled but no secret
    const userData = {
      username: 'testuser2fa',
      password: 'TestPassword123!',
      confirm_password: 'TestPassword123!',
      role_id: 2, // Assuming role 2 exists (user role)
      enable_2fa: true // Enable 2FA but don't generate secret yet
    };
    
    const result = await User.create(userData, 'system');
    
    console.log('✅ Test user created successfully:');
    console.log('Username:', result.user.username);
    console.log('ID:', result.user.id);
    console.log('2FA Enabled:', result.user.is_2fa_enabled);
    console.log('Has Secret:', !!result.user.auth_token);
    
    console.log('\n📋 Test Instructions:');
    console.log('1. Start the frontend and backend servers');
    console.log('2. Go to the login page');
    console.log('3. Login with credentials:');
    console.log('   Username: testuser2fa');
    console.log('   Password: TestPassword123!');
    console.log('4. The system should show the QR code setup screen');
    console.log('5. Scan the QR code with your authenticator app');
    console.log('6. Enter the 6-digit code to complete setup');
    console.log('7. Subsequent logins should use regular 2FA flow');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    process.exit(0);
  }
}

// Check if user already exists first
async function checkAndCreateUser() {
  try {
    const existingUser = await User.findByUsername('testuser2fa');
    if (existingUser) {
      console.log('⚠️  Test user already exists');
      console.log('Username: testuser2fa');
      console.log('2FA Enabled:', existingUser.is_2fa_enabled);
      console.log('Has Secret:', !!existingUser.auth_token);
      
      if (existingUser.is_2fa_enabled && !existingUser.auth_token) {
        console.log('✅ User is ready for 2FA setup testing');
      } else if (existingUser.is_2fa_enabled && existingUser.auth_token) {
        console.log('⚠️  User already has 2FA configured. Delete and recreate to test setup flow.');
      }
    } else {
      await createTestUser();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndCreateUser();
