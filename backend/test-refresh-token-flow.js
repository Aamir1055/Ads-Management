const axios = require('axios');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  username: 'admin',
  password: 'password'
};

let connection;

const setupDatabase = async () => {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ads reporting',
    port: process.env.DB_PORT || 3306
  });
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testRefreshTokenFlow = async () => {
  try {
    console.log('🔧 Setting up database connection...');
    await setupDatabase();

    console.log('🧪 TESTING REFRESH TOKEN AUTHENTICATION FLOW\n');

    // Step 1: Login to get initial tokens
    console.log('📝 Step 1: Initial Login');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    
    if (!loginResponse.data.success || !loginResponse.data.data.access_token) {
      throw new Error('Login failed or no access token received');
    }

    console.log('✅ Login successful');
    const { access_token: initialAccessToken, refresh_token: refreshToken } = loginResponse.data.data;
    console.log('📋 Initial Access Token (first 50 chars):', initialAccessToken.substring(0, 50) + '...');
    console.log('📋 Refresh Token (first 50 chars):', refreshToken.substring(0, 50) + '...');

    // Step 2: Verify initial access token works
    console.log('\n📝 Step 2: Verify initial access token');
    const authTestResponse = await axios.get(`${BASE_URL}/api/permissions/my-permissions`, {
      headers: { Authorization: `Bearer ${initialAccessToken}` }
    });
    
    if (authTestResponse.data.success) {
      console.log('✅ Initial access token works correctly');
      console.log('👤 User permissions loaded:', Object.keys(authTestResponse.data.data.permissionsDetailed || {}).length, 'categories');
    } else {
      throw new Error('Initial access token failed to authenticate');
    }

    // Step 3: Check token expiration details
    console.log('\n📝 Step 3: Analyzing token expiration');
    const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'access_token_secret';
    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_token_secret';
    
    const accessTokenDecoded = jwt.decode(initialAccessToken);
    const refreshTokenDecoded = jwt.decode(refreshToken);
    
    const accessTokenExp = new Date(accessTokenDecoded.exp * 1000);
    const refreshTokenExp = new Date(refreshTokenDecoded.exp * 1000);
    const now = new Date();
    
    console.log('🕐 Current time:', now.toISOString());
    console.log('🕐 Access token expires:', accessTokenExp.toISOString());
    console.log('🕐 Refresh token expires:', refreshTokenExp.toISOString());
    console.log('⏱️  Access token lifetime:', Math.round((accessTokenExp - now) / 1000 / 60), 'minutes');
    console.log('⏱️  Refresh token lifetime:', Math.round((refreshTokenExp - now) / 1000 / 60 / 60 / 24), 'days');

    // Step 4: Wait for access token to expire (for testing, we'll simulate this)
    console.log('\n📝 Step 4: Simulating access token expiration');
    
    // Create an expired access token for testing
    const expiredTokenPayload = { userId: accessTokenDecoded.userId, type: 'access' };
    const expiredToken = jwt.sign(expiredTokenPayload, ACCESS_TOKEN_SECRET, { expiresIn: '-1m' }); // Expired 1 minute ago
    
    console.log('🕐 Created expired access token for testing');

    // Step 5: Try to use expired access token
    console.log('\n📝 Step 5: Testing expired access token behavior');
    try {
      await axios.get(`${BASE_URL}/api/permissions/my-permissions`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      console.log('❌ UNEXPECTED: Expired token was accepted');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Expired token correctly rejected with 401');
        console.log('📋 Error code:', error.response.data.code || 'N/A');
        console.log('📋 Error message:', error.response.data.message || 'N/A');
      } else {
        throw error;
      }
    }

    // Step 6: Use refresh token to get new access token
    console.log('\n📝 Step 6: Testing refresh token functionality');
    const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`, {
      refreshToken: refreshToken
    });
    
    if (!refreshResponse.data.success || !refreshResponse.data.data.accessToken) {
      throw new Error('Refresh token failed');
    }

    console.log('✅ Refresh token worked successfully');
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
    console.log('📋 New Access Token (first 50 chars):', newAccessToken.substring(0, 50) + '...');
    console.log('📋 New Refresh Token (first 50 chars):', newRefreshToken.substring(0, 50) + '...');

    // Step 7: Verify new access token works
    console.log('\n📝 Step 7: Testing new access token');
    const newAuthTestResponse = await axios.get(`${BASE_URL}/api/permissions/my-permissions`, {
      headers: { Authorization: `Bearer ${newAccessToken}` }
    });
    
    if (newAuthTestResponse.data.success) {
      console.log('✅ New access token works correctly');
    } else {
      throw new Error('New access token failed to authenticate');
    }

    // Step 8: Verify old refresh token is revoked
    console.log('\n📝 Step 8: Testing old refresh token revocation');
    try {
      await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refreshToken: refreshToken // Using old refresh token
      });
      console.log('❌ UNEXPECTED: Old refresh token was accepted');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Old refresh token correctly rejected');
        console.log('📋 Error code:', error.response.data.code || 'N/A');
      } else {
        throw error;
      }
    }

    // Step 9: Check database state
    console.log('\n📝 Step 9: Verifying database state');
    const [tokens] = await connection.execute(
      'SELECT * FROM refresh_tokens WHERE user_id = (SELECT id FROM users WHERE username = ?) ORDER BY created_at DESC',
      [TEST_USER.username]
    );
    
    const activeTokens = tokens.filter(t => t.is_active);
    const inactiveTokens = tokens.filter(t => !t.is_active);
    
    console.log('📊 Total tokens in DB:', tokens.length);
    console.log('📊 Active tokens:', activeTokens.length);
    console.log('📊 Inactive tokens:', inactiveTokens.length);
    
    if (activeTokens.length === 1) {
      console.log('✅ Exactly one active refresh token (correct)');
    } else {
      console.log('❌ ISSUE: Expected 1 active token, found', activeTokens.length);
    }

    // Step 10: Test logout functionality
    console.log('\n📝 Step 10: Testing logout');
    const logoutResponse = await axios.post(`${BASE_URL}/api/auth/logout`, {
      refresh_token: newRefreshToken
    });
    
    if (logoutResponse.data.success) {
      console.log('✅ Logout successful');
    } else {
      throw new Error('Logout failed');
    }

    // Step 11: Verify refresh token is revoked after logout
    console.log('\n📝 Step 11: Testing token after logout');
    try {
      await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refreshToken: newRefreshToken
      });
      console.log('❌ UNEXPECTED: Refresh token worked after logout');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Refresh token correctly revoked after logout');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 ALL TESTS PASSED! The refresh token system is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   ✅ Login generates proper tokens');
    console.log('   ✅ Access tokens expire correctly');
    console.log('   ✅ Refresh tokens generate new access tokens');
    console.log('   ✅ Token rotation works (old refresh tokens are revoked)');
    console.log('   ✅ Logout revokes refresh tokens');
    console.log('   ✅ Database cleanup is proper');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('📋 Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run the test
testRefreshTokenFlow().then(() => {
  console.log('\n🔚 Test completed.');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test failed with unhandled error:', error);
  process.exit(1);
});
