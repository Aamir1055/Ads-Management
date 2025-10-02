const axios = require('axios');

async function debugRawReportsAPI() {
  try {
    console.log('🔍 Debugging Raw Reports API Response...\n');

    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });

    const token = loginResponse.data.data.access_token;
    const headers = { 'Authorization': `Bearer ${token}` };

    // Test Reports API and show raw response
    console.log('📋 Raw Reports API Response (/reports):');
    const reportsResponse = await axios.get('http://localhost:5000/api/reports', { headers });
    
    console.log('Full Response Structure:');
    console.log(JSON.stringify(reportsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugRawReportsAPI();
