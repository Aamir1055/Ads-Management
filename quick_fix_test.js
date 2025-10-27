const axios = require('axios');

async function quickTest() {
  const API_BASE = 'http://localhost:5000/api';
  
  console.log('🔧 Quick Fix Test');
  console.log('=================');

  try {
    // Login
    const login = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const authToken = login.data.data.access_token;
    const headers = { Authorization: `Bearer ${authToken}` };

    // Test Users with proper response handling
    console.log('\n1. Testing User Management...');
    const users = await axios.get(`${API_BASE}/user-management`, { headers });
    if (users.data.data && Array.isArray(users.data.data)) {
      console.log(`✅ Users: ${users.data.data.length} users found`);
      users.data.data.slice(0, 3).forEach(user => {
        console.log(`   • ${user.username} (${user.role_name || 'No role'}) - Active: ${user.is_active}`);
      });
    } else {
      console.log('⚠️  Users: Unexpected response structure');
      console.log(JSON.stringify(users.data, null, 2).substring(0, 200) + '...');
    }

    // Test Roles with proper response handling  
    console.log('\n2. Testing Role Management...');
    const roles = await axios.get(`${API_BASE}/user-management/roles`, { headers });
    if (roles.data.data && roles.data.data.roles) {
      const roleList = roles.data.data.roles;
      console.log(`✅ Roles: ${roleList.length} roles found`);
      roleList.forEach(role => {
        console.log(`   • ${role.name} (Level ${role.level}) - "${role.display_name}"`);
      });
    } else {
      console.log('⚠️  Roles: Unexpected response structure');
    }

    // Test user creation with proper fields
    console.log('\n3. Testing User Creation...');
    const testUser = {
      username: `test_${Date.now()}`,
      password: 'testpass123',
      confirmPassword: 'testpass123', // Add missing field
      role_id: 4,
      is_active: true
    };

    try {
      const createResponse = await axios.post(`${API_BASE}/user-management`, testUser, { headers });
      console.log(`✅ User Created: ${createResponse.status} - ${JSON.stringify(createResponse.data)}`);
      
      // Try to delete if successful
      if (createResponse.data.data?.id) {
        const deleteResponse = await axios.delete(`${API_BASE}/user-management/${createResponse.data.data.id}`, { headers });
        console.log(`✅ User Deleted: ${deleteResponse.status}`);
      }
    } catch (createError) {
      console.log(`❌ User Creation: ${createError.response?.status} - ${createError.response?.data?.message || createError.message}`);
    }

    // Check what permission endpoints exist
    console.log('\n4. Testing Permission Endpoints...');
    const permissionTests = [
      '/api/permissions',
      '/api/permissions/user', 
      '/api/permissions/all',
      '/api/user-management/permissions'
    ];

    for (const endpoint of permissionTests) {
      try {
        const response = await axios.get(`http://localhost:5000${endpoint}`, { headers });
        console.log(`✅ ${endpoint}: ${response.status} - Found data`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickTest();
