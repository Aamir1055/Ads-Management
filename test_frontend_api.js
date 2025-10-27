const axios = require('axios');

// Simulate the exact call that the frontend makes
async function testFrontendAPI() {
  try {
    console.log('🧪 Testing the exact API call the frontend makes...\n');
    
    // Try to access the endpoint without authentication first
    console.log('1. Testing without authentication...');
    try {
      const response = await axios.get('http://localhost:5000/api/cards/active?limit=100');
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Expected authentication error:', error.response?.status, error.response?.data?.message);
    }
    
    // Now let's see what endpoints are actually working by checking the health endpoint
    console.log('\n2. Testing server health...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server might not be running:', error.message);
      return;
    }
    
    // Try to test with a mock authentication header (we'll need to extract this from the frontend)
    console.log('\n3. Testing route availability (without authentication)...');
    
    // Test if the route exists at all
    const endpoints = [
      '/api/cards',
      '/api/cards/active',
      '/api/users'  // This one works according to user
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000${endpoint}`);
        console.log(`✅ ${endpoint}: ${response.status}`);
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        
        if (status === 401) {
          console.log(`🔒 ${endpoint}: Authentication required (this is expected)`);
        } else if (status === 403) {
          console.log(`🚫 ${endpoint}: Permission denied - THIS IS THE PROBLEM!`);
        } else if (status === 404) {
          console.log(`❌ ${endpoint}: Route not found`);
        } else {
          console.log(`❓ ${endpoint}: ${status} - ${message}`);
        }
      }
    }
    
    console.log('\n💡 Next steps:');
    console.log('1. Check if the frontend has a valid authentication token');
    console.log('2. Check if the cards route is properly configured');
    console.log('3. Check the server console for RBAC middleware errors');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendAPI();
