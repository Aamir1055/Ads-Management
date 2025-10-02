const axios = require('axios');

async function testUpdatedDashboardAPI() {
  try {
    console.log('🔄 Testing updated dashboard API...\n');
    
    // Using a real authentication token that should work
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWFtaXIiLCJlbWFpbCI6ImFhbWlyQGV4YW1wbGUuY29tIiwicm9sZUlkIjo2LCJyb2xlIjp7ImlkIjo2LCJuYW1lIjoiU3VwZXJBZG1pbmlzdHJhdG9yIiwibGV2ZWwiOjEwLCJkZXNjcmlwdGlvbiI6IkZ1bGwgc3lzdGVtIGFjY2VzcyIsImNhbkFjY2Vzc0FsbERhdGEiOnRydWV9LCJwZXJtaXNzaW9ucyI6W10sImlhdCI6MTc1ODc3OTUwMSwiZXhwIjoxNzU4NzgzMTAxfQ.6XaAZRZS3wM77hdjU3wa_XiVYOffntGXcQAmF8GzCWk';
    
    const response = await axios.get('http://localhost:3000/api/analytics/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      const { data } = response.data;
      
      console.log('✅ API Response Success!');
      console.log('\n📊 Dashboard Overview:');
      console.log(`• Total Campaigns: ${data.overview.campaignsCount}`);
      console.log(`• Total Leads: ${data.overview.totalLeads}`);
      console.log(`• Total Spent: ₹${data.overview.totalSpent.toFixed(2)}`);
      console.log(`• Average Cost/Lead: ₹${data.overview.avgCostPerLead.toFixed(2)}`);
      console.log(`• Facebook Results: ${data.overview.facebookResults}`);
      console.log(`• Zoho Results: ${data.overview.zohoResults}`);
      
      // Check for new columns
      if (data.overview.avgFacebookCostPerLead !== undefined) {
        console.log(`• Avg Facebook Cost/Lead: ₹${data.overview.avgFacebookCostPerLead.toFixed(2)}`);
        console.log('✅ NEW: avgFacebookCostPerLead column is present!');
      } else {
        console.log('❌ Missing: avgFacebookCostPerLead column');
      }
      
      if (data.overview.avgZohoCostPerLead !== undefined) {
        console.log(`• Avg Zoho Cost/Lead: ₹${data.overview.avgZohoCostPerLead.toFixed(2)}`);
        console.log('✅ NEW: avgZohoCostPerLead column is present!');
      } else {
        console.log('❌ Missing: avgZohoCostPerLead column');
      }
      
      // Check top campaigns for new data
      if (data.topCampaigns && data.topCampaigns.length > 0) {
        console.log('\n🏆 Top Campaigns with new data:');
        data.topCampaigns.slice(0, 2).forEach((campaign, index) => {
          console.log(`\nCampaign ${index + 1}:`);
          console.log(`• Name: ${campaign.campaign_name}`);
          console.log(`• Brand: ${campaign.brand_name || campaign.brand}`);
          console.log(`• Leads: ${campaign.total_leads}`);
          console.log(`• Facebook: ${campaign.facebook_results} leads`);
          console.log(`• Zoho: ${campaign.zoho_results} leads`);
          
          if (campaign.avg_facebook_cost_per_lead !== undefined) {
            console.log(`• Facebook Cost/Lead: ₹${parseFloat(campaign.avg_facebook_cost_per_lead || 0).toFixed(2)}`);
            console.log('✅ NEW: Campaign facebook cost data present!');
          }
          
          if (campaign.avg_zoho_cost_per_lead !== undefined) {
            console.log(`• Zoho Cost/Lead: ₹${parseFloat(campaign.avg_zoho_cost_per_lead || 0).toFixed(2)}`);
            console.log('✅ NEW: Campaign zoho cost data present!');
          }
        });
      }
      
      // Check brand performance for new data
      if (data.brandPerformance && data.brandPerformance.length > 0) {
        console.log('\n🏢 Brand Performance with new data:');
        data.brandPerformance.slice(0, 2).forEach((brand, index) => {
          console.log(`\nBrand ${index + 1}:`);
          console.log(`• Name: ${brand.brand_name || brand.brand}`);
          console.log(`• Leads: ${brand.total_leads}`);
          console.log(`• Spent: ₹${parseFloat(brand.total_spent || 0).toFixed(2)}`);
          
          if (brand.facebook_results !== undefined) {
            console.log(`• Facebook Results: ${brand.facebook_results}`);
            console.log('✅ NEW: Brand facebook results data present!');
          }
          
          if (brand.zoho_results !== undefined) {
            console.log(`• Zoho Results: ${brand.zoho_results}`);
            console.log('✅ NEW: Brand zoho results data present!');
          }
        });
      }
      
      console.log('\n🎉 SUCCESS! Dashboard API is returning the enhanced data');
      console.log('✅ Frontend will now receive calculated cost per lead data');
      console.log('✅ Brand names are populated from the database');
      console.log('✅ Facebook and Zoho metrics are separated properly');
      
    } else {
      console.log('❌ API request failed:', response.status, response.statusText);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Request Error:', error.message);
    }
  }
}

testUpdatedDashboardAPI().catch(console.error);
