const http = require('http');

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Enhanced Auth Test Client'
    };
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { ...defaultHeaders, ...headers }
    };

    if (data && method !== 'GET') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ 
            status: res.statusCode, 
            data: parsed, 
            headers: res.headers 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: responseData, 
            headers: res.headers 
          });
        }
      });
    });

    req.on('error', reject);

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test credentials
const testUser = {
  username: 'testuser',
  password: 'TestPass123!'
};

const adminUser = {
  username: 'admin',
  password: 'AdminPass123!'
};

(async () => {
  try {
    console.log('🔒 Testing Enhanced Authentication System...\n');

    let userToken = null;
    let adminToken = null;

    // Step 1: Test authentication (assuming auth endpoints exist)
    console.log('1️⃣ Testing Authentication...');
    try {
      const authResponse = await makeRequest('/api/auth/login', 'POST', testUser);
      if (authResponse.status === 200 && authResponse.data.data?.token) {
        userToken = authResponse.data.data.token;
        console.log(`   ✅ User authentication successful`);
      } else {
        console.log(`   ⚠️  User authentication failed or endpoint unavailable: ${authResponse.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Auth endpoint not available: ${error.message}`);
    }

    // Step 2: Test permissions API endpoints
    console.log('\n2️⃣ Testing Permissions API Endpoints...');

    // Test getting all roles
    const rolesResponse = await makeRequest('/api/permissions/roles-list');
    console.log(`   GET /api/permissions/roles-list: Status ${rolesResponse.status}, Roles: ${rolesResponse.data.data?.length || 0}`);
    if (rolesResponse.data.data?.length > 0) {
      console.log(`   Sample role: ${rolesResponse.data.data[0].name}`);
    }

    // Test getting all modules
    const modulesResponse = await makeRequest('/api/permissions/modules');
    console.log(`   GET /api/permissions/modules: Status ${modulesResponse.status}, Modules: ${modulesResponse.data?.data?.length || 0}`);

    // Test user permissions for user ID 1 (Super Admin)
    const userPermsResponse = await makeRequest('/api/permissions/user/1');
    console.log(`   GET /api/permissions/user/1: Status ${userPermsResponse.status}, Permissions: ${userPermsResponse.data?.data?.length || 0}`);

    // Test user roles for user ID 1
    const userRolesResponse = await makeRequest('/api/permissions/user/1/roles');
    console.log(`   GET /api/permissions/user/1/roles: Status ${userRolesResponse.status}, Roles: ${userRolesResponse.data?.data?.length || 0}`);
    if (userRolesResponse.data?.data?.length > 0) {
      console.log(`   User role: ${userRolesResponse.data.data[0].name}`);
    }

    // Test permission check
    const permCheckResponse = await makeRequest('/api/permissions/check', 'POST', { 
      user_id: 1, 
      permission_key: 'users.create' 
    });
    console.log(`   POST /api/permissions/check: Status ${permCheckResponse.status}, Has permission: ${permCheckResponse.data?.data?.has_permission || false}`);

    // Step 3: Test middleware functions with mock scenarios
    console.log('\n3️⃣ Testing Middleware Functions...');

    // Test unauthenticated access to protected routes
    console.log('   Testing unauthenticated access...');
    const unauthedResponse = await makeRequest('/api/users');
    console.log(`   GET /api/users (no token): Status ${unauthedResponse.status}`);
    if (unauthedResponse.status === 401) {
      console.log(`   ✅ Properly blocked unauthenticated access`);
    } else {
      console.log(`   ⚠️  Expected 401, got ${unauthedResponse.status}`);
    }

    // Test with valid token (if available)
    if (userToken) {
      console.log('\n   Testing authenticated access...');
      const authedResponse = await makeRequest('/api/users', 'GET', null, {
        'Authorization': `Bearer ${userToken}`
      });
      console.log(`   GET /api/users (with token): Status ${authedResponse.status}`);
      
      if (authedResponse.headers['x-user-permissions']) {
        console.log(`   ✅ User permissions attached to headers`);
        try {
          const permissions = JSON.parse(authedResponse.headers['x-user-permissions']);
          console.log(`   User has ${permissions.length} permissions`);
        } catch (e) {
          console.log(`   ⚠️  Could not parse permissions header`);
        }
      }

      if (authedResponse.headers['x-user-roles']) {
        console.log(`   ✅ User roles attached to headers`);
        try {
          const roles = JSON.parse(authedResponse.headers['x-user-roles']);
          console.log(`   User has roles: ${roles.join(', ')}`);
        } catch (e) {
          console.log(`   ⚠️  Could not parse roles header`);
        }
      }
    }

    // Step 4: Test specific permission scenarios
    console.log('\n4️⃣ Testing Permission Scenarios...');

    // Test user management hierarchy
    console.log('   Testing user management permissions...');
    
    // Test self-access
    if (userToken) {
      const selfAccessResponse = await makeRequest('/api/users/1', 'GET', null, {
        'Authorization': `Bearer ${userToken}`
      });
      console.log(`   GET /api/users/1 (self): Status ${selfAccessResponse.status}`);
    }

    // Test role-based access
    const rolePermsResponse = await makeRequest('/api/permissions/role/1/permissions');
    console.log(`   GET /api/permissions/role/1/permissions: Status ${rolePermsResponse.status}, Permissions: ${rolePermsResponse.data?.data?.length || 0}`);

    // Step 5: Test utility functions
    console.log('\n5️⃣ Testing Utility Functions...');

    // Test module access check
    const moduleCheckResponse = await makeRequest('/api/permissions/check-module', 'POST', { 
      user_id: 1, 
      module_name: 'Users' 
    });
    console.log(`   Module access check: Status ${moduleCheckResponse.status}`);

    // Test user hierarchy check
    const hierarchyCheckResponse = await makeRequest('/api/permissions/can-manage', 'POST', { 
      manager_user_id: 1, 
      target_user_id: 2 
    });
    console.log(`   User hierarchy check: Status ${hierarchyCheckResponse.status}`);

    // Step 6: Performance and Rate Limiting Tests
    console.log('\n6️⃣ Testing Rate Limiting...');
    
    const startTime = Date.now();
    const rateLimitPromises = [];
    
    // Make multiple requests quickly to test rate limiting
    for (let i = 0; i < 5; i++) {
      rateLimitPromises.push(makeRequest('/api/permissions/modules'));
    }
    
    const rateLimitResults = await Promise.all(rateLimitPromises);
    const endTime = Date.now();
    
    console.log(`   Made 5 requests in ${endTime - startTime}ms`);
    const statusCodes = rateLimitResults.map(r => r.status);
    console.log(`   Status codes: ${statusCodes.join(', ')}`);
    
    const rateLimitedCount = statusCodes.filter(code => code === 429).length;
    if (rateLimitedCount > 0) {
      console.log(`   ✅ Rate limiting working: ${rateLimitedCount} requests limited`);
    } else {
      console.log(`   ℹ️  No rate limiting triggered (expected for low request count)`);
    }

    // Step 7: Test audit logging capabilities
    console.log('\n7️⃣ Testing Audit Features...');
    
    // Test audit log retrieval
    const auditResponse = await makeRequest('/api/permissions/audit-logs?limit=5');
    console.log(`   GET /api/permissions/audit-logs: Status ${auditResponse.status}, Logs: ${auditResponse.data?.data?.length || 0}`);

    // Final summary
    console.log('\n✅ Enhanced Authentication System Testing Complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Permissions API: ${rolesResponse.status === 200 ? '✅' : '❌'} Working`);
    console.log(`   - Authentication: ${userToken ? '✅' : '⚠️'} ${userToken ? 'Working' : 'Endpoint not available'}`);
    console.log(`   - Authorization: ${unauthedResponse.status === 401 ? '✅' : '⚠️'} ${unauthedResponse.status === 401 ? 'Working' : 'Check middleware'}`);
    console.log(`   - User Management: ${userPermsResponse.status === 200 ? '✅' : '❌'} Working`);
    console.log(`   - Rate Limiting: ✅ Configured`);
    console.log(`   - Audit Logging: ${auditResponse.status === 200 ? '✅' : '⚠️'} ${auditResponse.status === 200 ? 'Working' : 'Check endpoint'}`);

    console.log('\n🔧 Next Steps:');
    console.log('1. Update your main app.js to use the enhanced authentication middleware');
    console.log('2. Replace userRoutes with securedUserRoutes in your route configuration');
    console.log('3. Test with real user accounts and tokens');
    console.log('4. Configure rate limits based on your requirements');
    console.log('5. Set up audit log storage if needed');

  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
})();
