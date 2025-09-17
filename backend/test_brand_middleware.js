const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testBrandMiddleware() {
  console.log('🔍 Testing brand middleware permission check...\n');
  
  try {
    // Step 1: Login and get token
    console.log('1️⃣ Logging in to get token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.access_token;
    const user = loginResponse.data.data.user;
    
    console.log('✅ Login successful');
    console.log('   Token length:', token.length);
    console.log('   User ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Role ID:', user.role_id);
    
    // Step 2: Decode the token to see what's inside
    console.log('\n2️⃣ Decoding JWT token...');
    try {
      // Decode without verification to see payload
      const decoded = jwt.decode(token);
      console.log('Token payload:', JSON.stringify(decoded, null, 2));
    } catch (error) {
      console.log('❌ Error decoding token:', error.message);
    }
    
    // Step 3: Test the brands endpoint with detailed error info
    console.log('\n3️⃣ Testing brands endpoint...');
    try {
      const response = await axios.get('http://localhost:5000/api/brands', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Brands endpoint successful!');
      console.log('   Status:', response.status);
      console.log('   Success:', response.data.success);
      console.log('   Records:', response.data.data?.length || 0);
      
    } catch (error) {
      console.log('❌ Brands endpoint failed:');
      console.log('   Status:', error.response?.status);
      console.log('   Error data:', JSON.stringify(error.response?.data, null, 2));
      
      // If it's a 403 (permission denied), let's dig deeper
      if (error.response?.status === 403) {
        console.log('\n🔍 Permission denied - analyzing the issue...');
        
        const errorDetails = error.response.data.details;
        if (errorDetails) {
          console.log('   User role:', errorDetails.userRole);
          console.log('   Required permission:', errorDetails.requiredPermission);
          console.log('   Available actions:', errorDetails.availableActions);
        }
      }
    }
    
    // Step 4: Test with a different endpoint to see if it's brand-specific
    console.log('\n4️⃣ Testing other endpoints for comparison...');
    
    const testEndpoints = [
      { name: 'Users', url: '/users' },
      { name: 'Campaign Types', url: '/campaign-types' }
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await axios.get(`http://localhost:5000/api${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ ${endpoint.name}: Status ${response.status}, Records: ${response.data.data?.length || 0}`);
        
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Status ${error.response?.status}, Error: ${error.response?.data?.message}`);
      }
    }
    
    // Step 5: Check the actual middleware logic
    console.log('\n5️⃣ Checking middleware logic...');
    
    // Test the health endpoint to make sure basic auth works
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Health endpoint works (no auth required)');
    } catch (error) {
      console.log('❌ Health endpoint failed:', error.message);
    }
    
    console.log('\n💡 DIAGNOSIS:');
    console.log('If brands endpoint fails but other endpoints work, the issue is:');
    console.log('1. Brand-specific middleware configuration');
    console.log('2. Permission name mismatch in middleware');
    console.log('3. Brand routes using different permission check logic');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server is not running');
    }
  }
}

testBrandMiddleware();
