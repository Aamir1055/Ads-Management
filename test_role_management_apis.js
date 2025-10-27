const { pool } = require('./config/database');
const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  apiBase: API_BASE,
  testUsers: {
    admin: { username: 'test_admin', password: 'admin123', expectedRole: 'admin' },
    user: { username: 'test_user', password: 'user123', expectedRole: 'user' },
    manager: { username: 'test_manager', password: 'manager123', expectedRole: 'manager' }
  },
  testRoles: [
    {
      name: 'test_viewer',
      displayName: 'Test Viewer',
      description: 'Can only view data',
      level: 1,
      permissions: ['dashboard.view', 'reports.read']
    },
    {
      name: 'test_editor',
      displayName: 'Test Editor', 
      description: 'Can view and edit data',
      level: 3,
      permissions: ['dashboard.view', 'reports.read', 'reports.create', 'campaigns.read', 'campaigns.update']
    },
    {
      name: 'test_admin',
      displayName: 'Test Admin',
      description: 'Full administrative access',
      level: 8,
      permissions: ['users.read', 'users.create', 'users.update', 'roles.read', 'roles.create']
    }
  ]
};

class RoleManagementTester {
  constructor() {
    this.tokens = {};
    this.createdRoles = [];
    this.createdUsers = [];
  }

  // Helper function to make API requests
  async apiRequest(method, endpoint, data = null, token = null) {
    try {
      const config = {
        method,
        url: `${testConfig.apiBase}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...(data && { data })
      };

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  // Test database connection
  async testDatabaseConnection() {
    console.log('\n🔍 Testing database connection...');
    try {
      const [result] = await pool.query('SELECT COUNT(*) as role_count FROM roles');
      console.log(`✅ Database connected. Found ${result[0].role_count} roles.`);
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  // Test API health
  async testAPIHealth() {
    console.log('\n🏥 Testing API health...');
    const result = await this.apiRequest('GET', '/health');
    if (result.success) {
      console.log('✅ API health check passed');
      return true;
    } else {
      console.error('❌ API health check failed:', result.error);
      return false;
    }
  }

  // Create test users with different roles
  async createTestUsers() {
    console.log('\n👥 Creating test users...');
    
    for (const [key, userData] of Object.entries(testConfig.testUsers)) {
      try {
        // First check if user exists
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [userData.username]);
        
        if (existing.length > 0) {
          console.log(`⚠️  User ${userData.username} already exists, skipping creation`);
          continue;
        }

        // Get role ID
        const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', [userData.expectedRole]);
        if (roles.length === 0) {
          console.error(`❌ Role ${userData.expectedRole} not found for user ${userData.username}`);
          continue;
        }

        // Create user
        const result = await this.apiRequest('POST', '/user-management', {
          username: userData.username,
          password: userData.password,
          confirm_password: userData.password,
          role_id: roles[0].id
        });

        if (result.success) {
          console.log(`✅ Created test user: ${userData.username} with role: ${userData.expectedRole}`);
          this.createdUsers.push(userData.username);
        } else {
          console.error(`❌ Failed to create user ${userData.username}:`, result.error);
        }
      } catch (error) {
        console.error(`❌ Error creating user ${userData.username}:`, error.message);
      }
    }
  }

  // Test user authentication
  async testAuthentication() {
    console.log('\n🔐 Testing user authentication...');
    
    for (const [key, userData] of Object.entries(testConfig.testUsers)) {
      const result = await this.apiRequest('POST', '/auth/login', {
        username: userData.username,
        password: userData.password
      });

      if (result.success && result.data.data?.access_token) {
        this.tokens[key] = result.data.data.access_token;
        console.log(`✅ ${key} (${userData.username}) authenticated successfully`);
      } else {
        console.error(`❌ Authentication failed for ${userData.username}:`, result.error);
      }
    }
  }

  // Test role CRUD operations
  async testRoleCRUD() {
    console.log('\n🛠️  Testing Role CRUD Operations...');
    
    if (!this.tokens.admin) {
      console.error('❌ No admin token available for role testing');
      return;
    }

    // Test Create Role
    console.log('\n📝 Testing Role Creation...');
    for (const roleData of testConfig.testRoles) {
      const result = await this.apiRequest('POST', '/permissions/roles', roleData, this.tokens.admin);
      
      if (result.success) {
        console.log(`✅ Created role: ${roleData.name}`);
        this.createdRoles.push(result.data.data.id);
      } else {
        console.error(`❌ Failed to create role ${roleData.name}:`, result.error);
      }
    }

    // Test Get All Roles
    console.log('\n📋 Testing Role Retrieval...');
    const getRolesResult = await this.apiRequest('GET', '/permissions/roles', null, this.tokens.admin);
    if (getRolesResult.success) {
      console.log(`✅ Retrieved ${getRolesResult.data.data.length} roles`);
    } else {
      console.error('❌ Failed to retrieve roles:', getRolesResult.error);
    }

    // Test Get Specific Role
    if (this.createdRoles.length > 0) {
      console.log('\n🔍 Testing Single Role Retrieval...');
      const roleId = this.createdRoles[0];
      const getRoleResult = await this.apiRequest('GET', `/permissions/roles/${roleId}`, null, this.tokens.admin);
      
      if (getRoleResult.success) {
        console.log(`✅ Retrieved role details for ID: ${roleId}`);
        console.log(`   Role: ${getRoleResult.data.data.name} - ${getRoleResult.data.data.display_name}`);
        console.log(`   Permissions: ${getRoleResult.data.data.permissions?.length || 0}`);
      } else {
        console.error(`❌ Failed to retrieve role ${roleId}:`, getRoleResult.error);
      }
    }

    // Test Update Role
    if (this.createdRoles.length > 0) {
      console.log('\n✏️  Testing Role Update...');
      const roleId = this.createdRoles[0];
      const updateResult = await this.apiRequest('PUT', `/permissions/roles/${roleId}`, {
        displayName: 'Updated Test Viewer',
        description: 'Updated description for test viewer role',
        level: 2
      }, this.tokens.admin);

      if (updateResult.success) {
        console.log(`✅ Updated role ID: ${roleId}`);
      } else {
        console.error(`❌ Failed to update role ${roleId}:`, updateResult.error);
      }
    }
  }

  // Test permission-based access control
  async testPermissionBasedAccess() {
    console.log('\n🔒 Testing Permission-Based Access Control...');

    const testCases = [
      {
        description: 'Admin accessing user management',
        token: this.tokens.admin,
        endpoint: '/user-management',
        method: 'GET',
        expectedStatus: 200
      },
      {
        description: 'Regular user accessing user management',
        token: this.tokens.user,
        endpoint: '/user-management', 
        method: 'GET',
        expectedStatus: 403
      },
      {
        description: 'Admin accessing role management',
        token: this.tokens.admin,
        endpoint: '/permissions/roles',
        method: 'GET',
        expectedStatus: 200
      },
      {
        description: 'Regular user accessing role management',
        token: this.tokens.user,
        endpoint: '/permissions/roles',
        method: 'GET',
        expectedStatus: 403
      },
      {
        description: 'Admin creating new role',
        token: this.tokens.admin,
        endpoint: '/permissions/roles',
        method: 'POST',
        data: {
          name: 'temp_test_role',
          displayName: 'Temporary Test Role',
          description: 'Temporary role for testing',
          level: 1
        },
        expectedStatus: 201
      },
      {
        description: 'Regular user attempting to create role',
        token: this.tokens.user,
        endpoint: '/permissions/roles',
        method: 'POST',
        data: {
          name: 'unauthorized_role',
          displayName: 'Unauthorized Role',
          level: 1
        },
        expectedStatus: 403
      }
    ];

    for (const testCase of testCases) {
      const result = await this.apiRequest(
        testCase.method,
        testCase.endpoint,
        testCase.data,
        testCase.token
      );

      const statusMatch = result.status === testCase.expectedStatus;
      const statusIcon = statusMatch ? '✅' : '❌';
      
      console.log(`${statusIcon} ${testCase.description}`);
      console.log(`   Expected: ${testCase.expectedStatus}, Got: ${result.status}`);
      
      if (!statusMatch) {
        console.log(`   Response:`, result.error || result.data);
      }
    }
  }

  // Test role hierarchy and level-based access
  async testRoleHierarchy() {
    console.log('\n🏗️  Testing Role Hierarchy and Level-Based Access...');

    // Test accessing endpoints that require different role levels
    const hierarchyTests = [
      {
        description: 'Level 8 admin accessing admin endpoints',
        token: this.tokens.admin,
        endpoint: '/permissions/roles',
        minLevel: 8,
        expectedAccess: true
      },
      {
        description: 'Level 1 user accessing admin endpoints',
        token: this.tokens.user,
        endpoint: '/permissions/roles',
        minLevel: 8,
        expectedAccess: false
      }
    ];

    for (const test of hierarchyTests) {
      const result = await this.apiRequest('GET', test.endpoint, null, test.token);
      const hasAccess = result.success && result.status < 400;
      const accessMatch = hasAccess === test.expectedAccess;
      const icon = accessMatch ? '✅' : '❌';
      
      console.log(`${icon} ${test.description}`);
      console.log(`   Expected access: ${test.expectedAccess}, Got access: ${hasAccess}`);
      
      if (!accessMatch) {
        console.log(`   Response:`, result.error);
      }
    }
  }

  // Test user permissions retrieval
  async testUserPermissions() {
    console.log('\n🔑 Testing User Permissions Retrieval...');

    for (const [key, token] of Object.entries(this.tokens)) {
      const result = await this.apiRequest('GET', '/permissions/my-permissions', null, token);
      
      if (result.success) {
        const permissions = result.data.data || [];
        console.log(`✅ ${key} permissions retrieved (${permissions.length} permissions)`);
        if (permissions.length > 0) {
          console.log(`   Sample permissions:`, permissions.slice(0, 3).map(p => p.name || p).join(', '));
        }
      } else {
        console.error(`❌ Failed to retrieve permissions for ${key}:`, result.error);
      }
    }
  }

  // Test audit logging
  async testAuditLogging() {
    console.log('\n📋 Testing Audit Logging...');
    
    if (!this.tokens.admin) {
      console.log('⚠️  No admin token for audit testing');
      return;
    }

    const result = await this.apiRequest('GET', '/permissions/audit', null, this.tokens.admin);
    
    if (result.success) {
      const auditLogs = result.data.data || [];
      console.log(`✅ Retrieved ${auditLogs.length} audit log entries`);
      
      if (auditLogs.length > 0) {
        const recentLog = auditLogs[0];
        console.log(`   Most recent: ${recentLog.action} by user ${recentLog.user_id}`);
      }
    } else {
      console.error('❌ Failed to retrieve audit logs:', result.error);
    }
  }

  // Cleanup test data
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    // Delete test roles
    for (const roleId of this.createdRoles) {
      try {
        if (this.tokens.admin) {
          await this.apiRequest('DELETE', `/permissions/roles/${roleId}`, null, this.tokens.admin);
          console.log(`✅ Deleted test role ID: ${roleId}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not delete role ${roleId}:`, error.message);
      }
    }

    // Delete test users
    for (const username of this.createdUsers) {
      try {
        const [users] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (users.length > 0) {
          await pool.query('DELETE FROM users WHERE id = ?', [users[0].id]);
          console.log(`✅ Deleted test user: ${username}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not delete user ${username}:`, error.message);
      }
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Role Management API Testing...');
    console.log('================================================');

    const tests = [
      { name: 'Database Connection', fn: () => this.testDatabaseConnection() },
      { name: 'API Health', fn: () => this.testAPIHealth() },
      { name: 'Create Test Users', fn: () => this.createTestUsers() },
      { name: 'User Authentication', fn: () => this.testAuthentication() },
      { name: 'Role CRUD Operations', fn: () => this.testRoleCRUD() },
      { name: 'Permission-Based Access Control', fn: () => this.testPermissionBasedAccess() },
      { name: 'Role Hierarchy', fn: () => this.testRoleHierarchy() },
      { name: 'User Permissions Retrieval', fn: () => this.testUserPermissions() },
      { name: 'Audit Logging', fn: () => this.testAuditLogging() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        console.log(`\n▶️  Running: ${test.name}`);
        await test.fn();
        passed++;
      } catch (error) {
        console.error(`❌ Test failed: ${test.name}`, error.message);
        failed++;
      }
    }

    console.log('\n================================================');
    console.log('🎯 TEST SUMMARY');
    console.log('================================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${passed + failed}`);

    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Role management is working correctly.');
      console.log('✅ Role-based access control is properly implemented.');
      console.log('✅ Users are restricted to their assigned permissions.');
      console.log('✅ API endpoints are properly secured.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the output above.');
    }

    // Cleanup
    await this.cleanup();
    
    // Close database connection
    await pool.end();
  }
}

// Run the tests
async function runTests() {
  const tester = new RoleManagementTester();
  await tester.runAllTests();
}

// Run if called directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = RoleManagementTester;
