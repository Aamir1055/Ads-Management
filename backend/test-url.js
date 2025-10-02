const axios = require('axios');

async function testUrl() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });
    
    const token = loginResponse.data.data.access_token;
    console.log('✅ Authenticated');
    
    // Test the exact URL
    const exportUrl = 'http://localhost:5000/api/reports/export?date_from=2025-09-23&date_to=2025-09-23';
    console.log('🔗 Testing URL:', exportUrl);
    
    try {
      const response = await axios.get(exportUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      });
      
      console.log('✅ Success:', response.status);
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Data length:', response.data.length);
    } catch (error) {
      console.log('❌ Error:', error.response?.status);
      console.log('URL that was hit:', error.config?.url);
      
      if (error.response?.data) {
        if (Buffer.isBuffer(error.response.data)) {
          const errorText = error.response.data.toString('utf-8');
          console.log('Error response:', errorText);
        } else {
          console.log('Error response:', error.response.data);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Auth error:', error.message);
  }
}

testUrl();
