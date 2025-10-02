#!/usr/bin/env node
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = null;
let testUserId = null;

const testResults = {
    passed: 0,
    failed: 0,
    issues: []
};

// Test user credentials - adjust as needed
const testCredentials = {
    username: 'testadmin',
    password: 'testpass123'
};

async function makeRequest(method, endpoint, data = null, headers = {}) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status,
            details: error.response?.data?.details
        };
    }
}

async function authenticate() {
    console.log('🔐 Authenticating...');
    const result = await makeRequest('POST', '/auth/login', testCredentials);
    
    if (result.success && result.data.data?.token) {
        authToken = result.data.data.token;
        testUserId = result.data.data.user?.id;
        console.log('✅ Authentication successful');
        return true;
    } else {
        console.error('❌ Authentication failed:', result.error);
        testResults.issues.push('Authentication failed - cannot test protected endpoints');
        return false;
    }
}

async function runTest(testName, testFunc) {
    console.log(`\n🧪 Testing: ${testName}`);
    try {
        await testFunc();
        console.log(`✅ ${testName} - PASSED`);
        testResults.passed++;
    } catch (error) {
        console.error(`❌ ${testName} - FAILED:`, error.message);
        testResults.failed++;
        testResults.issues.push(`${testName}: ${error.message}`);
    }
}

// Test Functions
async function testGetAllRoles() {
    const result = await makeRequest('GET', '/roles');
    if (!result.success) {
        throw new Error(`Failed to get roles: ${result.error?.message || result.error}`);
    }
    if (!result.data.success || !Array.isArray(result.data.data)) {
        throw new Error('Invalid response format - expected success: true and data as array');
    }
    console.log(`   Found ${result.data.data.length} roles`);
}

async function testGetAllRolesWithIncludePermissions() {
    const result = await makeRequest('GET', '/roles?include_permissions=true');
    if (!result.success) {
        throw new Error(`Failed to get roles with permissions: ${result.error?.message || result.error}`);
    }
    if (!result.data.success || !Array.isArray(result.data.data)) {
        throw new Error('Invalid response format - expected success: true and data as array');
    }
    
    // Check if permissions are included
    const rolesWithPermissions = result.data.data.filter(role => role.permissions && Array.isArray(role.permissions));
    console.log(`   Found ${rolesWithPermissions.length} roles with permissions data`);
}

async function testCreateRole() {
    const roleData = {
        name: `test_role_${Date.now()}`,
        display_name: `Test Role ${Date.now()}`,
        description: 'Automated test role',
        level: 2
    };

    const result = await makeRequest('POST', '/roles', roleData);
    if (!result.success) {
        throw new Error(`Failed to create role: ${result.error?.message || result.error}`);
    }
    if (!result.data.success || !result.data.data?.id) {
        throw new Error('Invalid response format - expected success: true and data.id');
    }
    
    // Store for cleanup
    global.testRoleId = result.data.data.id;
    console.log(`   Created role with ID: ${result.data.data.id}`);
}

async function testGetRoleById() {
    if (!global.testRoleId) {
        throw new Error('No test role ID available - create role test must run first');
    }

    const result = await makeRequest('GET', `/roles/${global.testRoleId}`);
    if (!result.success) {
        throw new Error(`Failed to get role by ID: ${result.error?.message || result.error}`);
    }
    if (!result.data.success || !result.data.data) {
        throw new Error('Invalid response format - expected success: true and data object');
    }
    console.log(`   Retrieved role: ${result.data.data.name}`);
}

async function testUpdateRole() {
    if (!global.testRoleId) {
        throw new Error('No test role ID available - create role test must run first');
    }

    const updateData = {
        description: 'Updated test role description',
        level: 3
    };

    const result = await makeRequest('PUT', `/roles/${global.testRoleId}`, updateData);
    if (!result.success) {
        throw new Error(`Failed to update role: ${result.error?.message || result.error}`);
    }
    if (!result.data.success || !result.data.data) {
        throw new Error('Invalid response format - expected success: true and data object');
    }
    console.log(`   Updated role level to: ${result.data.data.level}`);
}

async function testGetRolePermissions() {
    // First get all roles to find one with permissions
    const rolesResult = await makeRequest('GET', '/roles');
    if (!rolesResult.success || !rolesResult.data.data?.length) {
        throw new Error('No roles available to test permissions');
    }

    const roleId = rolesResult.data.data[0].id;
    const result = await makeRequest('GET', `/roles/${roleId}/permissions`);
    
    if (!result.success) {
        throw new Error(`Failed to get role permissions: ${result.error?.message || result.error}`);
    }
    if (!result.data.success) {
        throw new Error('Invalid response format - expected success: true');
    }
    console.log(`   Retrieved permissions for role ID ${roleId}`);
}

async function testDeleteRole() {
    if (!global.testRoleId) {
        throw new Error('No test role ID available - create role test must run first');
    }

    const result = await makeRequest('DELETE', `/roles/${global.testRoleId}`);
    if (!result.success) {
        throw new Error(`Failed to delete role: ${result.error?.message || result.error}`);
    }
    if (!result.data.success) {
        throw new Error('Invalid response format - expected success: true');
    }
    console.log(`   Deleted role ID: ${global.testRoleId}`);
    delete global.testRoleId;
}

async function testInvalidRoleId() {
    const result = await makeRequest('GET', '/roles/invalid_id');
    if (result.status !== 400) {
        throw new Error(`Expected 400 status for invalid ID, got ${result.status}`);
    }
    console.log('   Correctly handled invalid role ID');
}

async function testCreateRoleValidation() {
    // Test missing name
    let result = await makeRequest('POST', '/roles', { display_name: 'Test' });
    if (result.status !== 400) {
        throw new Error(`Expected 400 status for missing name, got ${result.status}`);
    }

    // Test missing display_name
    result = await makeRequest('POST', '/roles', { name: 'test' });
    if (result.status !== 400) {
        throw new Error(`Expected 400 status for missing display_name, got ${result.status}`);
    }

    console.log('   Validation working correctly');
}

async function testRoleNameUniqueness() {
    // First create a role
    const roleData = {
        name: `unique_test_${Date.now()}`,
        display_name: 'Unique Test Role',
        description: 'Test role for uniqueness'
    };

    let result = await makeRequest('POST', '/roles', roleData);
    if (!result.success) {
        throw new Error(`Failed to create first role: ${result.error?.message || result.error}`);
    }

    const firstRoleId = result.data.data.id;

    // Try to create another role with same name
    result = await makeRequest('POST', '/roles', roleData);
    if (result.status !== 400) {
        throw new Error(`Expected 400 status for duplicate name, got ${result.status}`);
    }

    // Cleanup
    await makeRequest('DELETE', `/roles/${firstRoleId}`);
    console.log('   Name uniqueness validation working correctly');
}

// Permissions API Tests (called from frontend)
async function testPermissionsEndpoints() {
    console.log('\n🔐 Testing Permissions API endpoints (used by frontend)...');
    
    // Test roles list
    let result = await makeRequest('GET', '/permissions/roles-list');
    if (!result.success) {
        testResults.issues.push(`/permissions/roles-list failed: ${result.error?.message}`);
        console.log('❌ /permissions/roles-list failed');
    } else {
        console.log('✅ /permissions/roles-list working');
    }

    // Test modules with permissions
    result = await makeRequest('GET', '/permissions/modules-with-permissions');
    if (!result.success) {
        testResults.issues.push(`/permissions/modules-with-permissions failed: ${result.error?.message}`);
        console.log('❌ /permissions/modules-with-permissions failed');
    } else {
        console.log('✅ /permissions/modules-with-permissions working');
    }

    // Test permissions list
    result = await makeRequest('GET', '/permissions');
    if (!result.success) {
        testResults.issues.push(`/permissions failed: ${result.error?.message}`);
        console.log('❌ /permissions failed');
    } else {
        console.log('✅ /permissions working');
    }

    // Test modules
    result = await makeRequest('GET', '/permissions/modules');
    if (!result.success) {
        testResults.issues.push(`/permissions/modules failed: ${result.error?.message}`);
        console.log('❌ /permissions/modules failed');
    } else {
        console.log('✅ /permissions/modules working');
    }
}

async function main() {
    console.log('🚀 Starting Role Management API Debug Tests');
    console.log('===============================================');

    // Test basic connectivity first
    console.log('🔍 Testing basic connectivity...');
    const healthResult = await makeRequest('GET', '/health');
    if (!healthResult.success) {
        console.error('❌ Cannot connect to server. Ensure the backend is running.');
        process.exit(1);
    }
    console.log('✅ Server connectivity OK');

    // Try to authenticate
    const isAuthenticated = await authenticate();
    if (!isAuthenticated) {
        console.log('\n📋 Test Summary (Limited - No Authentication)');
        console.log('===============================================');
        console.log('❌ Cannot run full tests without authentication');
        console.log('Please ensure test credentials are correct and user exists');
        process.exit(1);
    }

    // Test Permissions API endpoints first (these are what the frontend uses)
    await testPermissionsEndpoints();

    // Run main role API tests
    await runTest('Get All Roles', testGetAllRoles);
    await runTest('Get All Roles with Permissions', testGetAllRolesWithIncludePermissions);
    await runTest('Create Role', testCreateRole);
    await runTest('Get Role by ID', testGetRoleById);
    await runTest('Update Role', testUpdateRole);
    await runTest('Get Role Permissions', testGetRolePermissions);
    await runTest('Delete Role', testDeleteRole);
    
    // Error handling tests
    await runTest('Invalid Role ID Handling', testInvalidRoleId);
    await runTest('Create Role Validation', testCreateRoleValidation);
    await runTest('Role Name Uniqueness', testRoleNameUniqueness);

    // Summary
    console.log('\n📋 Test Summary');
    console.log('===============================================');
    console.log(`✅ Tests Passed: ${testResults.passed}`);
    console.log(`❌ Tests Failed: ${testResults.failed}`);
    
    if (testResults.issues.length > 0) {
        console.log('\n🐛 Issues Found:');
        testResults.issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
    }

    if (testResults.failed === 0) {
        console.log('\n🎉 All tests passed! Role Management API is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the issues above.');
        process.exit(1);
    }
}

// Run tests
main().catch(error => {
    console.error('💥 Fatal error running tests:', error);
    process.exit(1);
});
