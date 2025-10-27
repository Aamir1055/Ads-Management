const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000
});

(async () => {
  try {
    console.log('🔐 Step 1: Authenticating...');
    
    const authResponse = await api.post('/auth/login', {
      username: 'admin',
      password: 'password'
    });
    
    console.log('✅ Authentication successful');
    const token = authResponse.data.data?.access_token;
    
    if (!token) {
      console.error('❌ No access token received');
      return;
    }
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('\n📊 Step 2: Testing API response structure...');
    
    const response = await api.get('/reports/generate', {
      params: {
        date_from: '2025-09-16',
        date_to: '2025-09-17'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    
    // Full response structure
    console.log('\n=== Full Response Structure ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.reports && response.data.data.reports.length > 0) {
      const firstReport = response.data.data.reports[0];
      console.log('\n=== First Report Object ===');
      console.log('Object keys:', Object.keys(firstReport));
      console.log('Full object:');
      console.log(JSON.stringify(firstReport, null, 2));
      
      console.log('\n=== Field Analysis ===');
      Object.entries(firstReport).forEach(([key, value]) => {
        console.log(`${key}: "${value}" (type: ${typeof value})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
})();
