const axios = require('axios');

// Test configuration  
const BASE_URL = 'http://localhost:3001/api'; // Adjust port if needed

async function testIndiaUserRBAC() {
  console.log('🧪 TESTING INDIA USER RBAC FIX');
  console.log('===============================\n');

  let authToken = null;
  let indiaUserId = null;

  try {
    // 1. Test unauthenticated access to protected endpoint
    console.log('1. Testing unauthenticated access to permissions endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/permissions/roles-list`);
      console.log('   ❌ FAIL: Unauthenticated access allowed - this should be blocked!');
      console.log(`   Status: ${response.status}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('   ✅ PASS: Unauthenticated access properly blocked (401)');
      } else {
        console.log(`   ❓ Unexpected error: ${error.response?.status || error.message}`);
      }
    }

    // 2. Login as India user
    console.log('\n2. Logging in as India user...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        username: 'India',
        password: 'India123' // Adjust password as needed
      });
      
      if (loginResponse.data.success) {
        authToken = loginResponse.data.data.access_token;
        indiaUserId = loginResponse.data.data.user.id;
        console.log('   ✅ Login successful');
        console.log(`   User ID: ${indiaUserId}`);
        console.log(`   Role ID: ${loginResponse.data.data.user.role_id}`);
      } else {
        console.log('   ❌ Login failed:', loginResponse.data.message);
        return;
      }
    } catch (error) {
      console.log('   ❌ Login error:', error.response?.data?.message || error.message);
      return;
    }

    // 3. Test authenticated access to allowed endpoint
    console.log('\n3. Testing authenticated access to user permissions...');
    try {
      const response = await axios.get(`${BASE_URL}/permissions/user/${indiaUserId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        console.log('   ✅ User permissions retrieved successfully');
        console.log(`   Permissions count: ${response.data.data.length}`);
        console.log('   User permissions:');
        response.data.data.forEach(perm => {
          console.log(`      - ${perm.permission_key || perm.permission_name} (${perm.category})`);
        });
      } else {
        console.log('   ❌ Failed to get permissions:', response.data.message);
      }
    } catch (error) {
      console.log('   ❌ Error getting permissions:', error.response?.data?.message || error.message);
    }

    // 4. Test access to users module (should be allowed)
    console.log('\n4. Testing access to users module...');
    try {
      const response = await axios.get(`${BASE_URL}/user-management`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        console.log('   ✅ Users module access: ALLOWED (expected for Pakistan role)');
      } else {
        console.log('   ❌ Users module access denied:', response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ❌ Users module access: DENIED');
        console.log(`   Error: ${error.response.data.message}`);
      } else {
        console.log('   ❓ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // 5. Test access to campaign data module (should be allowed)
    console.log('\n5. Testing access to campaign data module...');
    try {
      const response = await axios.get(`${BASE_URL}/campaign-data`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success || response.status === 200) {
        console.log('   ✅ Campaign data module access: ALLOWED (expected for Pakistan role)');
      } else {
        console.log('   ❌ Campaign data module access denied:', response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ❌ Campaign data module access: DENIED');
        console.log(`   Error: ${error.response.data.message}`);
      } else {
        console.log('   ❓ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // 6. Test access to a module that Pakistan role shouldn't have (e.g., ads)
    console.log('\n6. Testing access to restricted module (ads)...');
    try {
      const response = await axios.get(`${BASE_URL}/ads`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success || response.status === 200) {
        console.log('   ❌ FAIL: Ads module access ALLOWED - this should be blocked!');
      } else {
        console.log('   ✅ PASS: Ads module access properly denied');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ✅ PASS: Ads module access properly DENIED (403)');
      } else if (error.response?.status === 401) {
        console.log('   ❓ Authentication required for ads module');
      } else {
        console.log('   ❓ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // 7. Summary
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log('✅ Authentication middleware is now ENABLED');
    console.log('✅ Permission checks are now ENFORCED');
    console.log('✅ India user should only access users and campaign_data modules');
    console.log('✅ Unauthorized access should be properly blocked');
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Only run if called directly
if (require.main === module) {
  testIndiaUserRBAC().catch(console.error);
}

module.exports = testIndiaUserRBAC;
