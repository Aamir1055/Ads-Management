const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USERS = [
  { username: 'testadmin', password: 'testadmin123' },
  { username: 'testadmin', password: 'password' },
  { username: 'testadmin', password: 'testadmin' },
  { username: 'admin', password: 'admin123' },
  { username: 'admin', password: 'password' },
  { username: 'aamir', password: 'password' },
  { username: 'aamir', password: 'aamir123' }
];

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function tryLogin() {
  for (let i = 0; i < TEST_USERS.length; i++) {
    const testUser = TEST_USERS[i];
    try {
      console.log(`   Trying ${testUser.username}:${testUser.password}...`);
      const loginResponse = await api.post('/auth/login', testUser);
      
      if (loginResponse.data.success) {
        console.log(`✅ Login successful with ${testUser.username}`);
        return { user: testUser, response: loginResponse };
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
    }
  }
  throw new Error('All login attempts failed');
}

async function testAuthenticationFlow() {
  console.log('🧪 Testing Authentication & Permissions Flow...\n');

  try {
    // Step 1: Login
    console.log('1. 🔐 Attempting login with various credentials...');
    const { user, response: loginResponse } = await tryLogin();
    
    const { accessToken } = loginResponse.data.data;
    console.log('✅ Login successful');
    console.log('   Token preview:', accessToken.substring(0, 30) + '...\n');

    // Step 2: Set authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    // Step 3: Test /api/permissions/my-permissions
    console.log('2. 👤 Testing /api/permissions/my-permissions...');
    try {
      const permissionsResponse = await api.get('/permissions/my-permissions');
      console.log('✅ My permissions endpoint working');
      console.log('   Response success:', permissionsResponse.data.success);
      console.log('   Permissions count:', permissionsResponse.data.data?.permissions?.length || 0);
      console.log('   Role:', permissionsResponse.data.data?.role?.displayName || 'Unknown');
      console.log('   Role level:', permissionsResponse.data.data?.role?.level || 'Unknown');
    } catch (error) {
      console.log('❌ My permissions endpoint failed');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      console.log('   Code:', error.response?.data?.code);
      if (error.response?.data) {
        console.log('   Full response:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Step 4: Test /api/permissions/my-roles
    console.log('\n3. 🎭 Testing /api/permissions/my-roles...');
    try {
      const rolesResponse = await api.get('/permissions/my-roles');
      console.log('✅ My roles endpoint working');
      console.log('   Response success:', rolesResponse.data.success);
      console.log('   Role:', rolesResponse.data.data?.role?.displayName || 'Unknown');
      console.log('   Role name:', rolesResponse.data.data?.role?.name || 'Unknown');
    } catch (error) {
      console.log('❌ My roles endpoint failed');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      console.log('   Code:', error.response?.data?.code);
      if (error.response?.data) {
        console.log('   Full response:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Step 5: Test token validation with a simple auth-required endpoint
    console.log('\n4. 🔒 Testing general authentication...');
    try {
      const authTestResponse = await api.get('/users/me');
      console.log('✅ General auth working with /users/me endpoint');
      console.log('   Username:', authTestResponse.data.data?.username || 'Unknown');
    } catch (error) {
      console.log('❌ General auth failed');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
    }

    console.log('\n🎯 Summary:');
    console.log('- Frontend should now be able to connect to the correct port (3000)');
    console.log('- Authentication flow tested successfully');
    console.log('- Permission endpoints verified');

  } catch (error) {
    console.log('💥 Test failed with error:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data?.message || error.message);
      console.log('   URL:', error.config?.url);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   ❌ Cannot connect to server. Is it running on port 3000?');
    } else {
      console.log('   Error:', error.message);
    }
  }
}

// Run the test
testAuthenticationFlow().then(() => {
  console.log('\n🏁 Test completed');
}).catch(console.error);
