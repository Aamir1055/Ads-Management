#!/usr/bin/env node

/**
 * COMPREHENSIVE PERMISSIONS API TEST SCRIPT
 * Tests all the fixed permissions endpoints to ensure they work correctly
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// ANSI colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.cyan}\n=== ${msg} ===${colors.reset}`)
};

class PermissionsTestSuite {
  constructor() {
    this.testResults = [];
    this.createdRoles = [];
    this.createdModules = [];
  }

  async runTest(testName, testFunction) {
    try {
      log.info(`Running: ${testName}`);
      const result = await testFunction();
      this.testResults.push({ name: testName, status: 'PASS', result });
      log.success(`${testName} - PASSED`);
      return result;
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      log.error(`${testName} - FAILED: ${error.message}`);
      throw error;
    }
  }

  async makeRequest(method, endpoint, data = null, params = null) {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      timeout: 10000
    };

    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    if (params) {
      config.params = params;
    }

    const response = await axios(config);
    return response.data;
  }

  // HEALTH CHECK
  async testHealthCheck() {
    const response = await this.makeRequest('GET', '/health');
    if (!response.success) {
      throw new Error('Health check failed');
    }
    return response;
  }

  // ROLES TESTS
  async testListRoles() {
    const response = await this.makeRequest('GET', '/permissions/roles');
    if (!response.success) {
      throw new Error('Failed to list roles');
    }
    log.info(`Found ${response.data.length} roles`);
    return response;
  }

  async testCreateRole() {
    const roleData = {
      role_name: `Test Role ${Date.now()}`,
      description: 'Test role created by automated test',
      is_active: true
    };

    const response = await this.makeRequest('POST', '/permissions/roles', roleData);
    
    if (!response.success || !response.data) {
      throw new Error('Failed to create role');
    }

    this.createdRoles.push(response.data);
    log.info(`Created role with ID: ${response.data.id}`);
    return response;
  }

  async testUpdateRole() {
    if (this.createdRoles.length === 0) {
      throw new Error('No test role available for update');
    }

    const role = this.createdRoles[0];
    const updateData = {
      role_name: role.name + ' (Updated)',
      description: 'Updated description'
    };

    const response = await this.makeRequest('PUT', `/permissions/roles/${role.id}`, updateData);
    
    if (!response.success) {
      throw new Error('Failed to update role');
    }

    log.info(`Updated role ${role.id}`);
    return response;
  }

  // MODULES TESTS
  async testListModules() {
    const response = await this.makeRequest('GET', '/permissions/modules');
    if (!response.success) {
      throw new Error('Failed to list modules');
    }
    log.info(`Found ${response.data.length} modules`);
    return response;
  }

  async testCreateModule() {
    const moduleData = {
      module_name: `test_module_${Date.now()}`,
      module_path: '/api/test',
      description: 'Test module created by automated test',
      is_active: true
    };

    const response = await this.makeRequest('POST', '/permissions/modules', moduleData);
    
    if (!response.success || !response.data) {
      throw new Error('Failed to create module');
    }

    this.createdModules.push(response.data);
    log.info(`Created module with ID: ${response.data.id}`);
    return response;
  }

  // PERMISSIONS TESTS
  async testListPermissions() {
    const response = await this.makeRequest('GET', '/permissions');
    if (!response.success) {
      throw new Error('Failed to list permissions');
    }
    log.info(`Found ${response.data.length} permission entries`);
    return response;
  }

  async testGrantPermission() {
    if (this.createdRoles.length === 0) {
      throw new Error('Need test role for permission grant test');
    }

    // First get available permissions
    const permissionsResponse = await this.makeRequest('GET', '/permissions/permissions-list');
    if (!permissionsResponse.success || !permissionsResponse.data.length) {
      throw new Error('No permissions available for testing');
    }

    const role = this.createdRoles[0];
    const permission_ids = permissionsResponse.data.slice(0, 2).map(p => p.id); // Grant first 2 permissions
    
    const permissionData = {
      role_id: role.id,
      permission_ids: permission_ids
    };

    const response = await this.makeRequest('POST', '/permissions/grant', permissionData);
    
    if (!response.success) {
      throw new Error('Failed to grant permission');
    }

    log.info(`Granted ${permission_ids.length} permissions to role ${role.id}`);
    return response;
  }

  async testRevokePermission() {
    if (this.createdRoles.length === 0) {
      throw new Error('Need test role for permission revoke test');
    }

    const role = this.createdRoles[0];
    
    // First get the role's permissions to revoke one
    const permissionsResponse = await this.makeRequest('GET', '/permissions', null, { role_id: role.id });
    if (!permissionsResponse.success || !permissionsResponse.data.length) {
      log.warn('No permissions found for role to revoke');
      return { success: true, message: 'No permissions to revoke' };
    }

    const permission_id = permissionsResponse.data[0].permission_id;
    
    const params = {
      role_id: role.id,
      permission_id: permission_id
    };

    const response = await this.makeRequest('DELETE', '/permissions', null, params);
    
    if (!response.success) {
      throw new Error('Failed to revoke permission');
    }

    log.info(`Revoked permission ${permission_id} from role ${role.id}`);
    return response;
  }

  // NEW PERMISSIONS ENDPOINTS TESTS
  async testGetAllRoles() {
    const response = await this.makeRequest('GET', '/permissions/roles-list');
    if (!response.success) {
      throw new Error('Failed to get all roles');
    }
    log.info(`Retrieved ${response.data.length} roles via roles-list endpoint`);
    return response;
  }

  async testGetAllPermissions() {
    const response = await this.makeRequest('GET', '/permissions/permissions-list');
    if (!response.success) {
      throw new Error('Failed to get all permissions');
    }
    log.info(`Retrieved ${response.data.length} permissions via permissions-list endpoint`);
    return response;
  }

  async testCheckPermission() {
    // Test with a user that should exist (user ID 1 is usually admin)
    const permissionData = {
      user_id: 1,
      permission_key: 'users.read'
    };

    const response = await this.makeRequest('POST', '/permissions/check', permissionData);
    
    if (!response.success) {
      throw new Error('Failed to check permission');
    }

    log.info(`Permission check result: ${response.data.has_permission}`);
    return response;
  }

  // CLEANUP
  async cleanup() {
    log.title('CLEANUP');
    
    // Clean up created modules
    for (const module of this.createdModules) {
      try {
        // Note: We don't have a delete module endpoint in the controller,
        // so we'll skip cleanup for modules in this test
        log.warn(`Skipping cleanup for module ${module.id} (no delete endpoint)`);
      } catch (error) {
        log.warn(`Failed to cleanup module ${module.id}: ${error.message}`);
      }
    }

    // Clean up created roles
    for (const role of this.createdRoles) {
      try {
        // Note: We don't have a delete role endpoint in the controller,
        // so we'll skip cleanup for roles in this test
        log.warn(`Skipping cleanup for role ${role.id} (no delete endpoint)`);
      } catch (error) {
        log.warn(`Failed to cleanup role ${role.id}: ${error.message}`);
      }
    }
  }

  // MAIN TEST RUNNER
  async runAllTests() {
    log.title('PERMISSIONS API TEST SUITE');
    log.info('Starting comprehensive permissions system tests...');

    try {
      // Basic health check
      await this.runTest('Health Check', () => this.testHealthCheck());

      // Roles tests
      log.title('ROLES TESTS');
      await this.runTest('List Roles', () => this.testListRoles());
      await this.runTest('Create Role', () => this.testCreateRole());
      await this.runTest('Update Role', () => this.testUpdateRole());
      await this.runTest('Get All Roles', () => this.testGetAllRoles());

      // Modules tests
      log.title('MODULES TESTS');
      await this.runTest('List Modules', () => this.testListModules());
      await this.runTest('Create Module', () => this.testCreateModule());

      // Permissions tests
      log.title('PERMISSIONS TESTS');
      await this.runTest('List Permissions', () => this.testListPermissions());
      await this.runTest('Grant Permission', () => this.testGrantPermission());
      await this.runTest('Get All Permissions', () => this.testGetAllPermissions());
      await this.runTest('Check Permission', () => this.testCheckPermission());
      await this.runTest('Revoke Permission', () => this.testRevokePermission());

    } catch (error) {
      log.error(`Test suite failed: ${error.message}`);
    } finally {
      // Always try cleanup
      await this.cleanup();
      
      // Print results summary
      this.printResults();
    }
  }

  printResults() {
    log.title('TEST RESULTS SUMMARY');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`\nTotal Tests: ${this.testResults.length}`);
    log.success(`Passed: ${passed}`);
    if (failed > 0) {
      log.error(`Failed: ${failed}`);
    }

    // Show failed tests details
    const failedTests = this.testResults.filter(r => r.status === 'FAIL');
    if (failedTests.length > 0) {
      log.title('FAILED TESTS DETAILS');
      failedTests.forEach(test => {
        console.log(`${colors.red}✗ ${test.name}: ${test.error}${colors.reset}`);
      });
    }

    // Overall result
    if (failed === 0) {
      log.success('\n🎉 ALL TESTS PASSED! The permissions system is working correctly.');
    } else {
      log.error(`\n❌ ${failed} TEST(S) FAILED. Please check the issues above.`);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new PermissionsTestSuite();
  
  testSuite.runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      log.error(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = PermissionsTestSuite;
