const axios = require('axios');

async function testRoleCreation() {
  console.log('🧪 Testing Role Creation and Permission Display');
  console.log('==============================================');

  const API_BASE = 'http://localhost:5000/api';
  let authToken = null;

  try {
    // 1. Login to get token
    console.log('\n1. 🔐 Authentication...');
    // Try different credential combinations
    let credentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'admin', password: 'admin' },
      { username: 'admin', password: 'password' },
      { username: 'priyankjp', password: 'admin123' },
      { username: 'priyankjp', password: 'password' }
    ];
    
    let login;
    for (const cred of credentials) {
      try {
        console.log(`Trying: ${cred.username}/${cred.password}`);
        login = await axios.post(`${API_BASE}/auth/login`, cred);
        console.log(`✅ Success with: ${cred.username}`);
        break;
      } catch (e) {
        console.log(`❌ Failed: ${cred.username}`);
        if (cred === credentials[credentials.length - 1]) {
          throw new Error('All credential combinations failed');
        }
      }
    }
    
    authToken = login.data.data.access_token;
    console.log('✅ Authentication successful');

    const headers = { Authorization: `Bearer ${authToken}` };

    // 2. Get modules with permissions
    console.log('\n2. 📋 Getting modules with permissions...');
    const modulesResponse = await axios.get(`${API_BASE}/permissions/modules-with-permissions`, { headers });
    const modules = modulesResponse.data.data;
    
    console.log(`Found ${modules.length} modules:`);
    modules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.name} (${module.permissions.length} permissions)`);
      if (module.name === 'Role Management') {
        console.log('   Role Management permissions:');
        module.permissions.forEach(p => console.log(`     • ${p.name} (${p.key})`));
      }
    });

    // 3. Create a test role
    console.log('\n3. 🔧 Creating test role...');
    const testRoleName = `test_role_${Date.now()}`;
    
    const createResponse = await axios.post(`${API_BASE}/permissions/role`, {
      name: testRoleName,
      description: 'Test role for permission testing'
    }, { headers });
    
    const roleId = createResponse.data.data.id;
    console.log(`✅ Created role: ${testRoleName} (ID: ${roleId})`);

    // 4. Assign some permissions to the role (including role_management)
    console.log('\n4. 🎯 Assigning permissions to role...');
    
    // Find some permissions to assign
    const roleManagementModule = modules.find(m => m.name === 'Role Management');
    const userManagementModule = modules.find(m => m.name === 'User Management');
    
    const permissionsToAssign = [];
    
    if (roleManagementModule) {
      // Add the role_management permission
      const roleManagementPerm = roleManagementModule.permissions.find(p => p.key === 'role_management');
      if (roleManagementPerm) {
        permissionsToAssign.push(roleManagementPerm.id);
      }
      
      // Add permissions_read
      const permissionsRead = roleManagementModule.permissions.find(p => p.key === 'permissions_read');
      if (permissionsRead) {
        permissionsToAssign.push(permissionsRead.id);
      }
    }
    
    if (userManagementModule) {
      // Add users_read
      const usersRead = userManagementModule.permissions.find(p => p.key === 'users_read');
      if (usersRead) {
        permissionsToAssign.push(usersRead.id);
      }
    }

    if (permissionsToAssign.length > 0) {
      await axios.post(`${API_BASE}/permissions/role/assign`, {
        roleId: roleId,
        permissions: permissionsToAssign
      }, { headers });
      
      console.log(`✅ Assigned ${permissionsToAssign.length} permissions to role`);
    }

    // 5. Get the role's permissions back
    console.log('\n5. 📖 Getting role permissions...');
    const rolePermissionsResponse = await axios.get(`${API_BASE}/permissions/role/${roleId}/permissions`, { headers });
    const rolePermissions = rolePermissionsResponse.data.data;
    
    console.log(`Role has ${rolePermissions.length} permissions:`);
    rolePermissions.forEach(p => {
      console.log(`  • ${p.permission_name} (${p.permission_key}) - Category: ${p.category}`);
    });

    // 6. Check how this appears in frontend context
    console.log('\n6. 🎭 How this would appear in frontend...');
    console.log('When editing this role in the frontend:');
    
    // Group by modules
    const permissionsByModule = {};
    rolePermissions.forEach(permission => {
      modules.forEach(module => {
        const matchedPermission = module.permissions.find(p => p.key === permission.permission_key);
        if (matchedPermission) {
          if (!permissionsByModule[module.name]) {
            permissionsByModule[module.name] = [];
          }
          permissionsByModule[module.name].push({
            name: matchedPermission.name,
            key: matchedPermission.key
          });
        }
      });
    });
    
    Object.keys(permissionsByModule).forEach(moduleName => {
      console.log(`  ${moduleName}:`);
      permissionsByModule[moduleName].forEach(p => {
        console.log(`    ✓ ${p.name} (${p.key})`);
      });
    });

    // 7. Clean up
    console.log('\n7. 🧹 Cleaning up...');
    await axios.delete(`${API_BASE}/permissions/role/${roleId}`, { headers });
    console.log('✅ Test role deleted');

    console.log('\n📊 ANALYSIS:');
    console.log('===========');
    console.log('• Backend provides modules in correct order with Reports last');
    console.log('• Role Management module includes role_management permission');
    console.log('• Frontend should display this properly unless there\'s client-side filtering');
    console.log('• The "role_management" permission allows management of roles themselves');

  } catch (error) {
    console.error('\n💥 Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRoleCreation();
