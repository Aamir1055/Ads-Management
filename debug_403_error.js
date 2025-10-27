const axios = require('axios');

async function debug403Error() {
  console.log('🚨 DEBUGGING 403 ERROR IN USER MANAGEMENT');
  console.log('=========================================');

  const API_BASE = 'http://localhost:5000/api';
  
  try {
    // Test 1: Login and get token
    console.log('\n1. 🔐 Testing Authentication...');
    const login = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const authToken = login.data.data.access_token;
    console.log('✅ Login successful, token obtained');
    console.log(`   Token sample: ${authToken.substring(0, 30)}...`);

    // Test 2: Test user-management endpoint with token
    console.log('\n2. 🔍 Testing User Management Endpoint with Token...');
    const headers = { Authorization: `Bearer ${authToken}` };
    
    try {
      const users = await axios.get(`${API_BASE}/user-management`, { headers });
      console.log(`✅ User Management: ${users.status} - Working with token!`);
      console.log(`   Users found: ${users.data.data?.users?.length || 'N/A'}`);
    } catch (error) {
      console.log(`❌ User Management with Token: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      
      if (error.response?.status === 403) {
        console.log('🚨 403 FORBIDDEN - This means authentication middleware is working but user lacks permissions');
      }
    }

    // Test 3: Test without token to confirm middleware is working
    console.log('\n3. 🔒 Testing User Management without Token (should fail)...');
    try {
      const usersNoToken = await axios.get(`${API_BASE}/user-management`);
      console.log('❌ SECURITY ISSUE: Endpoint accessible without token!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Security OK: 401 Unauthorized without token (correct behavior)');
      } else if (error.response?.status === 403) {
        console.log('✅ Security OK: 403 Forbidden without token');
      } else {
        console.log(`⚠️  Unexpected response: ${error.response?.status}`);
      }
    }

    // Test 4: Check user permissions
    console.log('\n4. 🛡️  Checking User Permissions...');
    try {
      const currentUser = login.data.data.user;
      console.log(`   Current user: ${currentUser.username}`);
      console.log(`   Role ID: ${currentUser.role_id}`);
      
      // Check what permissions this user has
      const userPermissions = await axios.get(`${API_BASE}/permissions/role/${currentUser.role_id}/permissions`, { headers });
      console.log(`   User has ${userPermissions.data.data.length} permissions`);
      
      // Check for user management permissions
      const userMgmtPermissions = userPermissions.data.data.filter(p => 
        p.permission_key.includes('users_') || p.category === 'users'
      );
      
      console.log(`   User management permissions: ${userMgmtPermissions.length}`);
      userMgmtPermissions.forEach(perm => {
        console.log(`     • ${perm.permission_name} (${perm.permission_key})`);
      });
      
    } catch (error) {
      console.log(`❌ Permission check failed: ${error.response?.status}`);
    }

    // Test 5: Test role management endpoint (this was working)
    console.log('\n5. ⚖️  Testing Role Management (for comparison)...');
    try {
      const roles = await axios.get(`${API_BASE}/permissions/roles-list`, { headers });
      console.log(`✅ Role Management: ${roles.status} - Working fine`);
      console.log(`   Roles found: ${roles.data.data.length}`);
    } catch (error) {
      console.log(`❌ Role Management: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Test 6: Check middleware configuration
    console.log('\n6. 🔧 Middleware Configuration Analysis...');
    console.log('   User Management route: /api/user-management');
    console.log('   Role Management route: /api/permissions/roles-list');
    console.log('   Both should require authentication, but only user-management is failing with 403');
    console.log('   This suggests a permission-based middleware difference');

  } catch (error) {
    console.error('\n💥 Debug failed:', error.message);
  }
}

debug403Error();
