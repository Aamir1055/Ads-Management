const axios = require('axios');

// Test the actual API endpoints with authentication
async function testApiEndpoints() {
  console.log('🧪 Testing API endpoints with authentication...\n');
  
  try {
    // Step 1: Login to get a token
    console.log('1️⃣ Attempting login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',  // Using the admin user we know exists
      password: 'password'  // Default password
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.access_token;
    console.log('✅ Login successful, token received');
    console.log('👤 User:', loginResponse.data.data.user.username);
    console.log('🎭 Role:', loginResponse.data.data.user.role?.name || loginResponse.data.data.user.role || 'Unknown');
    
    // Step 2: Test protected endpoints
    const endpoints = [
      { name: 'Brands', path: '/brands' },
      { name: 'Users', path: '/users' },
      { name: 'Campaigns', path: '/campaigns' },
      { name: 'Cards', path: '/cards' },
      { name: 'Campaign Types', path: '/campaign-types' },
      { name: 'Campaign Data', path: '/campaign-data' }
    ];
    
    console.log('\n2️⃣ Testing protected endpoints...\n');
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Testing ${endpoint.name} (${endpoint.path})...`);
        
        const response = await axios.get(`http://localhost:5000/api${endpoint.path}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = response.data;
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   ✅ Success: ${data.success}`);
        console.log(`   📊 Records: ${data.data?.length || 0}`);
        
        if (data.data && data.data.length > 0) {
          const sampleRecord = data.data[0];
          const keys = Object.keys(sampleRecord).slice(0, 3);
          console.log(`   📝 Sample fields: ${keys.join(', ')}`);
        }
        
        if (!data.success) {
          console.log(`   ⚠️ API returned success=false: ${data.message}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.response?.status || 'NETWORK_ERROR'}`);
        console.log(`   💬 Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.status === 403) {
          console.log(`   🔐 Permission issue detected for ${endpoint.name}`);
        }
      }
      
      console.log(''); // Add spacing
    }
    
    // Step 3: Test specific permission checking
    console.log('3️⃣ Testing permission system directly...\n');
    
    try {
      const permissionResponse = await axios.get('http://localhost:5000/api/permissions/user-permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (permissionResponse.data.success) {
        const permissions = permissionResponse.data.data;
        console.log('🔑 User permissions found:', permissions.length);
        
        const brandPermissions = permissions.filter(p => p.includes('brands'));
        console.log('🏷️ Brand permissions:', brandPermissions);
        
        const campaignPermissions = permissions.filter(p => p.includes('campaign'));
        console.log('📊 Campaign permissions:', campaignPermissions);
        
        const userPermissions = permissions.filter(p => p.includes('users'));
        console.log('👥 User permissions:', userPermissions);
      }
    } catch (error) {
      console.log('❌ Could not fetch user permissions:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('════════════════════════════════════════');
    console.log('✅ Authentication: Working');
    console.log('✅ Token generation: Working');
    console.log('✅ Backend server: Running and accessible');
    console.log('');
    console.log('If all endpoints returned success=true with data, the issue is frontend-related.');
    console.log('If any endpoints failed, the issue is backend permission/database-related.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server is not running or not accessible');
    } else if (error.response?.status === 401) {
      console.log('💡 Authentication failed - check username/password');
    }
  }
}

// Run the test
testApiEndpoints();
