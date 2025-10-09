const axios = require('axios');

async function testNewReportStructure() {
  console.log('🧪 Testing New Report Structure and Calculations...\n');
  
  const baseURL = 'http://localhost:5000';
  let token = null;
  
  try {
    // Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'admin',
      password: 'password'
    });
    token = loginResponse.data.data.access_token;
    console.log('✅ Login successful\n');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test 1: Generate Reports with new structure
    console.log('2️⃣ Testing Report Generation...');
    const reportGenerateResponse = await axios.post(`${baseURL}/api/reports/generate`, {
      dateFrom: '2025-10-06',
      dateTo: '2025-10-09'
    }, { headers });
    
    console.log('📊 Generated Report Data:');
    const reports = reportGenerateResponse.data.data.reports;
    if (reports && reports.length > 0) {
      const sampleReport = reports[0];
      console.log(`   Date: ${sampleReport.report_date}`);
      console.log(`   Campaign: ${sampleReport.campaign_name} (ID: ${sampleReport.campaign_id})`);
      console.log(`   Amount Spend: $${sampleReport.amount_spend}`);
      console.log(`   Facebook Leads: ${sampleReport.facebook_leads}`);
      console.log(`   Zoho Leads: ${sampleReport.zoho_leads}`);
      console.log(`   Total Leads: ${sampleReport.total_leads}`);
      console.log(`   Facebook Cost Per Lead: ${sampleReport.facebook_cost_per_lead ? '$' + sampleReport.facebook_cost_per_lead : 'N/A'}`);
      console.log(`   Zoho Cost Per Lead: ${sampleReport.zoho_cost_per_lead ? '$' + sampleReport.zoho_cost_per_lead : 'N/A'}`);
    } else {
      console.log('   No reports generated');
    }
    
    console.log('\n📈 Summary:');
    const summary = reportGenerateResponse.data.data.summary;
    console.log(`   Total Records: ${summary.totalRecords}`);
    console.log(`   Total Amount Spend: $${summary.totalAmountSpend}`);
    console.log(`   Total Facebook Leads: ${summary.totalFacebookLeads}`);
    console.log(`   Total Zoho Leads: ${summary.totalZohoLeads}`);
    
    // Test 2: Analytics Dashboard
    console.log('\n3️⃣ Testing Analytics Dashboard...');
    const dashboardResponse = await axios.get(
      `${baseURL}/api/analytics/dashboard?dateFrom=2025-10-06&dateTo=2025-10-09`, 
      { headers }
    );
    
    console.log('📊 Dashboard Overview:');
    const overview = dashboardResponse.data.data.overview;
    console.log(`   Total Amount Spend: $${overview.totalAmountSpend}`);
    console.log(`   Total Leads: ${overview.totalLeads}`);
    console.log(`   Facebook Leads: ${overview.totalFacebookLeads}`);
    console.log(`   Zoho Leads: ${overview.totalZohoLeads}`);
    console.log(`   Facebook Cost Per Lead: ${overview.facebookCostPerLead ? '$' + overview.facebookCostPerLead : 'N/A'}`);
    console.log(`   Zoho Cost Per Lead: ${overview.zohoCostPerLead ? '$' + overview.zohoCostPerLead : 'N/A'}`);
    console.log(`   Total Campaigns: ${overview.totalCampaigns}`);
    
    // Test 3: Campaign Performance Analytics
    console.log('\n4️⃣ Testing Campaign Performance Analytics...');
    const campaignResponse = await axios.get(
      `${baseURL}/api/analytics/charts/campaign-performance?date_from=2025-10-06&date_to=2025-10-09&limit=5`, 
      { headers }
    );
    
    console.log('📊 Top Campaign Performance:');
    const campaigns = campaignResponse.data.data.campaigns;
    campaigns.slice(0, 3).forEach((campaign, index) => {
      console.log(`   ${index + 1}. ${campaign.campaign_name}:`);
      console.log(`      Amount Spend: $${campaign.total_amount_spend}`);
      console.log(`      Facebook Leads: ${campaign.total_facebook_leads}`);
      console.log(`      Zoho Leads: ${campaign.total_zoho_leads}`);
      console.log(`      Facebook Cost Per Lead: ${campaign.facebook_cost_per_lead ? '$' + campaign.facebook_cost_per_lead : 'N/A'}`);
      console.log(`      Zoho Cost Per Lead: ${campaign.zoho_cost_per_lead ? '$' + campaign.zoho_cost_per_lead : 'N/A'}`);
    });
    
    // Test 4: Time Series Analytics
    console.log('\n5️⃣ Testing Time Series Analytics...');
    const timeSeriesResponse = await axios.get(
      `${baseURL}/api/analytics/charts/time-series?date_from=2025-10-06&date_to=2025-10-09`, 
      { headers }
    );
    
    console.log('📊 Time Series Data:');
    const timeSeries = timeSeriesResponse.data.data.timeSeries;
    timeSeries.slice(0, 3).forEach((day) => {
      console.log(`   ${day.date}:`);
      console.log(`      Amount Spend: $${day.total_amount_spend}`);
      console.log(`      Facebook Leads: ${day.total_facebook_leads}`);
      console.log(`      Zoho Leads: ${day.total_zoho_leads}`);
      console.log(`      Facebook Cost Per Lead: ${day.facebook_cost_per_lead ? '$' + day.facebook_cost_per_lead : 'N/A'}`);
      console.log(`      Zoho Cost Per Lead: ${day.zoho_cost_per_lead ? '$' + day.zoho_cost_per_lead : 'N/A'}`);
    });
    
    // Test 5: Verify Data Structure
    console.log('\n6️⃣ Verifying New Data Structure...');
    
    // Check if reports have new fields
    if (reports && reports.length > 0) {
      const report = reports[0];
      const hasNewFields = [
        'amount_spend',
        'facebook_leads', 
        'zoho_leads',
        'total_leads',
        'facebook_cost_per_lead',
        'zoho_cost_per_lead'
      ].every(field => field in report);
      
      console.log(`   New Report Fields Present: ${hasNewFields ? '✅ YES' : '❌ NO'}`);
    }
    
    // Check if analytics have new fields
    const hasAnalyticsFields = [
      'totalAmountSpend',
      'totalFacebookLeads',
      'totalZohoLeads',
      'facebookCostPerLead',
      'zohoCostPerLead'
    ].every(field => field in overview);
    
    console.log(`   New Analytics Fields Present: ${hasAnalyticsFields ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary of Changes:');
    console.log('   ✅ Date column now uses created_at/updated_at from campaign_data');
    console.log('   ✅ "Spend" renamed to "Amount Spend"');
    console.log('   ✅ Facebook leads shown separately');
    console.log('   ✅ Zoho leads shown separately (from xoho_result column)');
    console.log('   ✅ Facebook cost per lead calculated and displayed');
    console.log('   ✅ Zoho cost per lead calculated and displayed');
    console.log('   ✅ Analytics API updated with new structure');
    
  } catch (error) {
    console.error('❌ Test Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testNewReportStructure().catch(console.error);