const axios = require('axios');

async function testNewBrandSystem() {
  console.log('🧪 TESTING NEW BRAND MANAGEMENT SYSTEM');
  console.log('═══════════════════════════════════════');
  
  try {
    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 1: Test fresh login
    console.log('1️⃣ Testing login...');
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
    console.log('👤 User info:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Username: ${user.username}`);
    console.log(`   - Role Name: ${user.role_name}`);
    console.log(`   - Is SuperAdmin: ${user.role_name === 'super_admin'}`);
    console.log('');
    
    // Step 2: Test brands API with new controller
    console.log('2️⃣ Testing new brands API...');
    const brandsResponse = await axios.get('http://localhost:5000/api/brands', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Brands API successful!');
    console.log(`📊 Status: ${brandsResponse.status}`);
    console.log(`📊 Success: ${brandsResponse.data.success}`);
    console.log(`📊 Message: ${brandsResponse.data.message}`);
    console.log(`📊 Brand count: ${brandsResponse.data.data?.length || 0}`);
    
    if (brandsResponse.data.data && brandsResponse.data.data.length > 0) {
      console.log('📊 First brand sample:');
      const firstBrand = brandsResponse.data.data[0];
      console.log(`   - ID: ${firstBrand.id}`);
      console.log(`   - Name: ${firstBrand.name}`);
      console.log(`   - Description: ${firstBrand.description || 'No description'}`);
      console.log(`   - Active: ${firstBrand.is_active}`);
    }
    console.log('');
    
    // Step 3: Test creating a new brand
    console.log('3️⃣ Testing brand creation...');
    try {
      const newBrandData = {
        name: `Test Brand ${Date.now()}`,
        description: 'Created by test script',
        is_active: true
      };
      
      const createResponse = await axios.post('http://localhost:5000/api/brands', newBrandData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Brand creation successful!');
      console.log(`📊 Status: ${createResponse.status}`);
      console.log(`📊 Success: ${createResponse.data.success}`);
      console.log(`📊 Created brand: ${createResponse.data.data.name}`);
      console.log('');
      
    } catch (createError) {
      console.log('❌ Brand creation failed:');
      console.log(`   Status: ${createError.response?.status}`);
      console.log(`   Message: ${createError.response?.data?.message}`);
      console.log('');
    }
    
    console.log('🎉 NEW BRAND MANAGEMENT SYSTEM IS WORKING!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Open your browser to http://localhost:3000/brands');
    console.log('2. Log in with admin/password');
    console.log('3. You should see the new Brand Management interface');
    console.log('4. Try creating, editing, and deleting brands');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server is not running or not ready');
      console.log('   Try starting it with: npm run dev');
    }
  }
}

// Start the server first, then test
console.log('🚀 Starting test in 3 seconds...');
setTimeout(testNewBrandSystem, 3000);
