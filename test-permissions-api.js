const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  username: 'testadmin',
  password: 'testadmin123'
};

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function testPermissionsAPI() {
  console.log('🧪 Testing Permissions API...\n');

  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await api.post('/auth/login', TEST_USER);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const { accessToken } = loginResponse.data.data;
    console.log('✅ Login successful');
    console.log('   Token preview:', accessToken.substring(0, 20) + '...\n');

    // Set authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    // Step 2: Test /api/permissions/my-permissions
    console.log('2. Testing /api/permissions/my-permissions...');
    try {
      const permissionsResponse = await api.get('/permissions/my-permissions');
      console.log('✅ My permissions endpoint working');
      console.log('   Permissions count:', permissionsResponse.data.data?.permissions?.length || 0);
      console.log('   Role:', permissionsResponse.data.data?.role?.displayName || 'Unknown');
    } catch (error) {
      console.log('❌ My permissions endpoint failed');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      console.log('   Code:', error.response?.data?.code);
    }

    // Step 3: Test /api/permissions/my-roles
    console.log('\n3. Testing /api/permissions/my-roles...');
    try {
      const rolesResponse = await api.get('/permissions/my-roles');
      console.log('✅ My roles endpoint working');
      console.log('   Role:', rolesResponse.data.data?.role?.displayName || 'Unknown');
    } catch (error) {
      console.log('❌ My roles endpoint failed');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      console.log('   Code:', error.response?.data?.code);
    }

    // Step 4: Test health endpoint (should work without auth)
    console.log('\n4. Testing health endpoint...');
    delete api.defaults.headers.common['Authorization'];
    try {
      const healthResponse = await api.get('/health');
      console.log('✅ Health endpoint working');
      console.log('   Server status:', healthResponse.data.success ? 'OK' : 'Error');
    } catch (error) {
      console.log('❌ Health endpoint failed');
      console.log('   Status:', error.response?.status);
    }

  } catch (error) {
    console.log('💥 Test failed with error:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data?.message || error.message);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('   Error:', error.message);
    }
  }
}

// Run the test
testPermissionsAPI().then(() => {
  console.log('\n🏁 Test completed');
}).catch(console.error);
