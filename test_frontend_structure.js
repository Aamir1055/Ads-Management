const axios = require('axios');

async function testFrontendStructure() {
  console.log('🖥️ Testing Frontend Data Structure...\n');
  
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
    
    // Test the same endpoint that the frontend will call
    console.log('2️⃣ Testing /api/reports/generate (Frontend will use this)...');
    const reportResponse = await axios.post(`${baseURL}/api/reports/generate`, {
      dateFrom: '2025-10-06',
      dateTo: '2025-10-09'
    }, { headers });
    
    if (reportResponse.data.success) {
      const reports = reportResponse.data.data.reports;
      console.log(`📊 Found ${reports.length} reports\n`);
      
      if (reports.length > 0) {
        const sampleReport = reports[0];
        console.log('🔍 Sample Report Structure (what frontend will receive):');
        console.log('=====================================');
        console.log(`Report Date: ${sampleReport.report_date} (will format as dd/mm/yyyy)`);
        console.log(`Campaign Name: ${sampleReport.campaign_name}`);
        console.log(`Campaign Type: ${sampleReport.campaign_type}`);
        console.log(`Brand Name: ${sampleReport.brand_name}`);
        console.log(`Facebook Leads: ${sampleReport.facebook_leads}`);
        console.log(`Zoho Leads: ${sampleReport.zoho_leads}`);
        console.log(`Total Leads: ${sampleReport.total_leads}`);
        console.log(`Facebook Cost Per Lead: ${sampleReport.facebook_cost_per_lead}`);
        console.log(`Zoho Cost Per Lead: ${sampleReport.zoho_cost_per_lead}`);
        
        console.log('\n📅 Date Formatting Test:');
        const date = new Date(sampleReport.report_date);
        const formattedDate = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        });
        console.log(`   Original: ${sampleReport.report_date}`);
        console.log(`   Formatted (dd/mm/yyyy): ${formattedDate}`);
        
        console.log('\n💰 Currency Formatting Test:');
        const formatCurrency = (amount) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(amount || 0);
        };
        
        const formatCostPerLead = (cost) => {
          if (cost === null || cost === undefined) return 'N/A';
          return formatCurrency(cost);
        };
        
        console.log(`   Facebook Cost Per Lead: ${formatCostPerLead(sampleReport.facebook_cost_per_lead)}`);
        console.log(`   Zoho Cost Per Lead: ${formatCostPerLead(sampleReport.zoho_cost_per_lead)}`);
        
        console.log('\n📈 Number Formatting Test:');
        const formatNumber = (num) => {
          return new Intl.NumberFormat('en-US').format(num || 0);
        };
        
        console.log(`   Facebook Leads: ${formatNumber(sampleReport.facebook_leads)}`);
        console.log(`   Zoho Leads: ${formatNumber(sampleReport.zoho_leads)}`);
        console.log(`   Total Leads: ${formatNumber(sampleReport.total_leads)}`);
        
        console.log('\n✅ Frontend Data Structure Verification:');
        const requiredFields = [
          'report_date',
          'campaign_name', 
          'campaign_type',
          'brand_name',
          'facebook_leads',
          'zoho_leads', 
          'total_leads',
          'facebook_cost_per_lead',
          'zoho_cost_per_lead'
        ];
        
        const missingFields = requiredFields.filter(field => !(field in sampleReport));
        
        if (missingFields.length === 0) {
          console.log('   ✅ All required fields are present');
        } else {
          console.log('   ❌ Missing fields:', missingFields);
        }
        
        // Check field types
        console.log('\n📊 Field Type Verification:');
        console.log(`   report_date: ${typeof sampleReport.report_date} (${sampleReport.report_date})`);
        console.log(`   campaign_name: ${typeof sampleReport.campaign_name} (${sampleReport.campaign_name})`);
        console.log(`   campaign_type: ${typeof sampleReport.campaign_type} (${sampleReport.campaign_type})`);
        console.log(`   brand_name: ${typeof sampleReport.brand_name} (${sampleReport.brand_name})`);
        console.log(`   facebook_leads: ${typeof sampleReport.facebook_leads} (${sampleReport.facebook_leads})`);
        console.log(`   zoho_leads: ${typeof sampleReport.zoho_leads} (${sampleReport.zoho_leads})`);
        console.log(`   total_leads: ${typeof sampleReport.total_leads} (${sampleReport.total_leads})`);
        console.log(`   facebook_cost_per_lead: ${typeof sampleReport.facebook_cost_per_lead} (${sampleReport.facebook_cost_per_lead})`);
        console.log(`   zoho_cost_per_lead: ${typeof sampleReport.zoho_cost_per_lead} (${sampleReport.zoho_cost_per_lead})`);
      }
      
      console.log('\n📋 Summary for All Reports:');
      const summary = reportResponse.data.data.summary;
      console.log(`   Total Records: ${summary.totalRecords}`);
      console.log(`   Total Amount Spend: $${summary.totalAmountSpend}`);
      console.log(`   Total Facebook Leads: ${summary.totalFacebookLeads}`);
      console.log(`   Total Zoho Leads: ${summary.totalZohoLeads}`);
      console.log(`   Date Range: ${summary.dateRange.from} to ${summary.dateRange.to}`);
    } else {
      console.log('❌ Failed to generate reports:', reportResponse.data.message);
    }
    
    console.log('\n🎉 Frontend Structure Test Complete!');
    console.log('\n📝 What the frontend will display:');
    console.log('   • Date column: dd/mm/yyyy format');
    console.log('   • Campaign Name: From campaign_name field');
    console.log('   • Campaign Type: From campaign_type field');  
    console.log('   • Brand Name: From brand_name field');
    console.log('   • Facebook Leads: Formatted number');
    console.log('   • Zoho Leads: Formatted number');
    console.log('   • Total Leads: Formatted number (bold)');
    console.log('   • Facebook Cost Per Lead: Currency format or N/A');
    console.log('   • Zoho Cost Per Lead: Currency format or N/A');
    
  } catch (error) {
    console.error('❌ Test Error:', error.response?.data?.message || error.message);
    if (error.response?.status) {
      console.log(`Status: ${error.response.status}`);
    }
  }
}

testFrontendStructure().catch(console.error);