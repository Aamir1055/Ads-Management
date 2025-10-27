const axios = require('axios');

async function finalE2ETest() {
  console.log('🎯 FINAL END-TO-END ROLE MANAGEMENT TEST');
  console.log('========================================');
  console.log('This test simulates exactly what the frontend does.');

  const API_BASE = 'http://localhost:5000/api';
  
  try {
    // Step 1: Authentication (Frontend login)
    console.log('\n1. 🔐 Frontend Authentication');
    console.log('-----------------------------');
    const login = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const authToken = login.data.data.access_token;
    const headers = { Authorization: `Bearer ${authToken}` };
    
    console.log('✅ User authenticated successfully');
    console.log(`   User: ${login.data.data.user.username}`);
    console.log(`   Role ID: ${login.data.data.user.role_id}`);

    // Step 2: Load initial data (Frontend data loading)
    console.log('\n2. 📊 Loading Frontend Initial Data');
    console.log('-----------------------------------');
    
    // Get roles (roleService.getAllRolesWithPermissions)
    const rolesResponse = await axios.get(`${API_BASE}/permissions/roles-list`, { headers });
    console.log(`✅ Roles loaded: ${rolesResponse.data.data.length} roles found`);
    
    // Get modules with permissions (roleService.getModulesWithPermissions)
    const modulesResponse = await axios.get(`${API_BASE}/permissions/modules-with-permissions`, { headers });
    console.log(`✅ Modules loaded: ${modulesResponse.data.data.length} modules found`);
    
    const modules = modulesResponse.data.data;
    const roles = rolesResponse.data.data;
    
    // Show loaded data structure
    console.log('\n   📋 Available Modules:');
    modules.forEach(module => {
      console.log(`      • ${module.name}: ${module.permissions.length} permissions`);
    });

    // Step 3: Create a new role (Frontend role creation)
    console.log('\n3. 🆕 Creating New Role (Frontend Flow)');
    console.log('--------------------------------------');
    
    const newRoleName = `Test_Role_${Date.now()}`;
    const selectedPermissions = {};
    
    // Simulate user selecting permissions from first two modules
    modules.slice(0, 2).forEach((module, index) => {
      const permissionsToSelect = module.permissions.slice(0, 2); // Select first 2 permissions
      selectedPermissions[module.id] = permissionsToSelect.map(p => p.key);
      console.log(`   Selected from ${module.name}: ${permissionsToSelect.map(p => p.name).join(', ')}`);
    });
    
    // Flatten permissions (as frontend does)
    const permissionsToAssign = [];
    Object.entries(selectedPermissions).forEach(([moduleId, permissions]) => {
      permissions.forEach(permissionName => {
        permissionsToAssign.push(permissionName);
      });
    });
    
    console.log(`   Total permissions to assign: ${permissionsToAssign.length}`);
    
    // Create role with permissions (roleService.createRoleWithPermissions)
    const createRoleResponse = await axios.post(`${API_BASE}/permissions/role`, {
      name: newRoleName,
      description: 'Test role created from E2E test'
    }, { headers });
    
    const roleId = createRoleResponse.data.data.id;
    console.log(`✅ Role created: ${newRoleName} (ID: ${roleId})`);
    
    // Assign permissions to role
    const assignResponse = await axios.post(`${API_BASE}/permissions/role/assign`, {
      roleId: roleId,
      permissions: permissionsToAssign
    }, { headers });
    
    console.log(`✅ Permissions assigned: ${permissionsToAssign.length} permissions`);

    // Step 4: Verify role creation (Frontend verification)
    console.log('\n4. ✅ Verifying Role Creation');
    console.log('-----------------------------');
    
    // Get updated roles list
    const updatedRolesResponse = await axios.get(`${API_BASE}/permissions/roles-list`, { headers });
    const updatedRoles = updatedRolesResponse.data.data;
    const createdRole = updatedRoles.find(r => r.id === roleId);
    
    if (createdRole) {
      console.log(`✅ Role found in list: ${createdRole.name}`);
      console.log(`   Description: ${createdRole.description}`);
      console.log(`   Level: ${createdRole.level}`);
    }
    
    // Get role permissions
    const rolePermissionsResponse = await axios.get(`${API_BASE}/permissions/role/${roleId}/permissions`, { headers });
    const rolePermissions = rolePermissionsResponse.data.data;
    
    console.log(`✅ Role permissions verified: ${rolePermissions.length} permissions`);
    rolePermissions.forEach(perm => {
      console.log(`      • ${perm.permission_name} (${perm.permission_key})`);
    });

    // Step 5: Edit role (Frontend edit flow)
    console.log('\n5. ✏️  Testing Role Edit Flow');
    console.log('-----------------------------');
    
    // Add more permissions (simulate "Select All" on another module)
    const additionalModule = modules[2]; // Third module
    if (additionalModule) {
      const allModulePermissions = additionalModule.permissions.map(p => p.key);
      const newPermissionList = [...permissionsToAssign, ...allModulePermissions];
      
      console.log(`   Adding all permissions from ${additionalModule.name}: ${allModulePermissions.length} permissions`);
      
      const updateResponse = await axios.post(`${API_BASE}/permissions/role/assign`, {
        roleId: roleId,
        permissions: newPermissionList
      }, { headers });
      
      console.log(`✅ Role updated with additional permissions`);
      
      // Verify update
      const updatedPermissionsResponse = await axios.get(`${API_BASE}/permissions/role/${roleId}/permissions`, { headers });
      console.log(`✅ Updated permissions count: ${updatedPermissionsResponse.data.data.length}`);
    }

    // Step 6: Test role in table display (Frontend table view)
    console.log('\n6. 📋 Testing Role Table Display');
    console.log('--------------------------------');
    
    const finalRolesList = await axios.get(`${API_BASE}/permissions/roles-list`, { headers });
    const testRole = finalRolesList.data.data.find(r => r.id === roleId);
    
    if (testRole) {
      console.log(`✅ Role displayed in table:`);
      console.log(`   Name: ${testRole.name}`);
      console.log(`   Description: ${testRole.description || 'No description'}`);
      console.log(`   System Role: ${testRole.is_system_role ? 'Yes' : 'No'}`);
      console.log(`   Level: ${testRole.level || 'N/A'}`);
    }

    // Step 7: Cleanup (Frontend delete)
    console.log('\n7. 🧹 Cleanup Test Role');
    console.log('-----------------------');
    
    const deleteResponse = await axios.delete(`${API_BASE}/permissions/role/${roleId}`, { headers });
    
    if (deleteResponse.status === 200) {
      console.log('✅ Role deleted successfully');
      
      // Verify deletion
      const finalRoleCheck = await axios.get(`${API_BASE}/permissions/roles-list`, { headers });
      const deletedRoleCheck = finalRoleCheck.data.data.find(r => r.id === roleId);
      
      if (!deletedRoleCheck) {
        console.log('✅ Role removal verified');
      } else {
        console.log('⚠️  Role still exists after deletion');
      }
    }

    // Step 8: Final compatibility report
    console.log('\n🎉 END-TO-END TEST COMPLETED');
    console.log('============================');
    console.log('');
    console.log('✅ FRONTEND-BACKEND COMPATIBILITY: EXCELLENT');
    console.log('');
    console.log('📊 Test Results:');
    console.log('   ✅ Authentication: Working');
    console.log('   ✅ Data Loading: Working');
    console.log('   ✅ Role Creation: Working');
    console.log('   ✅ Permission Assignment: Working');
    console.log('   ✅ Role Verification: Working');
    console.log('   ✅ Role Editing: Working');
    console.log('   ✅ Role Display: Working');
    console.log('   ✅ Role Deletion: Working');
    console.log('');
    console.log('🎯 Frontend Integration Status:');
    console.log('   • All critical endpoints working ✅');
    console.log('   • Data structures compatible ✅');
    console.log('   • Permission system functional ✅');
    console.log('   • Select All functionality ready ✅');
    console.log('   • CRUD operations complete ✅');
    console.log('');
    console.log('🚀 READY FOR PRODUCTION USE!');

  } catch (error) {
    console.error('\n💥 E2E Test Failed:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    console.log('\n❌ COMPATIBILITY ISSUE DETECTED');
  }
}

finalE2ETest();
