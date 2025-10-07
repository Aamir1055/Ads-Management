const http = require('http');

// Simple HTTP GET request function
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testReportsAPI() {
  console.log('🧪 Testing Reports API Response...\n');
  
  try {
    // Test the reports API endpoint
    const url = 'http://localhost:5000/api/reports?limit=3';
    console.log('📡 Making request to:', url);
    
    const response = await httpGet(url);
    
    if (response.success && response.data && response.data.length > 0) {
      console.log('✅ API Response received successfully');
      console.log('📊 Total records:', response.data.length);
      console.log('\n🔍 Examining first record:');
      
      const firstRecord = response.data[0];
      console.log('Record details:');
      console.log({
        id: firstRecord.id,
        campaign_name: firstRecord.campaign_name,
        brand_name: firstRecord.brand_name,  // This is what we're checking
        brand: firstRecord.brand,           // This is the brand ID
        leads: firstRecord.leads,
        spent: firstRecord.spent,
        report_date: firstRecord.report_date
      });
      
      console.log('\n🔍 Examining second record (if exists):');
      if (response.data[1]) {
        const secondRecord = response.data[1];
        console.log('Record details:');
        console.log({
          id: secondRecord.id,
          campaign_name: secondRecord.campaign_name,
          brand_name: secondRecord.brand_name,  // This is what we're checking
          brand: secondRecord.brand,           // This is the brand ID
          leads: secondRecord.leads,
          spent: secondRecord.spent,
          report_date: secondRecord.report_date
        });
      }
      
      console.log('\n📋 All brand names in response:');
      response.data.forEach((record, index) => {
        console.log(`${index + 1}. Campaign: "${record.campaign_name}" -> Brand: "${record.brand_name}"`);
      });
      
    } else {
      console.error('❌ API Response failed or empty');
      console.log('Response:', response);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nℹ️ Make sure the backend server is running on port 5000');
  }
}

// Run the test
testReportsAPI();
