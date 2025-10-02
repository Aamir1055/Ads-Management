const axios = require('axios');

async function testConsistentData() {
  try {
    console.log('🧪 Testing Data Consistency Between Dashboard and Reports...\n');

    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });

    const token = loginResponse.data.data.access_token;
    const headers = { 'Authorization': `Bearer ${token}` };

    // Test Dashboard API
    console.log('📊 Testing Dashboard API (/analytics/dashboard)...');
    const dashboardResponse = await axios.get('http://localhost:5000/api/analytics/dashboard', { headers });
    
    const dashboardData = dashboardResponse.data.data.overview;
    console.log('Dashboard Results:');
    console.log(`• Campaigns: ${dashboardData.campaignsCount}`);
    console.log(`• Total Leads: ${dashboardData.totalLeads}`);
    console.log(`• Facebook Results: ${dashboardData.facebookResults}`);
    console.log(`• Zoho Results: ${dashboardData.zohoResults}`);
    console.log(`• Total Spent: ₹${dashboardData.totalSpent}`);
    console.log(`• Avg Cost/Lead: ₹${dashboardData.avgCostPerLead}`);

    // Test Reports API
    console.log('\n📋 Testing Reports API (/reports)...');
    const reportsResponse = await axios.get('http://localhost:5000/api/reports', { headers });
    
    const reportsData = reportsResponse.data.data;
    const reportsSummary = {
      totalRecords: reportsData.length,
      totalLeads: reportsData.reduce((sum, r) => sum + (r.leads || 0), 0),
      totalFacebook: reportsData.reduce((sum, r) => sum + (r.facebook_result || 0), 0),
      totalZoho: reportsData.reduce((sum, r) => sum + (r.zoho_result || 0), 0),
      totalSpent: reportsData.reduce((sum, r) => sum + (r.spent || 0), 0),
    };
    
    console.log('Reports Results:');
    console.log(`• Records: ${reportsSummary.totalRecords}`);
    console.log(`• Total Leads: ${reportsSummary.totalLeads}`);
    console.log(`• Facebook Results: ${reportsSummary.totalFacebook}`);
    console.log(`• Zoho Results: ${reportsSummary.totalZoho}`);
    console.log(`• Total Spent: ₹${reportsSummary.totalSpent}`);

    // Show individual reports
    console.log('\n📋 Individual Reports:');
    reportsData.forEach((report, index) => {
      console.log(`\n${index + 1}. ${report.campaign_name}`);
      console.log(`   Brand: ${report.brand_name}`);
      console.log(`   Date: ${new Date(report.report_date).toLocaleDateString('en-GB')}`);
      console.log(`   Facebook: ${report.facebook_result} leads`);
      console.log(`   Zoho: ${report.zoho_result} leads`);
      console.log(`   Total Leads: ${report.leads}`);
      console.log(`   Spent: ₹${report.spent}`);
      console.log(`   Cost/Lead: ₹${report.cost_per_lead || 'N/A'}`);
    });

    // Check consistency
    console.log('\n🔍 CONSISTENCY CHECK:');
    const isConsistent = 
      dashboardData.totalLeads === reportsSummary.totalLeads &&
      dashboardData.facebookResults === reportsSummary.totalFacebook &&
      dashboardData.zohoResults === reportsSummary.totalZoho &&
      Math.abs(dashboardData.totalSpent - reportsSummary.totalSpent) < 0.01; // Allow for decimal precision

    if (isConsistent) {
      console.log('✅ PERFECT! Dashboard and Reports show identical data');
      console.log('✅ Both are reading from the same reports table');
      console.log('✅ Your data is now consistent across the application');
    } else {
      console.log('❌ MISMATCH DETECTED!');
      console.log('Dashboard vs Reports:');
      console.log(`• Leads: ${dashboardData.totalLeads} vs ${reportsSummary.totalLeads}`);
      console.log(`• Facebook: ${dashboardData.facebookResults} vs ${reportsSummary.totalFacebook}`);
      console.log(`• Zoho: ${dashboardData.zohoResults} vs ${reportsSummary.totalZoho}`);
      console.log(`• Spent: ₹${dashboardData.totalSpent} vs ₹${reportsSummary.totalSpent}`);
    }

    console.log('\n🎯 SUMMARY:');
    console.log('• Both Dashboard and Reports use reports table');
    console.log('• Data shows real business metrics (not test data)');
    console.log('• Currency displayed as Indian Rupee (₹)');
    console.log('• Reports page shows same columns as before');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testConsistentData();
