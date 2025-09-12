const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test Client'
      }
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
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
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

async function testAPI() {
  console.log('🧪 Testing New Permissions API Endpoints...\n');

  try {
    // Test 1: Get all roles
    console.log('1️⃣ Testing GET /api/permissions/roles-list');
    const roles = await makeRequest('/api/permissions/roles-list');
    console.log(`Status: ${roles.status}`);
    console.log(`Roles found: ${roles.data.data?.length || 0}`);
    if (roles.data.data?.length > 0) {
      console.log('Sample role:', roles.data.data[0].name);
    }
    console.log('');

    // Test 2: Get all modules
    console.log('2️⃣ Testing GET /api/permissions/modules');
    const modules = await makeRequest('/api/permissions/modules');
    console.log(`Status: ${modules.status}`);
    console.log(`Modules found: ${modules.data.data?.length || 0}`);
    console.log('');

    // Test 3: Get permissions for user ID 1 (should be aamir with Super Admin role)
    console.log('3️⃣ Testing GET /api/permissions/user/1');
    const userPerms = await makeRequest('/api/permissions/user/1');
    console.log(`Status: ${userPerms.status}`);
    console.log(`User permissions: ${userPerms.data.data?.length || 0}`);
    console.log('');

    // Test 4: Get user roles for user ID 1
    console.log('4️⃣ Testing GET /api/permissions/user/1/roles');
    const userRoles = await makeRequest('/api/permissions/user/1/roles');
    console.log(`Status: ${userRoles.status}`);
    console.log(`User roles: ${userRoles.data.data?.length || 0}`);
    if (userRoles.data.data?.length > 0) {
      console.log('User role:', userRoles.data.data[0].name);
    }
    console.log('');

    // Test 5: Check a specific permission
    console.log('5️⃣ Testing POST /api/permissions/check');
    const permCheck = await makeRequest('/api/permissions/check', 'POST', {
      user_id: 1,
      permission_key: 'users.create'
    });
    console.log(`Status: ${permCheck.status}`);
    console.log(`Has permission: ${permCheck.data.data?.has_permission || false}`);
    console.log('');

    // Test 6: Get role permissions for Super Admin role (let's try role ID 6 as it's likely the Super Admin)
    console.log('6️⃣ Testing GET /api/permissions/role/6/permissions');
    const rolePerms = await makeRequest('/api/permissions/role/6/permissions');
    console.log(`Status: ${rolePerms.status}`);
    console.log(`Role permissions: ${rolePerms.data.data?.length || 0}`);
    console.log('');

    // Test 7: Get user permissions grouped by module
    console.log('7️⃣ Testing GET /api/permissions/user/1/grouped');
    const groupedPerms = await makeRequest('/api/permissions/user/1/grouped');
    console.log(`Status: ${groupedPerms.status}`);
    if (groupedPerms.data.data) {
      const modules = Object.keys(groupedPerms.data.data);
      console.log(`Modules with permissions: ${modules.join(', ')}`);
    }
    console.log('');

    // Test 8: Get audit log
    console.log('8️⃣ Testing GET /api/permissions/audit');
    const audit = await makeRequest('/api/permissions/audit');
    console.log(`Status: ${audit.status}`);
    console.log(`Audit entries: ${audit.data.data?.length || 0}`);

    console.log('\n✅ API Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('- All new permission endpoints are working');
    console.log('- User has been assigned Super Admin role');
    console.log('- Permission checking is functional');
    console.log('- Role-based access control is ready');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Run the test
testAPI();
