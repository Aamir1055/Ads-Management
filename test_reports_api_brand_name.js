const axios = require('axios');

async function testReportsAPIBrandName() {
  try {
    console.log('🔍 Testing Reports API Brand Name Response...\n');

    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });

    const token = loginResponse.data.data.access_token;
    const headers = { 'Authorization': `Bearer ${token}` };

    // Test the reports endpoint that frontend actually uses
    console.log('📡 Testing GET /api/reports');
    
    const reportsResponse = await axios.get('http://localhost:5000/api/reports?limit=5', { headers });
    
    console.log('✅ API Response Status:', reportsResponse.status);
    console.log('✅ Success:', reportsResponse.data.success);
    console.log('✅ Data length:', reportsResponse.data.data?.length || 0);
    
    if (reportsResponse.data.data && reportsResponse.data.data.length > 0) {
      console.log('\n🔍 Analyzing Brand Name Field for Each Record:\n');
      
      reportsResponse.data.data.forEach((record, index) => {
        console.log(`${index + 1}. Record ID: ${record.id}`);
        console.log(`   Campaign: "${record.campaign_name}"`);
        console.log(`   Brand ID: ${record.brand} (${typeof record.brand})`);
        console.log(`   Brand Name: "${record.brand_name}" (${typeof record.brand_name})`);
        console.log(`   Brand Name exists: ${record.hasOwnProperty('brand_name')}`);
        console.log(`   Report Date: ${record.report_date}`);
        console.log('   ---');
      });
      
      // Check for specific campaigns
      const testCampaign = reportsResponse.data.data.find(r => r.campaign_name === 'Test');
      const aamirCampaign = reportsResponse.data.data.find(r => r.campaign_name === 'Aamir Ali');
      
      console.log('\n🎯 Target Campaign Analysis:');
      if (testCampaign) {
        console.log(`✅ "Test" campaign found:`);
        console.log(`   Brand ID: ${testCampaign.brand}`);
        console.log(`   Brand Name: "${testCampaign.brand_name}"`);
        console.log(`   Expected: "BazaarFX"`);
        console.log(`   Correct: ${testCampaign.brand_name === 'BazaarFX'}`);
      } else {
        console.log('❌ "Test" campaign not found');
      }
      
      if (aamirCampaign) {
        console.log(`✅ "Aamir Ali" campaign found:`);
        console.log(`   Brand ID: ${aamirCampaign.brand}`);
        console.log(`   Brand Name: "${aamirCampaign.brand_name}"`);
        console.log(`   Expected: "Tradekaro"`);
        console.log(`   Correct: ${aamirCampaign.brand_name === 'Tradekaro'}`);
      } else {
        console.log('❌ "Aamir Ali" campaign not found');
      }
    } else {
      console.log('❌ No data returned');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testReportsAPIBrandName();
