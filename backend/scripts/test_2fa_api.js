const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  username: 'testuser2fa',
  password: 'TestPassword123!',
  role_id: 2
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const testAPI = async () => {
  log('\n🧪 Starting 2FA API Tests', 'cyan');
  log('=' .repeat(50), 'blue');

  try {
    // Test 1: Check if server is running
    log('\n1. Testing server health...', 'yellow');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      log('✅ Server is running and healthy', 'green');
      log(`   Database: ${healthResponse.data.database?.status || 'unknown'}`, 'blue');
    } catch (error) {
      log('❌ Server is not running or unhealthy', 'red');
      log('   Please start your server with: npm start', 'yellow');
      return;
    }

    // Test 2: Create test user (if doesn't exist)
    log('\n2. Creating/checking test user...', 'yellow');
    try {
      const createUserResponse = await axios.post(`${BASE_URL}/api/users`, TEST_USER);
      log('✅ Test user created successfully', 'green');
      log(`   User ID: ${createUserResponse.data.data.user.id}`, 'blue');
    } catch (error) {
      if (error.response?.status === 409) {
        log('ℹ️  Test user already exists', 'blue');
      } else {
        log('❌ Failed to create test user', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
      }
    }

    // Test 3: Get 2FA info
    log('\n3. Testing 2FA info endpoint...', 'yellow');
    try {
      const infoResponse = await axios.get(`${BASE_URL}/api/2fa/info`);
      log('✅ 2FA info endpoint working', 'green');
      log(`   Supported apps: ${infoResponse.data.data.supported_apps.length} apps`, 'blue');
    } catch (error) {
      log('❌ 2FA info endpoint failed', 'red');
      log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
    }

    // Test 4: Check initial 2FA status
    log('\n4. Checking initial 2FA status...', 'yellow');
    try {
      const statusResponse = await axios.get(`${BASE_URL}/api/2fa/status/1`);
      log('✅ 2FA status endpoint working', 'green');
      log(`   2FA enabled: ${statusResponse.data.data.user.twofa_enabled}`, 'blue');
    } catch (error) {
      if (error.response?.status === 404) {
        log('ℹ️  User not found (use different user_id)', 'blue');
      } else {
        log('❌ 2FA status endpoint failed', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
      }
    }

    // Test 5: Try generating 2FA setup
    log('\n5. Testing 2FA setup generation...', 'yellow');
    try {
      const setupResponse = await axios.post(`${BASE_URL}/api/2fa/setup`, {
        username: TEST_USER.username
      });
      log('✅ 2FA setup generation working', 'green');
      log(`   QR code generated: ${setupResponse.data.data.qr_code ? 'Yes' : 'No'}`, 'blue');
      log(`   Manual key: ${setupResponse.data.data.manual_entry_key.substring(0, 8)}...`, 'blue');
    } catch (error) {
      if (error.response?.status === 404) {
        log('ℹ️  User not found (expected if user creation failed)', 'blue');
      } else if (error.response?.status === 409) {
        log('ℹ️  2FA already enabled for this user', 'blue');
      } else {
        log('❌ 2FA setup generation failed', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
      }
    }

    // Test 6: Test login endpoint
    log('\n6. Testing login endpoint...', 'yellow');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        username: TEST_USER.username,
        password: TEST_USER.password
      });
      log('✅ Login endpoint working', 'green');
      log(`   Requires 2FA: ${loginResponse.data.data.requires_2fa}`, 'blue');
      
      if (loginResponse.data.data.token) {
        log('   JWT token received', 'green');
      } else {
        log('   JWT token not received (2FA required)', 'blue');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        log('ℹ️  Invalid credentials (expected if user creation failed)', 'blue');
      } else {
        log('❌ Login endpoint failed', 'red');
        log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
      }
    }

    // Test 7: Test user list (should include 2FA status)
    log('\n7. Testing user list with 2FA status...', 'yellow');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/api/users`);
      log('✅ User list endpoint working', 'green');
      
      const usersWith2FA = usersResponse.data.data.users.filter(user => user.twofa_enabled);
      log(`   Total users: ${usersResponse.data.data.users.length}`, 'blue');
      log(`   Users with 2FA: ${usersWith2FA.length}`, 'blue');
      
      // Check if response includes twofa_enabled field
      const hasField = usersResponse.data.data.users.some(user => 'twofa_enabled' in user);
      log(`   2FA field included: ${hasField ? 'Yes' : 'No'}`, hasField ? 'green' : 'red');
    } catch (error) {
      log('❌ User list endpoint failed', 'red');
      log(`   Error: ${error.response?.data?.message || error.message}`, 'red');
    }

    // Test 8: Test invalid requests (error handling)
    log('\n8. Testing error handling...', 'yellow');
    try {
      await axios.post(`${BASE_URL}/api/2fa/verify-setup`, {
        user_id: 999999,
        token: 'invalid'
      });
      log('⚠️  Should have failed but didn\'t', 'yellow');
    } catch (error) {
      if (error.response?.status >= 400) {
        log('✅ Error handling working correctly', 'green');
        log(`   Status: ${error.response.status}, Message: ${error.response.data.message}`, 'blue');
      } else {
        log('❌ Unexpected error', 'red');
      }
    }

  } catch (error) {
    log('❌ Unexpected error during testing', 'red');
    log(`   ${error.message}`, 'red');
  }

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('🎉 2FA API Testing Complete!', 'cyan');
  log('\nNext steps:', 'yellow');
  log('1. Open Swagger UI: docs/2fa-swagger.html in your browser', 'blue');
  log('2. Import Postman collection: docs/2FA_Postman_Collection.json', 'blue');
  log('3. Use real authenticator app for complete testing', 'blue');
  log('4. Check cURL examples: docs/2FA_cURL_Examples.md', 'blue');
  log('\nTo enable 2FA for a user:', 'yellow');
  log('1. POST /api/2fa/setup (get QR code)', 'blue');
  log('2. Scan QR with Google Authenticator', 'blue');
  log('3. POST /api/2fa/verify-setup (with 6-digit code)', 'blue');
  log('4. Test login flow with 2FA required', 'blue');
};

// Run the tests
if (require.main === module) {
  testAPI().catch(error => {
    console.error('Test script failed:', error.message);
  });
}

module.exports = { testAPI };
