const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test login and campaigns API
async function debugCampaignsAPI() {
  console.log('🔍 Debugging Campaigns API...\n');

  try {
    // Try to login as Saad first
    console.log('1️⃣ Attempting to login as Saad...');
    
    // Try different password combinations
    const passwords = ['password123', 'password', '123456', 'saad123', 'saad'];
    let token = null;
    
    for (const password of passwords) {
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          username: 'Saad',
          password: password
        });
        
        if (loginResponse.data.success) {
          token = loginResponse.data.data.token;
          console.log(`✅ Login successful with password: ${password}`);
          console.log(`📝 Token: ${token.substring(0, 20)}...`);
          break;
        }
      } catch (error) {
        console.log(`❌ Failed with password: ${password}`);
      }
    }

    if (!token) {
      console.log('❌ Could not login with any password. Checking available users...');
      
      // Let's check what users exist
      try {
        const { pool } = require('./config/database');
        const [users] = await pool.query('SELECT username FROM users WHERE is_active = 1');
        console.log('Available usernames:', users.map(u => u.username));
      } catch (dbError) {
        console.log('Could not check database');
      }
      
      return;
    }

    // Test campaigns API
    console.log('\n2️⃣ Testing /api/campaigns endpoint...');
    
    try {
      const campaignsResponse = await axios.get(`${API_BASE_URL}/campaigns`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Campaigns API Response:');
      console.log(`Status: ${campaignsResponse.status}`);
      console.log(`Success: ${campaignsResponse.data.success}`);
      console.log(`Message: ${campaignsResponse.data.message}`);
      
      if (campaignsResponse.data.data && campaignsResponse.data.data.campaigns) {
        const campaigns = campaignsResponse.data.data.campaigns;
        console.log(`\n📊 Found ${campaigns.length} campaigns:`);
        
        campaigns.forEach((campaign, index) => {
          console.log(`   ${index + 1}. "${campaign.name}" (ID: ${campaign.id}, Created by: ${campaign.created_by})`);
        });

        // Check if this is correct for Saad
        const saadCampaigns = campaigns.filter(c => c.created_by === 44); // Saad's ID is 44
        console.log(`\n🎯 Analysis:`);
        console.log(`   - Total campaigns returned: ${campaigns.length}`);
        console.log(`   - Campaigns owned by Saad (ID: 44): ${saadCampaigns.length}`);
        
        if (campaigns.length === 1 && saadCampaigns.length === 1) {
          console.log('   ✅ CORRECT: Saad can only see his own campaign');
        } else if (campaigns.length > 1) {
          console.log('   ❌ PROBLEM: Saad can see other users\' campaigns');
          console.log('   🔍 Investigating possible causes...');
          
          // Check user role from token
          console.log('\n3️⃣ Checking user authentication...');
          try {
            const userResponse = await axios.get(`${API_BASE_URL}/users/${44}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('User data from API:', {
              id: userResponse.data.data?.user?.id,
              username: userResponse.data.data?.user?.username,
              role: userResponse.data.data?.user?.role_name
            });
          } catch (userError) {
            console.log('Could not fetch user data:', userError.response?.data?.message);
          }
        }
        
      } else {
        console.log('❌ Unexpected response format');
        console.log('Full response:', JSON.stringify(campaignsResponse.data, null, 2));
      }
      
    } catch (apiError) {
      console.log('❌ Campaigns API failed:');
      console.log('Status:', apiError.response?.status);
      console.log('Message:', apiError.response?.data?.message);
      console.log('Full error:', apiError.response?.data);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    console.log('\n🎯 Next Steps:');
    console.log('1. If Saad sees more than 1 campaign, the privacy filter is not working');
    console.log('2. Check browser Network tab to see the actual API call');
    console.log('3. Verify the user authentication and role information');
    process.exit(0);
  }
}

debugCampaignsAPI();
