const axios = require('axios');

async function debugLogin() {
  const API_BASE = 'http://localhost:5000/api';
  
  console.log('🔍 Debug Login API');
  console.log('==================');

  try {
    console.log('\n1. Testing with admin123...');
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    }, {
      validateStatus: () => true // Don't throw on 4xx/5xx
    });

    console.log(`Status: ${response.status}`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('Response headers:', response.headers);

  } catch (error) {
    console.error('Request failed:', error.message);
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', error.response.data);
    }
  }

  // Try other credentials
  const credentials = [
    { username: 'admin', password: 'admin' },
    { username: 'admin', password: 'password' },
    { username: 'aamir', password: 'aamir' },
    { username: 'testadmin', password: 'testadmin' }
  ];

  for (const cred of credentials) {
    try {
      console.log(`\n2. Testing ${cred.username}/${cred.password}...`);
      const response = await axios.post(`${API_BASE}/auth/login`, cred, {
        validateStatus: () => true
      });
      console.log(`   Status: ${response.status} - ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
}

debugLogin();
