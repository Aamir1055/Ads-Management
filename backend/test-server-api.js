/**
 * Test actual API endpoints to debug server-side RBAC
 */

const axios = require('axios');

async function testServerAPI() {
  console.log('🧪 Testing actual server API endpoints');
  console.log('=' .repeat(50));
  
  try {
    // First, login to get auth token
    console.log('🔐 Logging in as Aamir...');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'Aamir',
      password: 'your_password_here' // You'll need to provide the actual password
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed. Please update the password in this script.');
      console.log('Response:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.access_token;
    console.log('✅ Login successful');
    
    // Test campaign_types endpoint
    console.log('\n📝 Testing GET /api/campaign-types...');
    
    try {
      const response = await axios.get('http://localhost:5000/api/campaign-types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ SUCCESS: campaign-types endpoint worked!');
      console.log('Response data:', response.data);
      
    } catch (error) {
      console.log('❌ BLOCKED: campaign-types endpoint failed');
      console.log('Status:', error.response?.status);
      console.log('Error message:', error.response?.data?.message);
      console.log('Error details:', error.response?.data?.details);
      
      // This will help us see what the server-side RBAC is actually doing
      if (error.response?.data?.details) {
        console.log('\n🔍 Server-side RBAC details:');
        console.log('- User Role:', error.response.data.details.userRole);
        console.log('- Required Permission:', error.response.data.details.requiredPermission);
        console.log('- Available Actions:', error.response.data.details.availableActions);
      }
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to server. Is it running on http://localhost:5000?');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Instructions for user
console.log('📋 INSTRUCTIONS:');
console.log('1. Make sure your server is running on http://localhost:5000');
console.log('2. Update the password in this script for user "Aamir"');
console.log('3. Run: node test-server-api.js');
console.log('');

testServerAPI();
