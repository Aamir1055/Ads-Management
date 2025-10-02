/**
 * Frontend-Backend Integration Test for Role Management
 * 
 * This script tests the complete integration between frontend components
 * and backend API endpoints to ensure perfect compatibility.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const FRONTEND_BASE_URL = 'http://localhost:3001'; // Assuming React runs on 3001

class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.authToken = null;
    this.testRoleId = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.testResults.push(logEntry);
    
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async authenticate() {
    try {
      this.log('🔐 Authenticating for integration tests...');
      
      // This should use the same authentication method the frontend uses
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@example.com', // Use actual test credentials
        password: 'admin123'
      });
      
      if (response.data.token) {
        this.authToken = response.data.token;
        this.log('✅ Authentication successful', 'success');
        return true;
      }
      
      this.log('❌ Authentication failed - no token received', 'error');
      return false;
    } catch (error) {
      this.log(`❌ Authentication failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testBackendEndpoints() {
    this.log('🔍 Testing backend API endpoints...');
    
    const headers = {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };

    try {
      // Test 1: Get all roles with permissions (frontend calls this on load)
      this.log('Testing GET /permissions/roles-list...');
      const rolesResponse = await axios.get(`${BASE_URL}/permissions/roles-list`, { headers });
      
      if (rolesResponse.data && Array.isArray(rolesResponse.data)) {
        this.log('✅ Roles list endpoint working correctly', 'success');
        this.log(`   Found ${rolesResponse.data.length} roles`, 'info');
      } else {
        this.log('❌ Roles list endpoint returned invalid data structure', 'error');
      }

      // Test 2: Get modules with permissions (frontend calls this on load)
      this.log('Testing GET /permissions/modules-with-permissions...');
      const modulesResponse = await axios.get(`${BASE_URL}/permissions/modules-with-permissions`, { headers });
      
      if (modulesResponse.data && Array.isArray(modulesResponse.data)) {
        this.log('✅ Modules with permissions endpoint working correctly', 'success');
        this.log(`   Found ${modulesResponse.data.length} modules`, 'info');
      } else {
        this.log('❌ Modules endpoint returned invalid data structure', 'error');
      }

      return { rolesResponse, modulesResponse };
    } catch (error) {
      this.log(`❌ Backend endpoint test failed: ${error.message}`, 'error');
      return null;
    }
  }

  async testRoleCreation() {
    this.log('🔍 Testing role creation integration...');
    
    const headers = {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };

    try {
      // Test creating a role with the exact payload format the frontend sends
      const testRole = {
        role_name: 'Integration_Test_Role',
        description: 'Created by integration test script',
        permissions: ['users.view', 'users.create'] // Example permissions
      };

      this.log('Creating test role with frontend-compatible payload...');
      const createResponse = await axios.post(`${BASE_URL}/permissions/roles`, testRole, { headers });
      
      if (createResponse.status === 201 || createResponse.status === 200) {
        this.log('✅ Role creation successful', 'success');
        this.testRoleId = createResponse.data.role?.id || createResponse.data.id;
        this.log(`   Created role with ID: ${this.testRoleId}`, 'info');
        return true;
      } else {
        this.log('❌ Role creation failed - unexpected status', 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Role creation failed: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }

  async testRoleUpdate() {
    if (!this.testRoleId) {
      this.log('⚠️  Skipping role update test - no test role created', 'warning');
      return false;
    }

    this.log('🔍 Testing role update integration...');
    
    const headers = {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };

    try {
      // Test updating with the exact payload format the frontend sends
      const updatePayload = {
        role_name: 'Updated_Integration_Test_Role',
        description: 'Updated by integration test script',
        permissions: ['users.view', 'users.create', 'users.update'] // Added permission
      };

      this.log(`Updating test role ${this.testRoleId}...`);
      const updateResponse = await axios.put(`${BASE_URL}/permissions/roles/${this.testRoleId}`, updatePayload, { headers });
      
      if (updateResponse.status === 200) {
        this.log('✅ Role update successful', 'success');
        return true;
      } else {
        this.log('❌ Role update failed - unexpected status', 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Role update failed: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }

  async testInputValidation() {
    this.log('🔍 Testing input validation compatibility...');
    
    const headers = {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };

    const validationTests = [
      {
        name: 'Empty role name',
        payload: { role_name: '', description: 'Test' },
        expectedError: 'Role name is required'
      },
      {
        name: 'Role name too short',
        payload: { role_name: 'ab', description: 'Test' },
        expectedError: 'Role name must be between 3 and 50 characters'
      },
      {
        name: 'Role name too long',
        payload: { role_name: 'a'.repeat(51), description: 'Test' },
        expectedError: 'Role name must be between 3 and 50 characters'
      },
      {
        name: 'Invalid characters in role name',
        payload: { role_name: 'Test@Role!', description: 'Test' },
        expectedError: 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'
      },
      {
        name: 'Description too long',
        payload: { role_name: 'ValidRole', description: 'a'.repeat(256) },
        expectedError: 'Description cannot exceed 255 characters'
      }
    ];

    let passedTests = 0;

    for (const test of validationTests) {
      try {
        this.log(`   Testing: ${test.name}...`);
        await axios.post(`${BASE_URL}/permissions/roles`, test.payload, { headers });
        this.log(`   ❌ Expected validation error but request succeeded for: ${test.name}`, 'error');
      } catch (error) {
        if (error.response?.status === 400) {
          const errorMessage = error.response.data.message || '';
          if (errorMessage.toLowerCase().includes(test.expectedError.toLowerCase().split(' ')[0])) {
            this.log(`   ✅ Validation working correctly for: ${test.name}`, 'success');
            passedTests++;
          } else {
            this.log(`   ⚠️  Different validation message for ${test.name}: ${errorMessage}`, 'warning');
          }
        } else {
          this.log(`   ❌ Unexpected error for ${test.name}: ${error.message}`, 'error');
        }
      }
    }

    this.log(`Validation tests: ${passedTests}/${validationTests.length} passed`, passedTests === validationTests.length ? 'success' : 'warning');
    return passedTests === validationTests.length;
  }

  async testPermissionAssignment() {
    if (!this.testRoleId) {
      this.log('⚠️  Skipping permission assignment test - no test role created', 'warning');
      return false;
    }

    this.log('🔍 Testing permission assignment integration...');
    
    const headers = {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };

    try {
      // Test the permission assignment endpoint that frontend uses
      const permissionsToAssign = ['users.view', 'users.create', 'roles.view'];
      
      this.log('Testing permission assignment endpoint...');
      const assignResponse = await axios.post(`${BASE_URL}/permissions/role/assign`, {
        role_id: this.testRoleId,
        permissions: permissionsToAssign
      }, { headers });
      
      if (assignResponse.status === 200) {
        this.log('✅ Permission assignment successful', 'success');
        
        // Verify permissions were assigned by getting role permissions
        const rolePermResponse = await axios.get(`${BASE_URL}/permissions/role/${this.testRoleId}/permissions`, { headers });
        
        if (rolePermResponse.data && Array.isArray(rolePermResponse.data)) {
          const assignedPermKeys = rolePermResponse.data.map(p => p.permission_key || p.key);
          const allAssigned = permissionsToAssign.every(perm => assignedPermKeys.includes(perm));
          
          if (allAssigned) {
            this.log('✅ Permission assignment verification successful', 'success');
            return true;
          } else {
            this.log('❌ Permission assignment verification failed - not all permissions assigned', 'error');
            return false;
          }
        }
      }
      
      return false;
    } catch (error) {
      this.log(`❌ Permission assignment test failed: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }

  async testErrorHandling() {
    this.log('🔍 Testing error handling compatibility...');
    
    const headers = {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };

    const errorTests = [
      {
        name: 'Duplicate role name',
        payload: { role_name: 'Administrator', description: 'Should fail' },
        expectedStatus: 409
      },
      {
        name: 'Non-existent role update',
        endpoint: `/permissions/roles/99999`,
        method: 'PUT',
        payload: { role_name: 'NonExistent', description: 'Should fail' },
        expectedStatus: 404
      },
      {
        name: 'System role deletion attempt',
        endpoint: `/permissions/roles/1`, // Assuming role ID 1 is a system role
        method: 'DELETE',
        expectedStatus: 403
      }
    ];

    let passedTests = 0;

    for (const test of errorTests) {
      try {
        this.log(`   Testing: ${test.name}...`);
        
        let response;
        if (test.method === 'DELETE') {
          response = await axios.delete(`${BASE_URL}${test.endpoint}`, { headers });
        } else if (test.method === 'PUT') {
          response = await axios.put(`${BASE_URL}${test.endpoint}`, test.payload, { headers });
        } else {
          response = await axios.post(`${BASE_URL}/permissions/roles`, test.payload, { headers });
        }
        
        this.log(`   ❌ Expected error status ${test.expectedStatus} but got ${response.status} for: ${test.name}`, 'error');
      } catch (error) {
        if (error.response?.status === test.expectedStatus) {
          this.log(`   ✅ Error handling working correctly for: ${test.name}`, 'success');
          passedTests++;
        } else {
          this.log(`   ⚠️  Expected status ${test.expectedStatus} but got ${error.response?.status} for: ${test.name}`, 'warning');
        }
      }
    }

    this.log(`Error handling tests: ${passedTests}/${errorTests.length} passed`, passedTests === errorTests.length ? 'success' : 'warning');
    return passedTests === errorTests.length;
  }

  async cleanup() {
    if (this.testRoleId) {
      this.log('🧹 Cleaning up test data...');
      
      const headers = {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      };

      try {
        await axios.delete(`${BASE_URL}/permissions/roles/${this.testRoleId}`, { headers });
        this.log('✅ Test role cleaned up successfully', 'success');
      } catch (error) {
        this.log(`⚠️  Failed to cleanup test role: ${error.message}`, 'warning');
      }
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Frontend-Backend Integration Tests for Role Management', 'info');
    this.log('=' * 80, 'info');

    const results = {
      authentication: false,
      backendEndpoints: false,
      roleCreation: false,
      roleUpdate: false,
      inputValidation: false,
      permissionAssignment: false,
      errorHandling: false
    };

    try {
      // Step 1: Authentication
      results.authentication = await this.authenticate();
      if (!results.authentication) {
        this.log('❌ Cannot proceed without authentication', 'error');
        return results;
      }

      // Step 2: Test backend endpoints
      results.backendEndpoints = await this.testBackendEndpoints() !== null;

      // Step 3: Test role creation
      results.roleCreation = await this.testRoleCreation();

      // Step 4: Test role update
      results.roleUpdate = await this.testRoleUpdate();

      // Step 5: Test input validation
      results.inputValidation = await this.testInputValidation();

      // Step 6: Test permission assignment
      results.permissionAssignment = await this.testPermissionAssignment();

      // Step 7: Test error handling
      results.errorHandling = await this.testErrorHandling();

      // Cleanup
      await this.cleanup();

    } catch (error) {
      this.log(`❌ Integration test suite failed: ${error.message}`, 'error');
    }

    this.printSummary(results);
    return results;
  }

  printSummary(results) {
    this.log('=' * 80, 'info');
    this.log('📊 INTEGRATION TEST SUMMARY', 'info');
    this.log('=' * 80, 'info');

    const testNames = {
      authentication: 'Authentication',
      backendEndpoints: 'Backend Endpoints',
      roleCreation: 'Role Creation',
      roleUpdate: 'Role Update',
      inputValidation: 'Input Validation',
      permissionAssignment: 'Permission Assignment',
      errorHandling: 'Error Handling'
    };

    let passed = 0;
    let total = 0;

    for (const [key, result] of Object.entries(results)) {
      total++;
      if (result) {
        passed++;
        this.log(`✅ ${testNames[key]}: PASSED`, 'success');
      } else {
        this.log(`❌ ${testNames[key]}: FAILED`, 'error');
      }
    }

    this.log('=' * 80, 'info');
    this.log(`📈 OVERALL RESULT: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`, 
      passed === total ? 'success' : 'warning');

    if (passed === total) {
      this.log('🎉 FRONTEND-BACKEND INTEGRATION: FULLY COMPATIBLE! 🎉', 'success');
    } else {
      this.log('⚠️  Some integration issues detected. Review failed tests above.', 'warning');
    }

    this.log('=' * 80, 'info');
  }
}

// Run the integration tests
async function main() {
  const tester = new IntegrationTester();
  await tester.runAllTests();
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = IntegrationTester;
