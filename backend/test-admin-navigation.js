const axios = require('axios');

async function testAdminNavigation() {
  try {
    console.log('🔧 TESTING ADMIN NAVIGATION');
    console.log('============================\n');

    // First login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    console.log('✅ Admin login successful');
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.token || loginResponse.data.data?.token || loginResponse.data.data?.access_token;
    console.log('Token extracted:', token ? 'Yes' : 'No');
    if (!token) {
      throw new Error('No token found in login response');
    }
    console.log('');

    // Test user access endpoint
    console.log('2. Fetching user access/navigation...');
    const accessResponse = await axios.get('http://localhost:5000/api/user-access/modules', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!accessResponse.data.success) {
      throw new Error('Failed to get user access: ' + accessResponse.data.message);
    }

    const userData = accessResponse.data.data;
    console.log('✅ User access data retrieved\n');

    console.log('📊 USER INFO:');
    console.log(`   Username: ${userData.user.username}`);
    console.log(`   Role: ${userData.role.name} (ID: ${userData.role.id})`);
    console.log(`   Role Level: ${userData.role.level}`);
    
    console.log(`\n📂 ALLOWED MODULES (${userData.allowedModules.length}):`);
    userData.allowedModules.forEach(module => {
      console.log(`   ✅ ${module}`);
    });

    console.log(`\n🧭 NAVIGATION ITEMS (${userData.navigation.length}):`);
    userData.navigation.forEach(nav => {
      console.log(`   📍 ${nav.name} → ${nav.href} (${nav.icon})`);
    });

    console.log(`\n🔍 CHECKING FOR MISSING MODULES:`);
    const expectedModules = ['campaign_types', 'card_users', 'permissions'];
    const missingModules = expectedModules.filter(mod => !userData.allowedModules.includes(mod));
    
    if (missingModules.length === 0) {
      console.log('   🎉 All expected modules are present!');
    } else {
      console.log('   ⚠️  Missing modules:', missingModules);
    }

    console.log(`\n🔍 CHECKING FOR MISSING NAVIGATION:`);
    const expectedNavigation = [
      'Role Management',
      'Campaign Types', 
      'Card Users'
    ];
    const currentNavNames = userData.navigation.map(nav => nav.name);
    const missingNav = expectedNavigation.filter(name => !currentNavNames.includes(name));
    
    if (missingNav.length === 0) {
      console.log('   🎉 All expected navigation items are present!');
      console.log(`\n✅ SUCCESS! The admin user should now see all ${userData.navigation.length} navigation items.`);
      console.log('   Please refresh the frontend application and you should see:');
      console.log('   • Role Management');
      console.log('   • Campaign Types');
      console.log('   • Card Users');
    } else {
      console.log('   ⚠️  Missing navigation items:', missingNav);
    }

    // Show module access details
    console.log(`\n📋 MODULE ACCESS DETAILS:`);
    Object.keys(userData.moduleAccess).forEach(module => {
      const permissions = userData.moduleAccess[module];
      console.log(`   📂 ${module}: ${permissions.length} permissions`);
      permissions.forEach(perm => {
        console.log(`      • ${perm}`);
      });
    });

  } catch (error) {
    console.error('❌ Error testing admin navigation:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAdminNavigation();
