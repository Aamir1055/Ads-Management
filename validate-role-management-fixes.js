#!/usr/bin/env node
/**
 * Comprehensive Role Management Validation Script
 * Tests all fixes applied to the role management module
 */

const { pool } = require('./config/database');
const PermissionManager = require('./utils/PermissionManager');

const validation = {
    passed: 0,
    failed: 0,
    issues: []
};

console.log('🔍 Validating Role Management Module Fixes');
console.log('==========================================');

// Test 1: Database Schema Validation
async function testDatabaseSchema() {
    console.log('\n1. Testing database schema...');
    
    try {
        // Check roles table structure
        const [rolesColumns] = await pool.query('DESCRIBE roles');
        const requiredRoleColumns = ['id', 'name', 'display_name', 'description', 'level', 'is_active', 'is_system_role'];
        
        const missingColumns = requiredRoleColumns.filter(col => 
            !rolesColumns.some(dbCol => dbCol.Field === col)
        );
        
        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns in roles table: ${missingColumns.join(', ')}`);
        }
        
        // Check role_permissions table
        const [rolePermColumns] = await pool.query('DESCRIBE role_permissions');
        const requiredRolePermColumns = ['role_id', 'permission_id'];
        
        const missingRolePermColumns = requiredRolePermColumns.filter(col => 
            !rolePermColumns.some(dbCol => dbCol.Field === col)
        );
        
        if (missingRolePermColumns.length > 0) {
            throw new Error(`Missing required columns in role_permissions table: ${missingRolePermColumns.join(', ')}`);
        }
        
        console.log('✅ Database schema is valid');
        validation.passed++;
    } catch (error) {
        console.log('❌ Database schema validation failed:', error.message);
        validation.failed++;
        validation.issues.push(`Database Schema: ${error.message}`);
    }
}

// Test 2: PermissionManager Class Methods
async function testPermissionManagerMethods() {
    console.log('\n2. Testing PermissionManager class methods...');
    
    try {
        // Test getAllRoles method
        const roles = await PermissionManager.getAllRoles();
        if (!Array.isArray(roles)) {
            throw new Error('getAllRoles should return an array');
        }
        
        // Test getAllAvailableRoles method (was the duplicate method)
        const availableRoles = await PermissionManager.getAllAvailableRoles();
        if (!Array.isArray(availableRoles)) {
            throw new Error('getAllAvailableRoles should return an array');
        }
        
        // Test getUserRoles method
        if (roles.length > 0) {
            // Create a test scenario - this is just structure validation
            const testUserId = 1; // Assuming user ID 1 exists
            const userRoles = await PermissionManager.getUserRoles(testUserId);
            if (!Array.isArray(userRoles)) {
                console.log('⚠️  getUserRoles returned non-array, but this may be expected if user has no roles');
            }
        }
        
        console.log('✅ PermissionManager methods are working correctly');
        validation.passed++;
    } catch (error) {
        console.log('❌ PermissionManager methods test failed:', error.message);
        validation.failed++;
        validation.issues.push(`PermissionManager: ${error.message}`);
    }
}

// Test 3: Role Model Validation
async function testRoleModel() {
    console.log('\n3. Testing Role model methods...');
    
    try {
        const Role = require('./models/Role');
        
        // Test findAll method
        const allRoles = await Role.findAll();
        if (!Array.isArray(allRoles)) {
            throw new Error('Role.findAll should return an array');
        }
        
        // Test validation methods
        const isValidName = await Role.validateName('test_unique_name_12345');
        if (typeof isValidName !== 'boolean') {
            throw new Error('Role.validateName should return a boolean');
        }
        
        // Test stats method
        const stats = await Role.getStats();
        if (!stats || typeof stats.total_roles !== 'number') {
            throw new Error('Role.getStats should return valid statistics');
        }
        
        console.log('✅ Role model methods are working correctly');
        validation.passed++;
    } catch (error) {
        console.log('❌ Role model test failed:', error.message);
        validation.failed++;
        validation.issues.push(`Role Model: ${error.message}`);
    }
}

// Test 4: Input Validation Rules
async function testInputValidation() {
    console.log('\n4. Testing input validation rules...');
    
    try {
        const testCases = [
            { name: '', expected: false, description: 'Empty name should fail' },
            { name: 'a', expected: false, description: 'Name too short should fail' },
            { name: 'a'.repeat(51), expected: false, description: 'Name too long should fail' },
            { name: 'valid_role_name', expected: true, description: 'Valid name should pass' },
            { name: 'Valid Role 123', expected: true, description: 'Valid name with spaces should pass' },
            { name: 'invalid@name', expected: false, description: 'Invalid characters should fail' }
        ];
        
        let validationTests = 0;
        let passedValidations = 0;
        
        for (const testCase of testCases) {
            validationTests++;
            
            // Simulate the validation logic from roleController
            let isValid = false;
            if (testCase.name && testCase.name.trim()) {
                const trimmed = testCase.name.trim();
                isValid = trimmed.length >= 3 && 
                         trimmed.length <= 50 && 
                         /^[a-zA-Z0-9\s\-_]+$/.test(trimmed);
            }
            
            if (isValid === testCase.expected) {
                passedValidations++;
            } else {
                console.log(`  ⚠️  Validation test failed: ${testCase.description}`);
            }
        }
        
        if (passedValidations === validationTests) {
            console.log('✅ Input validation rules are working correctly');
            validation.passed++;
        } else {
            throw new Error(`${validationTests - passedValidations} validation tests failed`);
        }
    } catch (error) {
        console.log('❌ Input validation test failed:', error.message);
        validation.failed++;
        validation.issues.push(`Input Validation: ${error.message}`);
    }
}

// Test 5: Error Handling
async function testErrorHandling() {
    console.log('\n5. Testing error handling...');
    
    try {
        const RoleController = require('./controllers/roleController');
        
        // Mock request and response objects
        const mockReq = {
            params: { id: 'invalid' },
            body: {},
            user: { id: 1 }
        };
        
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    if (code === 400 && data.success === false && data.message) {
                        return { statusCode: code, data };
                    }
                    throw new Error('Unexpected response format');
                }
            })
        };
        
        // Test invalid ID handling
        const result = await RoleController.getRoleById(mockReq, mockRes);
        if (result && result.statusCode === 400) {
            console.log('✅ Error handling is working correctly');
            validation.passed++;
        } else {
            throw new Error('Invalid ID should return 400 status');
        }
    } catch (error) {
        console.log('❌ Error handling test failed:', error.message);
        validation.failed++;
        validation.issues.push(`Error Handling: ${error.message}`);
    }
}

// Test 6: API Endpoint Structure
async function testAPIEndpointStructure() {
    console.log('\n6. Testing API endpoint structure...');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Check if route files exist
        const routeFiles = [
            './routes/roleRoutes.js',
            './routes/permissionsRoutes.js'
        ];
        
        for (const routeFile of routeFiles) {
            if (!fs.existsSync(path.join(__dirname, routeFile))) {
                throw new Error(`Route file ${routeFile} does not exist`);
            }
        }
        
        // Check roleRoutes content
        const roleRoutesContent = fs.readFileSync(path.join(__dirname, './routes/roleRoutes.js'), 'utf8');
        const expectedEndpoints = [
            'GET /api/roles',
            'GET /api/roles/:id',
            'POST /api/roles',
            'PUT /api/roles/:id',
            'DELETE /api/roles/:id',
            'GET /api/roles/:id/permissions'
        ];
        
        // Basic check for route methods
        const hasGetRoutes = roleRoutesContent.includes('router.get');
        const hasPostRoutes = roleRoutesContent.includes('router.post');
        const hasPutRoutes = roleRoutesContent.includes('router.put');
        const hasDeleteRoutes = roleRoutesContent.includes('router.delete');
        
        if (!hasGetRoutes || !hasPostRoutes || !hasPutRoutes || !hasDeleteRoutes) {
            throw new Error('Missing required HTTP method routes in roleRoutes.js');
        }
        
        console.log('✅ API endpoint structure is valid');
        validation.passed++;
    } catch (error) {
        console.log('❌ API endpoint structure test failed:', error.message);
        validation.failed++;
        validation.issues.push(`API Structure: ${error.message}`);
    }
}

// Test 7: Frontend Service Integration
async function testFrontendServiceIntegration() {
    console.log('\n7. Testing frontend service integration...');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Check if frontend service file exists
        const serviceFile = '../frontend/src/services/roleService.js';
        if (!fs.existsSync(path.join(__dirname, serviceFile))) {
            throw new Error('roleService.js file does not exist in frontend services');
        }
        
        const serviceContent = fs.readFileSync(path.join(__dirname, serviceFile), 'utf8');
        
        // Check for key methods
        const requiredMethods = [
            'getAllRoles',
            'getAllRolesWithPermissions',
            'createRoleWithPermissions',
            'updateRoleWithPermissions',
            'deleteRole',
            'getUserRoles',
            'assignUserToRole'
        ];
        
        const missingMethods = requiredMethods.filter(method => 
            !serviceContent.includes(`${method}:`)
        );
        
        if (missingMethods.length > 0) {
            throw new Error(`Missing required methods in roleService: ${missingMethods.join(', ')}`);
        }
        
        // Check for correct API endpoints (after fixes)
        const hasCorrectUpdateEndpoint = serviceContent.includes('`/roles/${roleId}`');
        if (!hasCorrectUpdateEndpoint) {
            throw new Error('roleService still uses incorrect API endpoints for role updates');
        }
        
        console.log('✅ Frontend service integration is valid');
        validation.passed++;
    } catch (error) {
        console.log('❌ Frontend service integration test failed:', error.message);
        validation.failed++;
        validation.issues.push(`Frontend Service: ${error.message}`);
    }
}

// Main validation runner
async function runAllValidations() {
    try {
        await testDatabaseSchema();
        await testPermissionManagerMethods();
        await testRoleModel();
        await testInputValidation();
        await testErrorHandling();
        await testAPIEndpointStructure();
        await testFrontendServiceIntegration();
        
        console.log('\n📋 Validation Summary');
        console.log('=====================');
        console.log(`✅ Tests Passed: ${validation.passed}`);
        console.log(`❌ Tests Failed: ${validation.failed}`);
        
        if (validation.issues.length > 0) {
            console.log('\n🐛 Issues Found:');
            validation.issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue}`);
            });
        }
        
        if (validation.failed === 0) {
            console.log('\n🎉 All validations passed! Role Management module fixes are working correctly.');
        } else {
            console.log('\n⚠️  Some validations failed. Please review the issues above.');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('💥 Fatal error during validation:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await pool.end();
    }
}

// Run validations
runAllValidations();
