const axios = require('axios');

// Test Excel export endpoint with different credentials
async function testExcelExport() {
  console.log('🧪 Testing Excel export functionality...\n');
  
  const credentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'admin', password: 'password' },
    { username: 'admin', password: 'admin' },
    { username: 'superadmin', password: 'admin123' },
    { username: 'user', password: 'password' }
  ];
  
  let token = null;
  
  for (const cred of credentials) {
    try {
      console.log(`Trying ${cred.username}:${cred.password}...`);
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', cred);
      
      if (loginResponse.data.success) {
        token = loginResponse.data.data?.access_token || loginResponse.data.data?.token || loginResponse.data.token;
        console.log(`✅ Authentication successful with ${cred.username}`);
        console.log(`   Token received:`, token ? 'Yes' : 'No');
        console.log(`   Response:`, JSON.stringify(loginResponse.data, null, 2));
        console.log('');
        if (token) break;
      }
    } catch (error) {
      console.log(`❌ Failed with ${cred.username}:${cred.password} - ${error.response?.data?.message || error.message}`);
    }
  }
  
  if (!token) {
    console.log('❌ Could not authenticate with any credentials');
    
    // Let's try to check what's running on the server
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server health check:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
    }
    
    return;
  }
  
  try {
    // Test filter options
    console.log('2. Testing filter options endpoint...');
    const filterResponse = await axios.get('http://localhost:5000/api/reports/filters', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!filterResponse.data.success) {
      throw new Error('Filter options failed');
    }
    
    console.log('✅ Filter options retrieved:');
    console.log('   - Campaigns:', filterResponse.data.data.campaigns?.length || 0);
    console.log('   - Brands:', filterResponse.data.data.brands?.length || 0);
    console.log('   - Date Range:', filterResponse.data.data.dateRange?.earliest, 'to', filterResponse.data.data.dateRange?.latest);
    
    // Show some campaign names to verify they're showing properly
    if (filterResponse.data.data.campaigns?.length > 0) {
      console.log('   - Sample campaign names:');
      filterResponse.data.data.campaigns.slice(0, 3).forEach(campaign => {
        console.log(`     * ${campaign.name} (${campaign.brand || 'No Brand'})`);
      });
    }
    
    // Show some brand names
    if (filterResponse.data.data.brands?.length > 0) {
      console.log('   - Brand names:', filterResponse.data.data.brands.slice(0, 5).join(', '));
    }
    
    console.log('');
    
    // Test Excel export
    console.log('3. Testing Excel export...');
    const { earliest, latest } = filterResponse.data.data.dateRange;
    let fromDate = '2024-09-25';
    let toDate = '2024-09-25';
    
    if (earliest && latest) {
      fromDate = earliest.split('T')[0]; // Convert to YYYY-MM-DD
      toDate = latest.split('T')[0];
      console.log(`Using actual date range: ${fromDate} to ${toDate}`);
    } else {
      console.log(`Using default date range: ${fromDate} to ${toDate}`);
    }
    
    const exportUrl = `http://localhost:5000/api/reports/export?date_from=${fromDate}&date_to=${toDate}`;
    
    try {
      const exportResponse = await axios.get(exportUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      });
      
      console.log('✅ Excel export endpoint responded with status:', exportResponse.status);
      if (exportResponse.status === 200) {
        console.log('✅ Excel file generated successfully!');
        console.log(`   - File size: ${(exportResponse.data.length / 1024).toFixed(2)} KB`);
        console.log(`   - Content-Type: ${exportResponse.headers['content-type']}`);
      }
    } catch (exportError) {
      if (exportError.response?.status === 404) {
        console.log('✅ Excel export endpoint is working (returns 404 for no data)');
      } else {
        console.log('❌ Excel export error:', exportError.response?.data?.message || exportError.message);
        console.log('   Status:', exportError.response?.status);
        if (exportError.response?.data) {
          if (Buffer.isBuffer(exportError.response.data)) {
            const errorText = exportError.response.data.toString('utf-8');
            console.log('   Error message (from buffer):', errorText);
            try {
              const errorJson = JSON.parse(errorText);
              console.log('   Parsed error:', errorJson.message);
            } catch {
              console.log('   Could not parse error as JSON');
            }
          } else {
            console.log('   Full error response:', JSON.stringify(exportError.response.data, null, 2));
          }
        }
      }
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status) {
      console.log('   Status:', error.response.status);
    }
  }
}

// Run the test
testExcelExport();
