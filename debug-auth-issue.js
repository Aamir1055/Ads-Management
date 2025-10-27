const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAuth() {
  try {
    console.log('🔍 Testing authentication issue...\n');

    // Step 1: Test login to get a valid token
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'testadmin',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log('Token received:', loginResponse.data.data.accessToken.substring(0, 50) + '...');
      
      const token = loginResponse.data.data.accessToken;
      
      // Step 2: Test the permission endpoints with the token
      console.log('\n2. Testing my-permissions endpoint with token...');
      try {
        const permissionsResponse = await axios.get(`${API_BASE}/permissions/my-permissions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ my-permissions endpoint successful');
        console.log('Permissions:', permissionsResponse.data.data.permissions);
      } catch (error) {
        console.log('❌ my-permissions endpoint failed:');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data);
      }
      
      console.log('\n3. Testing my-roles endpoint with token...');
      try {
        const rolesResponse = await axios.get(`${API_BASE}/permissions/my-roles`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ my-roles endpoint successful');
        console.log('Roles:', rolesResponse.data.data.role);
      } catch (error) {
        console.log('❌ my-roles endpoint failed:');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Test without token first
async function testWithoutToken() {
  console.log('4. Testing my-permissions endpoint WITHOUT token...');
  try {
    const response = await axios.get(`${API_BASE}/permissions/my-permissions`);
    console.log('✅ Unexpected success without token');
  } catch (error) {
    console.log('❌ Expected failure without token:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
  }
}

async function runAllTests() {
  await testAuth();
  console.log('\n' + '='.repeat(50) + '\n');
  await testWithoutToken();
}

runAllTests();
