const axios = require('axios');

(async () => {
  try {
    console.log('🔍 Testing API response for brand data...\n');
    
    // Test the generate report endpoint
    const response = await axios.get('http://localhost:5000/api/reports/generate', {
      params: {
        date_from: '2024-01-01',
        date_to: '2024-12-31'
      },
      timeout: 10000
    });
    
    console.log('✅ API Response received');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    
    if (response.data.data && response.data.data.reports) {
      const reports = response.data.data.reports;
      console.log('\n📊 Reports data:');
      console.log('Total records:', reports.length);
      
      if (reports.length > 0) {
        console.log('\n🔍 First 3 records:');
        reports.slice(0, 3).forEach((record, idx) => {
          console.log(`\nRecord ${idx + 1}:`);
          console.log('  ID:', record.id);
          console.log('  Campaign:', record.campaign_name);
          console.log('  Brand:', `"${record.brand}" (type: ${typeof record.brand})`);
          console.log('  Brand ID:', record.brand_id);
          console.log('  Leads:', record.leads, '(type:', typeof record.leads, ')');
          console.log('  Cost per lead:', record.cost_per_lead, '(type:', typeof record.cost_per_lead, ')');
          console.log('  Report date:', record.report_date);
        });
        
        // Check if any brand values are numbers (which would indicate the bug)
        const brandTypes = reports.map(r => typeof r.brand).filter((type, idx, arr) => arr.indexOf(type) === idx);
        console.log('\n🧐 Brand field types found:', brandTypes);
        
        const numericBrands = reports.filter(r => typeof r.brand === 'number' || !isNaN(Number(r.brand)));
        if (numericBrands.length > 0) {
          console.log('\n❌ Found numeric brand values (this is the bug!):');
          numericBrands.slice(0, 3).forEach((record, idx) => {
            console.log(`  Record ${idx + 1}: brand="${record.brand}" (type: ${typeof record.brand})`);
          });
        } else {
          console.log('\n✅ All brand values are strings (names), no bug detected');
        }
      }
    } else {
      console.log('❌ No reports data found in response');
    }
    
  } catch (error) {
    console.error('❌ API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
})();
