const axios = require('axios');

async function testBackendReportsAPI() {
  try {
    console.log('🔍 Testing Backend Reports API Directly...\n');

    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });

    const token = loginResponse.data.data.access_token;
    const headers = { 'Authorization': `Bearer ${token}` };

    // Test with specific date filter to ensure we get data
    console.log('📋 Testing /reports with date filter:');
    const dateFrom = '2025-09-01';  // Include September 2025
    const dateTo = '2025-09-30';
    
    const reportsResponse = await axios.get(
      `http://localhost:5000/api/reports?date_from=${dateFrom}&date_to=${dateTo}&limit=50`, 
      { headers }
    );
    
    console.log('✅ API Response:');
    console.log('Status:', reportsResponse.status);
    console.log('Success:', reportsResponse.data.success);
    console.log('Message:', reportsResponse.data.message);
    console.log('Data length:', reportsResponse.data.data?.length || 0);
    console.log('Meta:', JSON.stringify(reportsResponse.data.meta, null, 2));
    
    if (reportsResponse.data.data && reportsResponse.data.data.length > 0) {
      console.log('\n📊 First Record Details:');
      const firstRecord = reportsResponse.data.data[0];
      console.log('All fields in first record:');
      Object.entries(firstRecord).forEach(([key, value]) => {
        console.log(`  • ${key}: ${value} (${typeof value})`);
      });
    } else {
      console.log('\n⚠️  No data returned. Checking without date filter...');
      
      const allReportsResponse = await axios.get('http://localhost:5000/api/reports', { headers });
      console.log('Without filter - Data length:', allReportsResponse.data.data?.length || 0);
      
      if (allReportsResponse.data.data && allReportsResponse.data.data.length > 0) {
        console.log('First record without filter:');
        const firstRecord = allReportsResponse.data.data[0];
        Object.entries(firstRecord).forEach(([key, value]) => {
          console.log(`  • ${key}: ${value} (${typeof value})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testBackendReportsAPI();
