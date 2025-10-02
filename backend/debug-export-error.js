const axios = require('axios');

async function debugExportError() {
  console.log('🔍 Debugging Export 500 Error...\n');
  
  try {
    // Test server health first
    console.log('1. Testing server health...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is healthy:', healthResponse.data.success);
    
    // Login
    console.log('\n2. Testing authentication...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.access_token;
    console.log('✅ Authentication successful');
    
    // Test the export endpoint with detailed error capture
    console.log('\n3. Testing export endpoint...');
    const exportUrl = 'http://localhost:5000/api/reports/export?date_from=2025-09-18&date_to=2025-09-25';
    
    try {
      const exportResponse = await axios.get(exportUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('✅ Export successful!');
      console.log('   Status:', exportResponse.status);
      console.log('   Content-Type:', exportResponse.headers['content-type']);
      console.log('   Data length:', exportResponse.data.length);
      
    } catch (exportError) {
      console.log('❌ Export failed with details:');
      console.log('   Status:', exportError.response?.status);
      console.log('   Status Text:', exportError.response?.statusText);
      
      if (exportError.response?.data) {
        if (Buffer.isBuffer(exportError.response.data)) {
          try {
            const errorText = exportError.response.data.toString('utf-8');
            console.log('   Error Response:', errorText);
            
            // Try to parse as JSON
            try {
              const errorJson = JSON.parse(errorText);
              console.log('   Parsed Error:', JSON.stringify(errorJson, null, 2));
            } catch {
              console.log('   Raw Error Text:', errorText);
            }
          } catch {
            console.log('   Could not decode error buffer');
          }
        } else {
          console.log('   Error Data:', exportError.response.data);
        }
      }
      
      if (exportError.message) {
        console.log('   Error Message:', exportError.message);
      }
      
      if (exportError.code) {
        console.log('   Error Code:', exportError.code);
      }
      
      // Check if it's a timeout
      if (exportError.code === 'ECONNABORTED') {
        console.log('   ⚠️  This appears to be a timeout error');
      }
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugExportError();
