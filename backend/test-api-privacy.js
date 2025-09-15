const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test login and get token
async function loginUser(username, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username,
      password
    });
    return response.data.data.token;
  } catch (error) {
    console.error(`❌ Login failed for ${username}:`, error.response?.data?.message || error.message);
    return null;
  }
}

// Test users endpoint
async function testUsersEndpoint(token, userType) {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const users = response.data.data.users;
    console.log(`👥 ${userType} - Users visible: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role_name || 'No Role'})`);
    });
    return users;
  } catch (error) {
    console.error(`❌ Users API failed for ${userType}:`, error.response?.data?.message || error.message);
    return [];
  }
}

// Test campaigns endpoint
async function testCampaignsEndpoint(token, userType) {
  try {
    const response = await axios.get(`${API_BASE_URL}/campaigns`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const campaigns = response.data.data.campaigns;
    console.log(`📊 ${userType} - Campaigns visible: ${campaigns.length}`);
    campaigns.forEach(campaign => {
      console.log(`   - "${campaign.name}" (Created by: ${campaign.created_by})`);
    });
    return campaigns;
  } catch (error) {
    console.error(`❌ Campaigns API failed for ${userType}:`, error.response?.data?.message || error.message);
    return [];
  }
}

// Test cards endpoint
async function testCardsEndpoint(token, userType) {
  try {
    const response = await axios.get(`${API_BASE_URL}/cards`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const cards = response.data.data.cards;
    console.log(`💳 ${userType} - Cards visible: ${cards.length}`);
    cards.forEach(card => {
      console.log(`   - "${card.card_name}" (Created by: ${card.created_by})`);
    });
    return cards;
  } catch (error) {
    console.error(`❌ Cards API failed for ${userType}:`, error.response?.data?.message || error.message);
    return [];
  }
}

// Main test function
async function runPrivacyTests() {
  console.log('🔒 Testing Data Privacy API Endpoints...\n');

  // Test with admin user
  console.log('1️⃣ Testing with ADMIN user...');
  const adminToken = await loginUser('admin', 'password123');
  if (adminToken) {
    console.log('✅ Admin login successful');
    await testUsersEndpoint(adminToken, 'ADMIN');
    console.log('');
    await testCampaignsEndpoint(adminToken, 'ADMIN');
    console.log('');
    await testCardsEndpoint(adminToken, 'ADMIN');
  } else {
    console.log('❌ Admin login failed - check credentials');
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test with regular user
  console.log('2️⃣ Testing with REGULAR user...');
  const regularToken = await loginUser('Saad', 'password123');
  if (regularToken) {
    console.log('✅ Regular user login successful');
    await testUsersEndpoint(regularToken, 'REGULAR USER');
    console.log('');
    await testCampaignsEndpoint(regularToken, 'REGULAR USER');
    console.log('');
    await testCardsEndpoint(regularToken, 'REGULAR USER');
  } else {
    console.log('❌ Regular user login failed - trying other credentials');
    
    // Try other common usernames
    const testUsers = ['testuser', 'priyankjp', 'Ahmed'];
    for (const username of testUsers) {
      console.log(`   Trying ${username}...`);
      const token = await loginUser(username, 'password123');
      if (token) {
        console.log(`✅ ${username} login successful`);
        await testUsersEndpoint(token, `REGULAR USER (${username})`);
        console.log('');
        await testCampaignsEndpoint(token, `REGULAR USER (${username})`);
        console.log('');
        await testCardsEndpoint(token, `REGULAR USER (${username})`);
        break;
      }
    }
  }

  console.log('\n🎯 Privacy Test Summary:');
  console.log('✅ Admin should see all users, campaigns, and cards');
  console.log('✅ Regular users should only see themselves and their own data');
  console.log('✅ If a regular user sees multiple users/campaigns/cards, privacy is NOT working');
}

// Run the tests
runPrivacyTests().catch(console.error);
