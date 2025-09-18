const axios = require('axios');

async function testUpdatedPermissions() {
  const baseURL = 'http://localhost:3000/api';
  
  try {
    console.log('🔐 Step 1: Authenticating...');
    const authResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    if (authResponse.status === 200) {
      console.log('✅ Authentication successful');
      const token = authResponse.data.data.token;
      
      console.log('\n📊 Step 2: Testing updated modules-with-permissions API...');
      const modulesResponse = await axios.get(`${baseURL}/permissions/modules-with-permissions`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (modulesResponse.status === 200) {
        console.log('✅ API Response received');
        console.log(`Status: ${modulesResponse.status}`);
        
        const modules = modulesResponse.data.data;
        console.log(`\nFound ${modules.length} modules:`);
        
        // Check User Management Module
        const userManagementModule = modules.find(m => m.name === 'User Management');
        if (userManagementModule) {
          console.log('\n👥 User Management Module:');
          console.log(`Name: ${userManagementModule.name}`);
          console.log(`Description: ${userManagementModule.description}`);
          console.log(`Permissions count: ${userManagementModule.permissions.length}`);
          
          console.log('\n📋 User Management Permissions:');
          userManagementModule.permissions.forEach((perm, index) => {
            console.log(`  ${index + 1}. ${perm.name} (${perm.key})`);
            console.log(`     Description: ${perm.description}`);
          });
          
          // Check if "Manage User Roles" permission was removed
          const hasManageUserRoles = userManagementModule.permissions.some(p => 
            p.key === 'user_role_management' || p.name.includes('Manage User Roles')
          );
          
          if (!hasManageUserRoles) {
            console.log('✅ "Manage User Roles" permission successfully removed from User Management');
          } else {
            console.log('❌ "Manage User Roles" permission still present in User Management');
          }
        } else {
          console.log('❌ User Management module not found');
        }
        
        // Check Role Management Module  
        const roleManagementModule = modules.find(m => m.name === 'Role Management');
        if (roleManagementModule) {
          console.log('\n🎯 Role Management Module:');
          console.log(`Name: ${roleManagementModule.name}`);
          console.log(`Description: ${roleManagementModule.description}`);
          console.log(`Permissions count: ${roleManagementModule.permissions.length}`);
          
          console.log('\n📋 Role Management Permissions:');
          roleManagementModule.permissions.forEach((perm, index) => {
            console.log(`  ${index + 1}. ${perm.name} (${perm.key})`);
            console.log(`     Description: ${perm.description}`);
          });
          
          // Check that only CRUD permissions remain
          const expectedPermissions = ['roles_create', 'roles_read', 'roles_update', 'roles_delete'];
          const actualPermissions = roleManagementModule.permissions.map(p => p.key);
          
          const hasOnlyCrudPermissions = expectedPermissions.every(perm => 
            actualPermissions.includes(perm)
          ) && actualPermissions.length === expectedPermissions.length;
          
          if (hasOnlyCrudPermissions) {
            console.log('✅ Role Management now contains only CRUD permissions as expected');
          } else {
            console.log('❌ Role Management permissions do not match expected CRUD-only structure');
            console.log('Expected:', expectedPermissions);
            console.log('Actual:', actualPermissions);
          }
          
          // Check that redundant permissions were removed
          const redundantPermissions = [
            'permissions_assign', 'permissions_revoke', 
            'users_assign_roles', 'users_revoke_roles', 'role_management'
          ];
          const hasRedundantPermissions = redundantPermissions.some(perm => 
            actualPermissions.includes(perm)
          );
          
          if (!hasRedundantPermissions) {
            console.log('✅ Redundant permissions successfully removed from Role Management');
          } else {
            console.log('❌ Some redundant permissions still present in Role Management');
          }
        } else {
          console.log('❌ Role Management module not found');
        }
        
      } else {
        console.log(`❌ API request failed with status: ${modulesResponse.status}`);
      }
    } else {
      console.log(`❌ Authentication failed with status: ${authResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testUpdatedPermissions();
