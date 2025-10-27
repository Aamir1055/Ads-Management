const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function debugUserObject() {
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

    console.log('🔍 Full login response:');
    console.log(JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.data.access_token;
    console.log('✅ Login successful, token obtained');

    // Create a test endpoint to debug the user object
    console.log('\n🧪 Testing user object on a working endpoint...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/health`, {
      headers: { 'Authorization': `Bearer ${token}` },
      validateStatus: () => true
    });

    console.log('\n🔍 Analytics health response:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }
}

debugUserObject();
