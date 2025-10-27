const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';
// Let's try some common admin credentials
const TEST_USERS = [
  { username: 'admin', password: 'password' },
  { username: 'testadmin', password: 'password123' },
  { username: 'super_admin', password: 'password' }
];

async function testRefreshFlow() {
  let loginResponse;
  let TEST_USER;
  
  // Try to find a working user
  console.log('🔐 Testing refresh token flow...\n');
  
  for (const user of TEST_USERS) {
    try {
      console.log(`📝 Trying to login with: ${user.username}`);
      loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, user);
      if (loginResponse.data.success) {
        TEST_USER = user;
        console.log(`✅ Login successful with: ${user.username}`);
        break;
      }
    } catch (error) {
      console.log(`❌ Failed login with ${user.username}:`, error.response?.data?.message || error.message);
    }
  }
  
  if (!loginResponse || !loginResponse.data.success) {
    console.error('❌ Could not login with any test user');
    return;
  }
  
  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Analyzing login response');
    
    console.log('Login response status:', loginResponse.status);
    console.log('Login response structure:', Object.keys(loginResponse.data));
    
    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }
    
    const loginData = loginResponse.data.data;
    console.log('Login data keys:', Object.keys(loginData));
    
    // Check what tokens we got
    const accessToken = loginData.access_token;
    const refreshToken = loginData.refresh_token;
    
    console.log('✅ Access token:', accessToken ? 'Present' : 'MISSING');
    console.log('✅ Refresh token:', refreshToken ? 'Present' : 'MISSING');
    
    if (!accessToken) {
      console.error('❌ NO ACCESS TOKEN RECEIVED!');
      console.log('Full login response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }
    
    if (!refreshToken) {
      console.error('❌ NO REFRESH TOKEN RECEIVED!');
      console.log('Full login response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }

    // Step 2: Test access token
    console.log('\n📝 Step 2: Test access token');
    try {
      const testResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('✅ Access token works');
    } catch (error) {
      console.error('❌ Access token test failed:', error.response?.status, error.response?.data?.message);
    }

    // Step 3: Test refresh endpoint
    console.log('\n📝 Step 3: Test refresh endpoint');
    try {
      const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refreshToken: refreshToken
      });
      
      console.log('Refresh response status:', refreshResponse.status);
      console.log('✅ Refresh endpoint works');
      
      const newTokens = refreshResponse.data.data;
      console.log('New access token:', newTokens.accessToken ? 'Present' : 'MISSING');
      console.log('New refresh token:', newTokens.refreshToken ? 'Present' : 'MISSING');
      
    } catch (error) {
      console.error('❌ Refresh token test failed:', error.response?.status, error.response?.data?.message);
      if (error.response?.data) {
        console.log('Full error response:', JSON.stringify(error.response.data, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRefreshFlow();
