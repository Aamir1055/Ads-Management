const axios = require('axios');

async function testCardUsersAPI() {
  console.log('🃏 TESTING CARD USERS API');
  console.log('========================');

  const API_BASE = 'http://localhost:5000/api';
  
  try {
    // Login first
    console.log('\n1. 🔐 Authenticating...');
    const login = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const authToken = login.data.data.access_token;
    const headers = { Authorization: `Bearer ${authToken}` };
    console.log('✅ Authentication successful');

    // Test Card Users endpoint
    console.log('\n2. 🃏 Testing Card Users API...');
    try {
      const response = await axios.get(`${API_BASE}/card-users`, { headers });
      console.log(`✅ Card Users API Status: ${response.status}`);
      console.log('📊 Response structure:', Object.keys(response.data));
      
      if (response.data.data) {
        const data = response.data.data;
        console.log('   Data structure:', Object.keys(data));
        
        if (data.cardUsers && Array.isArray(data.cardUsers)) {
          console.log(`   Found ${data.cardUsers.length} card user assignments`);
          
          // Show first assignment in detail
          if (data.cardUsers.length > 0) {
            const firstAssignment = data.cardUsers[0];
            console.log('\n📋 Sample assignment structure:');
            console.log('   Assignment ID:', firstAssignment.id);
            console.log('   Card ID:', firstAssignment.card_id);
            console.log('   User ID:', firstAssignment.user_id);
            console.log('   Card Name:', firstAssignment.card_name || 'MISSING! ❌');
            console.log('   Username:', firstAssignment.username || 'MISSING! ❌');
            console.log('   Card Type:', firstAssignment.card_type);
            console.log('   Card Last4:', firstAssignment.card_number_last4);
            console.log('   Is Primary:', firstAssignment.is_primary);
            console.log('   Assigned Date:', firstAssignment.assigned_date);
            console.log('   Role Name:', firstAssignment.role_name);
            
            // Check if names are present
            const hasCardName = !!firstAssignment.card_name;
            const hasUsername = !!firstAssignment.username;
            
            if (hasCardName && hasUsername) {
              console.log('\n✅ NAMES ARE PRESENT - Frontend should display correctly');
            } else {
              console.log('\n❌ NAMES ARE MISSING - This is the issue!');
              console.log('   Missing card_name:', !hasCardName);
              console.log('   Missing username:', !hasUsername);
            }
            
            // Show all fields
            console.log('\n🔍 All fields in first assignment:');
            Object.keys(firstAssignment).forEach(key => {
              console.log(`   ${key}: ${firstAssignment[key]}`);
            });
          }
        } else if (Array.isArray(data)) {
          console.log(`   Direct array with ${data.length} assignments`);
          if (data.length > 0) {
            const firstAssignment = data[0];
            console.log('\n📋 Sample assignment (direct array):');
            Object.keys(firstAssignment).forEach(key => {
              console.log(`   ${key}: ${firstAssignment[key]}`);
            });
          }
        } else {
          console.log('⚠️  Unexpected data structure:', typeof data);
        }
      }
    } catch (error) {
      console.log(`❌ Card Users API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Test specific card user by ID if any exist
    console.log('\n3. 🎯 Testing Single Card User Retrieval...');
    try {
      const response = await axios.get(`${API_BASE}/card-users/1`, { headers });
      console.log(`✅ Single card user status: ${response.status}`);
      if (response.data.data && response.data.data.cardUser) {
        const cardUser = response.data.data.cardUser[0] || response.data.data.cardUser;
        console.log('Single card user structure:');
        Object.keys(cardUser).forEach(key => {
          console.log(`   ${key}: ${cardUser[key]}`);
        });
      }
    } catch (error) {
      console.log(`⚠️  Single card user test: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Test if we have any cards and users to assign
    console.log('\n4. 📊 Checking Available Cards and Users...');
    try {
      const cardsResponse = await axios.get(`${API_BASE}/cards`, { headers });
      console.log(`   Cards available: ${cardsResponse.data.data?.length || 'N/A'}`);
    } catch (error) {
      console.log(`   Cards check failed: ${error.response?.status}`);
    }

    try {
      const usersResponse = await axios.get(`${API_BASE}/user-management`, { headers });
      console.log(`   Users available: ${usersResponse.data.data?.users?.length || 'N/A'}`);
    } catch (error) {
      console.log(`   Users check failed: ${error.response?.status}`);
    }

    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('===================');
    console.log('If card_name and username are MISSING from the API response,');
    console.log('then the issue is in the backend SQL queries.');
    console.log('If they are PRESENT, then the issue is in the frontend data handling.');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testCardUsersAPI();
