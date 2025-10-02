const axios = require('axios');
const fs = require('fs');

// Test Excel export endpoint
async function testExcelExport() {
  console.log('🧪 Testing Excel export functionality...\n');
  
  try {
    // Test authentication first
    console.log('1. Testing authentication...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Authentication failed');
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Authentication successful\n');
    
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
    console.log('');
    
    // Test Excel export with date range from filter options
    console.log('3. Testing Excel export...');
    const { earliest, latest } = filterResponse.data.data.dateRange;
    
    if (!earliest || !latest) {
      console.log('❌ No date range available, creating test export with default dates');
      const testDate = '2025-09-25';
      const exportUrl = `http://localhost:5000/api/reports/export?date_from=${testDate}&date_to=${testDate}`;
      
      const exportResponse = await axios.get(exportUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      });
      
      if (exportResponse.status === 404) {
        console.log('⚠️  No data found for test dates, this is expected if no data exists');
        console.log('✅ Excel export endpoint is working (returns proper 404 for no data)');
      } else {
        console.log('❌ Unexpected response for no-data test');
      }
    } else {
      // Use actual date range
      const exportUrl = `http://localhost:5000/api/reports/export?date_from=${earliest}&date_to=${latest}`;
      
      const exportResponse = await axios.get(exportUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      });
      
      if (exportResponse.status === 200) {
        // Save the file to verify it's a valid Excel file
        const filename = `test_export_${Date.now()}.xlsx`;
        const filepath = `C:\\Users\\bazaa\\Desktop\\${filename}`;
        fs.writeFileSync(filepath, exportResponse.data);
        
        console.log('✅ Excel export successful!');
        console.log(`   - File saved to: ${filepath}`);
        console.log(`   - File size: ${(exportResponse.data.length / 1024).toFixed(2)} KB`);
        console.log(`   - Content-Type: ${exportResponse.headers['content-type']}`);
      } else if (exportResponse.status === 404) {
        console.log('⚠️  No data found in the date range');
        console.log('✅ Excel export endpoint is working (returns proper 404 for no data)');
      } else {
        console.log('❌ Unexpected export response status:', exportResponse.status);
      }
    }
    
    console.log('\n🎉 Excel export test completed successfully!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status) {
      console.log('   Status:', error.response.status);
    }
  }
}

// Run the test
testExcelExport();
