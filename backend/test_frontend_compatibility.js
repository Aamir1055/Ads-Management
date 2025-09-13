const axios = require('axios');

async function testFrontendCompatibility() {
  console.log('🔗 FRONTEND-BACKEND COMPATIBILITY TEST');
  console.log('====================================');

  const API_BASE = 'http://localhost:5000/api';
  let authToken = null;

  try {
    // 1. Login to get token
    console.log('\n1. 🔐 Authentication...');
    const login = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    authToken = login.data.data.access_token;
    console.log('✅ Authentication successful');

    const headers = { Authorization: `Bearer ${authToken}` };

    // 2. Test Frontend Service Endpoints
    console.log('\n2. 🌐 Testing Frontend Service Endpoints...');
    console.log('-------------------------------------------');

    const frontendEndpoints = [
      // From roleService.js
      { name: 'Roles List', url: `${API_BASE}/permissions/roles-list`, method: 'GET' },
      { name: 'All Modules', url: `${API_BASE}/permissions/modules`, method: 'GET' },
      { name: 'Modules with Permissions', url: `${API_BASE}/permissions/modules-with-permissions`, method: 'GET' },
      { name: 'All Permissions', url: `${API_BASE}/permissions`, method: 'GET' },
      { name: 'Role Permissions (ID: 1)', url: `${API_BASE}/permissions/role/1/permissions`, method: 'GET' },
    ];

    const workingEndpoints = [];
    const failingEndpoints = [];

    for (const endpoint of frontendEndpoints) {
      try {
        const response = await axios.get(endpoint.url, { headers });
        console.log(`✅ ${endpoint.name}: ${response.status} - Data available`);
        workingEndpoints.push(endpoint);
        
        // Show sample of data structure
        if (response.data.data) {
          console.log(`   Structure: {success, message, timestamp, data: ${Array.isArray(response.data.data) ? `array[${response.data.data.length}]` : typeof response.data.data}}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ${error.response?.status || 'Network Error'} - ${error.response?.data?.message || error.message}`);
        failingEndpoints.push({ ...endpoint, error: error.response?.status || 'Network Error' });
      }
    }

    // 3. Test Current Working Endpoints
    console.log('\n3. 🔄 Testing Current Working Endpoints...');
    console.log('------------------------------------------');
    
    const currentEndpoints = [
      { name: 'User Management - Get Users', url: `${API_BASE}/user-management`, method: 'GET' },
      { name: 'User Management - Get Roles', url: `${API_BASE}/user-management/roles`, method: 'GET' },
    ];

    for (const endpoint of currentEndpoints) {
      try {
        const response = await axios.get(endpoint.url, { headers });
        console.log(`✅ ${endpoint.name}: Available and working`);
        
        // Show structure
        if (response.data.data) {
          if (response.data.data.roles) {
            console.log(`   Roles: ${response.data.data.roles.length} roles found`);
          } else if (response.data.data.users) {
            console.log(`   Users: ${response.data.data.users.length} users found`);
          } else if (Array.isArray(response.data.data)) {
            console.log(`   Data: ${response.data.data.length} items found`);
          }
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    // 4. Test Role Creation Endpoint
    console.log('\n4. 🛠️  Testing Role Creation Flow...');
    console.log('-----------------------------------');
    
    try {
      // Test creating a role (the endpoint frontend expects)
      const testRoleName = `test_frontend_role_${Date.now()}`;
      const testEndpoints = [
        // Frontend expects this endpoint
        { name: 'Create Role (Frontend expects)', url: `${API_BASE}/permissions/role`, method: 'POST' },
        // What we actually have
        { name: 'Create Role (Current)', url: `${API_BASE}/user-management`, method: 'POST' },
      ];

      for (const endpoint of testEndpoints) {
        try {
          const testData = endpoint.url.includes('permissions') 
            ? { name: testRoleName, description: 'Test role from compatibility test' }
            : { username: testRoleName, password: 'test123', confirmPassword: 'test123', role_id: 4, is_active: true };

          const response = await axios.post(endpoint.url, testData, { headers });
          console.log(`✅ ${endpoint.name}: ${response.status} - Success`);
          
          // Clean up if successful
          if (response.data.data?.id) {
            try {
              await axios.delete(`${API_BASE}/user-management/${response.data.data.id}`, { headers });
              console.log('   🧹 Cleanup successful');
            } catch (cleanupError) {
              console.log('   ⚠️  Cleanup failed');
            }
          }
        } catch (error) {
          console.log(`❌ ${endpoint.name}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ Role creation test failed: ${error.message}`);
    }

    // 5. Summary and Recommendations
    console.log('\n5. 📊 COMPATIBILITY ANALYSIS');
    console.log('=============================');
    
    console.log(`\n✅ Working Endpoints: ${workingEndpoints.length}`);
    workingEndpoints.forEach(ep => console.log(`   • ${ep.name}`));
    
    console.log(`\n❌ Failing Endpoints: ${failingEndpoints.length}`);
    failingEndpoints.forEach(ep => console.log(`   • ${ep.name} (${ep.error})`));

    console.log('\n🔧 REQUIRED FIXES:');
    console.log('==================');
    
    if (failingEndpoints.length > 0) {
      console.log('1. Frontend expects these permission endpoints:');
      failingEndpoints.forEach(ep => {
        if (ep.url.includes('/permissions/')) {
          console.log(`   • ${ep.url} (${ep.method})`);
        }
      });
      
      console.log('\n2. Backend needs to provide:');
      console.log('   • /api/permissions/roles-list - Get all roles');
      console.log('   • /api/permissions/modules-with-permissions - Get modules and their permissions');
      console.log('   • /api/permissions/role - Create new role');
      console.log('   • /api/permissions/role/assign - Assign permissions to role');
    }

    console.log('\n✨ CURRENT STATUS:');
    if (workingEndpoints.length >= failingEndpoints.length) {
      console.log('🎉 Backend is mostly compatible with frontend!');
      console.log('   Main functionality should work with minor adjustments.');
    } else {
      console.log('⚠️  Significant compatibility issues found.');
      console.log('   Backend endpoints need to be aligned with frontend expectations.');
    }

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  }
}

testFrontendCompatibility();
