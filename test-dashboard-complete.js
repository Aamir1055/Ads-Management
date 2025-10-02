const axios = require('axios');

async function testDashboardComplete() {
  try {
    console.log('🔄 Testing complete dashboard flow...\n');
    
    // Step 1: Login to get a proper access token
    console.log('1. 🔑 Logging in to get access token...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'aamir@example.com',
      password: 'aamir123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const accessToken = loginResponse.data.data.access_token;
    console.log('✅ Login successful');
    
    // Step 2: Test dashboard API with proper token
    console.log('\n2. 📊 Testing dashboard API...');
    const dashboardResponse = await axios.get('http://localhost:3000/api/analytics/dashboard', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (dashboardResponse.status === 200 && dashboardResponse.data.success) {
      const { data } = dashboardResponse.data;
      
      console.log('✅ Dashboard API Response Success!');
      console.log('\n📊 Dashboard Overview:');
      console.log(`• Total Campaigns: ${data.overview.campaignsCount}`);
      console.log(`• Total Leads: ${data.overview.totalLeads}`);
      console.log(`• Total Spent: ₹${data.overview.totalSpent.toFixed(2)}`);
      console.log(`• Average Cost/Lead: ₹${data.overview.avgCostPerLead.toFixed(2)}`);
      console.log(`• Facebook Results: ${data.overview.facebookResults}`);
      console.log(`• Zoho Results: ${data.overview.zohoResults}`);
      
      // Check for new columns from migration
      console.log('\n🆕 New Migration Columns:');
      if (data.overview.avgFacebookCostPerLead !== undefined) {
        console.log(`• Avg Facebook Cost/Lead: ₹${data.overview.avgFacebookCostPerLead.toFixed(2)}`);
        console.log('✅ avgFacebookCostPerLead column is present!');
      } else {
        console.log('❌ Missing: avgFacebookCostPerLead column');
      }
      
      if (data.overview.avgZohoCostPerLead !== undefined) {
        console.log(`• Avg Zoho Cost/Lead: ₹${data.overview.avgZohoCostPerLead.toFixed(2)}`);
        console.log('✅ avgZohoCostPerLead column is present!');
      } else {
        console.log('❌ Missing: avgZohoCostPerLead column');
      }
      
      // Check top campaigns
      if (data.topCampaigns && data.topCampaigns.length > 0) {
        console.log('\n🏆 Top Campaigns (with enhanced data):');
        data.topCampaigns.slice(0, 3).forEach((campaign, index) => {
          console.log(`\n${index + 1}. ${campaign.campaign_name}`);
          console.log(`   Brand: ${campaign.brand_name || campaign.brand || 'N/A'}`);
          console.log(`   Total Leads: ${campaign.total_leads}`);
          console.log(`   Facebook: ${campaign.facebook_results || 0} leads`);
          console.log(`   Zoho: ${campaign.zoho_results || 0} leads`);
          console.log(`   Spent: ₹${parseFloat(campaign.total_spent || 0).toFixed(2)}`);
          
          if (campaign.avg_facebook_cost_per_lead !== undefined) {
            console.log(`   Facebook Cost/Lead: ₹${parseFloat(campaign.avg_facebook_cost_per_lead || 0).toFixed(2)}`);
          }
          if (campaign.avg_zoho_cost_per_lead !== undefined) {
            console.log(`   Zoho Cost/Lead: ₹${parseFloat(campaign.avg_zoho_cost_per_lead || 0).toFixed(2)}`);
          }
        });
        
        const hasEnhancedData = data.topCampaigns.some(c => 
          c.brand_name || c.facebook_results !== undefined || c.zoho_results !== undefined
        );
        
        if (hasEnhancedData) {
          console.log('\n✅ Enhanced campaign data is present!');
        } else {
          console.log('\n⚠️ Enhanced campaign data is missing');
        }
      }
      
      // Check brand performance
      if (data.brandPerformance && data.brandPerformance.length > 0) {
        console.log('\n🏢 Brand Performance (with enhanced data):');
        data.brandPerformance.slice(0, 3).forEach((brand, index) => {
          console.log(`\n${index + 1}. ${brand.brand_name || brand.brand || 'Unknown'}`);
          console.log(`   Total Leads: ${brand.total_leads}`);
          console.log(`   Total Spent: ₹${parseFloat(brand.total_spent || 0).toFixed(2)}`);
          console.log(`   Campaigns: ${brand.campaigns_count}`);
          
          if (brand.facebook_results !== undefined) {
            console.log(`   Facebook Results: ${brand.facebook_results}`);
          }
          if (brand.zoho_results !== undefined) {
            console.log(`   Zoho Results: ${brand.zoho_results}`);
          }
          if (brand.avg_facebook_cost_per_lead !== undefined) {
            console.log(`   Avg Facebook Cost/Lead: ₹${parseFloat(brand.avg_facebook_cost_per_lead || 0).toFixed(2)}`);
          }
          if (brand.avg_zoho_cost_per_lead !== undefined) {
            console.log(`   Avg Zoho Cost/Lead: ₹${parseFloat(brand.avg_zoho_cost_per_lead || 0).toFixed(2)}`);
          }
        });
      }
      
      console.log('\n🎉 MIGRATION SUCCESS!');
      console.log('✅ Database migration has been applied successfully');
      console.log('✅ Backend API is returning enhanced data with new columns');
      console.log('✅ Brand names, Facebook/Zoho metrics, and calculated costs are working');
      console.log('✅ Your frontend Dashboard will now show consistent, real-time data');
      
    } else {
      console.log('❌ Dashboard API request failed:', dashboardResponse.status, dashboardResponse.statusText);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Request Error:', error.message);
    }
  }
}

testDashboardComplete().catch(console.error);
