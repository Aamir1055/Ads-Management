const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test credentials (testadmin user we created)
const testCredentials = {
  username: 'testadmin',
  password: 'password123'
};

async function testPermissionEndpoints() {
  try {
    console.log('🔐 Testing Permission Endpoints...\n');

    // Step 1: Login to get access token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, testCredentials);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    const accessToken = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');

    // Setup headers for authenticated requests
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test /api/permissions/my-permissions
    console.log('\n2️⃣ Testing /api/permissions/my-permissions...');
    try {
      const myPermissionsResponse = await axios.get(`${API_BASE}/permissions/my-permissions`, { headers });
      console.log('✅ My permissions endpoint working');
      console.log('📋 User permissions:', myPermissionsResponse.data.data?.permissions?.length || 0, 'permissions');
      console.log('🎭 User role:', myPermissionsResponse.data.data?.role?.name || 'Unknown');
    } catch (error) {
      console.log('❌ My permissions endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Step 3: Test /api/permissions/my-roles
    console.log('\n3️⃣ Testing /api/permissions/my-roles...');
    try {
      const myRolesResponse = await axios.get(`${API_BASE}/permissions/my-roles`, { headers });
      console.log('✅ My roles endpoint working');
      console.log('🎭 User role:', myRolesResponse.data.data?.role?.name || 'Unknown');
    } catch (error) {
      console.log('❌ My roles endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Step 4: Test /api/permissions/roles (if admin)
    console.log('\n4️⃣ Testing /api/permissions/roles...');
    try {
      const rolesResponse = await axios.get(`${API_BASE}/permissions/roles`, { headers });
      console.log('✅ Roles endpoint working');
      console.log('📋 Available roles:', rolesResponse.data.data?.length || 0, 'roles');
    } catch (error) {
      console.log('❌ Roles endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
      if (error.response?.status === 403) {
        console.log('ℹ️  This is expected if user doesn\'t have admin permissions');
      }
    }

    // Step 5: Test /api/permissions/permissions (if admin)
    console.log('\n5️⃣ Testing /api/permissions/permissions...');
    try {
      const permissionsResponse = await axios.get(`${API_BASE}/permissions/permissions`, { headers });
      console.log('✅ Permissions endpoint working');
      console.log('📋 Available permissions:', permissionsResponse.data.data?.permissions?.length || 0, 'permissions');
    } catch (error) {
      console.log('❌ Permissions endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
      if (error.response?.status === 403) {
        console.log('ℹ️  This is expected if user doesn\'t have admin permissions');
      }
    }

    console.log('\n✨ Permission endpoints test completed!');

  } catch (error) {
    console.error('🚨 Test failed:', error.message);
    if (error.response) {
      console.error('📄 Response:', error.response.data);
    }
  }
}

// Run the test
testPermissionEndpoints();
