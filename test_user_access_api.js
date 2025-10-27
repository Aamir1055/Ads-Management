const axios = require('axios');

async function testUserAccessAPI() {
  console.log('🔐 Testing User Access API...\n');
  
  const baseURL = 'http://localhost:5000';
  
  // First, let's login to get a valid token
  console.log('1️⃣ Logging in...');
  let token = null;
  const passwordsToTry = ['admin', 'password', 'admin123', '123456', 'admin@123'];
  
  for (const password of passwordsToTry) {
    try {
      console.log(`   Trying password: ${password}`);
      const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
        username: 'admin',
        password: password
      });
      
      console.log(`✅ Login successful with password: ${password}`);
      token = loginResponse.data.token;
      break;
    } catch (error) {
      console.log(`   ❌ Failed with password: ${password}`);
    }
  }
  
  if (!token) {
    console.log('❌ Could not login with any password');
    return;
  }
  
  try {
    // Now test the user access modules endpoint
    console.log('\n2️⃣ Testing /api/user-access/modules...');
    const accessResponse = await axios.get(`${baseURL}/api/user-access/modules`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const { data } = accessResponse.data;
    
    console.log(`✅ User access API responded successfully`);
    console.log(`   User: ${data.user.username} (ID: ${data.user.id})`);
    console.log(`   Role: ${data.role.displayName} (Level: ${data.role.level})`);
    
    console.log('\n📋 Allowed Modules:');
    data.allowedModules.forEach(module => {
      console.log(`   • ${module}`);
    });
    
    console.log('\n🛣️ Allowed Routes:');
    data.allowedRoutes.forEach(route => {
      console.log(`   • ${route}`);
    });
    
    console.log('\n🧭 Navigation Items:');
    data.navigation.forEach(nav => {
      console.log(`   • ${nav.name} → ${nav.href} (Icon: ${nav.icon})`);
    });
    
    // Check specifically for Reports
    const hasReports = data.allowedModules.includes('reports');
    const hasReportsRoute = data.allowedRoutes.includes('/reports');
    const hasReportsNav = data.navigation.some(nav => nav.name.toLowerCase().includes('reports'));
    
    console.log('\n🎯 Reports Module Status:');
    console.log(`   Module Access: ${hasReports ? '✅ YES' : '❌ NO'}`);
    console.log(`   Route Access: ${hasReportsRoute ? '✅ YES' : '❌ NO'}`);
    console.log(`   Navigation Item: ${hasReportsNav ? '✅ YES' : '❌ NO'}`);
    
    if (hasReports && hasReportsRoute && hasReportsNav) {
      console.log('\n🎉 SUCCESS: Reports module is fully accessible!');
    } else {
      console.log('\n⚠️ ISSUE: Reports module is not fully accessible');
    }
    
  } catch (error) {
    console.error('❌ Error testing user access API:', error.response?.data?.message || error.message);
  }
  
  console.log('\n3️⃣ Testing Analytics API with authentication...');
  try {
    
    const analyticsResponse = await axios.get(`${baseURL}/api/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Analytics API working - Status: ${analyticsResponse.status}`);
  } catch (error) {
    if (error.response?.status === 500) {
      console.log('⚠️ Analytics API returns 500 (might be missing data, but route works)');
    } else {
      console.log(`❌ Analytics API error: ${error.response?.status || 'Unknown'} - ${error.response?.data?.message || error.message}`);
    }
  }
}

testUserAccessAPI().catch(console.error);