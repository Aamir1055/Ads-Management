const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3002/api';

async function testCardOwnershipSystem() {
  console.log('🧪 Testing Card Ownership System Implementation\n');
  
  try {
    // Test 1: Create a new card (should auto-assign to creator)
    console.log('📋 Test 1: Creating a new card...');
    
    const createCardResponse = await axios.post(`${BASE_URL}/cards`, {
      card_name: 'Test Auto-Assignment Card',
      card_type: 'Visa',
      current_balance: 500.00,
      card_number_last4: '1234'
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    
    if (createCardResponse.data.success) {
      console.log('✅ Card created successfully');
      console.log('   Card ID:', createCardResponse.data.data.card.id);
      console.log('   Card Name:', createCardResponse.data.data.card.card_name);
      
      const cardId = createCardResponse.data.data.card.id;
      
      // Test 2: Check if card appears in card-users module
      console.log('\n📋 Test 2: Checking card-user assignment...');
      
      const cardUsersResponse = await axios.get(`${BASE_URL}/card-users`, {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
        }
      });
      
      if (cardUsersResponse.data.success) {
        const assignments = cardUsersResponse.data.data.cardUsers;
        const cardAssignment = assignments.find(assignment => assignment.card_id === cardId);
        
        if (cardAssignment) {
          console.log('✅ Card automatically assigned to creator');
          console.log('   Assignment ID:', cardAssignment.id);
          console.log('   Is Primary:', cardAssignment.is_primary ? 'Yes' : 'No');
          console.log('   Assigned Date:', cardAssignment.assigned_date);
        } else {
          console.log('❌ Card was not automatically assigned');
        }
      }
      
      // Test 3: Try to toggle card status (user should be able to)
      console.log('\n📋 Test 3: Testing card status toggle...');
      
      try {
        const toggleResponse = await axios.patch(`${BASE_URL}/cards/${cardId}/toggle-status`, {}, {
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
          }
        });
        
        if (toggleResponse.data.success) {
          console.log('✅ User can toggle card status');
          console.log('   New Status:', toggleResponse.data.data.isActive ? 'Active' : 'Inactive');
        }
      } catch (error) {
        console.log('❌ Failed to toggle card status:', error.response?.data?.message || error.message);
      }
      
      // Test 4: Try to set card priority
      console.log('\n📋 Test 4: Testing card priority setting...');
      
      try {
        const priorityResponse = await axios.patch(`${BASE_URL}/cards/${cardId}/set-priority`, {
          is_primary: false
        }, {
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
            'Content-Type': 'application/json'
          }
        });
        
        if (priorityResponse.data.success) {
          console.log('✅ User can set card priority');
          console.log('   New Priority:', priorityResponse.data.data.isPrimary ? 'Primary' : 'Secondary');
        }
      } catch (error) {
        console.log('❌ Failed to set card priority:', error.response?.data?.message || error.message);
      }
      
      // Test 5: Try to assign card to another user (should fail for non-superadmin)
      console.log('\n📋 Test 5: Testing card-user assignment restrictions...');
      
      try {
        const assignResponse = await axios.post(`${BASE_URL}/card-users`, {
          card_id: cardId,
          user_id: 999, // Different user ID
          is_primary: false
        }, {
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE', // Replace with actual token
            'Content-Type': 'application/json'
          }
        });
        
        console.log('❌ User was able to assign card to others (should be restricted)');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Card assignment properly restricted to superadmin only');
          console.log('   Error:', error.response.data.message);
        } else {
          console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
        }
      }
      
    } else {
      console.log('❌ Failed to create card:', createCardResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    console.error('\n🔧 Note: Make sure to replace YOUR_TOKEN_HERE with a valid authentication token');
    console.error('🔧 You can get a token by logging into the system and checking the browser developer tools');
  }
  
  console.log('\n✨ Test completed!');
  console.log('\n📝 Expected behavior:');
  console.log('   • Cards created by users are automatically assigned to them');
  console.log('   • First card becomes primary, subsequent cards become secondary');
  console.log('   • Users can toggle their cards active/inactive');
  console.log('   • Users can set their cards as primary/secondary');
  console.log('   • Only superadmin can assign cards to other users');
  console.log('   • Only superadmin can modify card-user assignments');
}

// Run the test if executed directly
if (require.main === module) {
  testCardOwnershipSystem();
}

module.exports = testCardOwnershipSystem;
