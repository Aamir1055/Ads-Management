const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function debugEndpoints() {
  try {
    console.log('🔐 Logging in...');
    
    // Login first  
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'password'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.data.access_token;
    console.log('✅ Login successful, token obtained');

    // Test endpoints one by one with detailed error reporting
    const endpoints = [
      { name: 'Dashboard', url: '/api/dashboard' },
      { name: 'Profile', url: '/api/user-management/profile' },
      { name: 'Permissions', url: '/api/permissions' }
    ];

    for (const endpoint of endpoints) {
      console.log(`\n🧪 Testing ${endpoint.name}: ${endpoint.url}`);
      
      try {
        const response = await axios.get(`${BASE_URL}${endpoint.url}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: () => true // Don't throw on HTTP error status
        });

        if (response.status === 200 && response.data.success) {
          console.log(`✅ ${endpoint.name}: SUCCESS`);
          console.log(`   📊 Response keys:`, Object.keys(response.data));
        } else {
          console.log(`❌ ${endpoint.name}: FAILED (${response.status})`);
          console.log(`   💬 Message:`, response.data.message || 'No message');
          if (response.data.error) {
            console.log(`   🔍 Error:`, response.data.error);
          }
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ERROR`);
        console.log(`   🔍 Error:`, error.message);
        if (error.response?.data) {
          console.log(`   📝 Response:`, error.response.data);
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }
}

debugEndpoints();
