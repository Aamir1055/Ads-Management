#!/usr/bin/env node
/**
 * Test API endpoints to debug permission issues
 */

// Use built-in fetch (Node.js 18+ has fetch built-in)
const API_BASE_URL = 'http://localhost:5000/api';

async function testEndpoints() {
    console.log('🧪 Testing API endpoints for permission errors...\n');
    
    // Test endpoints that are failing
    const endpoints = [
        { name: 'Admin Users', url: '/admin/users' },
        { name: 'Admin Roles', url: '/admin/roles' },
        { name: 'Permissions Roles List', url: '/permissions/roles-list' },
        { name: 'Settings CRM', url: '/settings/crm' },
        { name: 'Users', url: '/users' },
        { name: 'Users Roles', url: '/users/roles' }
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Testing: ${endpoint.name} (${endpoint.url})`);
            
            const response = await fetch(API_BASE_URL + endpoint.url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Add timeout using AbortController
                signal: AbortSignal.timeout(5000)
            });
            
            let errorMessage = null;
            try {
                const responseText = await response.text();
                const responseData = responseText ? JSON.parse(responseText) : {};
                errorMessage = responseData.message || response.statusText;
            } catch (e) {
                errorMessage = response.statusText;
            }
            
            const result = {
                name: endpoint.name,
                url: endpoint.url,
                status: response.status,
                success: response.status < 400,
                error: response.status >= 400 ? errorMessage : null,
                requiresAuth: response.status === 401,
                insufficientPermissions: response.status === 403
            };
            
            results.push(result);
            
            if (response.status === 200) {
                console.log(`  ✅ Success (${response.status})`);
            } else if (response.status === 401) {
                console.log(`  🔐 Requires Authentication (${response.status})`);
            } else if (response.status === 403) {
                console.log(`  🚫 Insufficient Permissions (${response.status})`);
            } else {
                console.log(`  ❌ Error ${response.status}: ${errorMessage}`);
            }
            
        } catch (error) {
            const result = {
                name: endpoint.name,
                url: endpoint.url,
                status: 'NETWORK_ERROR',
                success: false,
                error: error.message,
                requiresAuth: false,
                insufficientPermissions: false
            };
            
            results.push(result);
            console.log(`  ❌ Network Error: ${error.message}`);
        }
        
        console.log(''); // Add space between tests
    }
    
    // Summary
    console.log('📊 Test Results Summary:');
    console.log('========================\n');
    
    const successCount = results.filter(r => r.success).length;
    const authRequiredCount = results.filter(r => r.requiresAuth).length;
    const permissionDeniedCount = results.filter(r => r.insufficientPermissions).length;
    
    console.log(`✅ Successful: ${successCount}`);
    console.log(`🔐 Authentication Required: ${authRequiredCount}`);
    console.log(`🚫 Permission Denied: ${permissionDeniedCount}`);
    console.log(`❌ Other Errors: ${results.length - successCount - authRequiredCount - permissionDeniedCount}\n`);
    
    // Recommendations
    console.log('💡 Recommendations:');
    console.log('===================\n');
    
    if (authRequiredCount > 0) {
        console.log('🔐 Authentication Issues:');
        console.log('- Log in to the application');
        console.log('- Check localStorage for authToken');
        console.log('- Verify JWT token is valid and not expired\n');
    }
    
    if (permissionDeniedCount > 0) {
        console.log('🚫 Permission Issues:');
        console.log('- Current user lacks admin permissions');
        console.log('- Check user role assignments in database');
        console.log('- Verify role has required permissions\n');
    }
    
    // Show detailed results for errors
    const errorResults = results.filter(r => !r.success);
    if (errorResults.length > 0) {
        console.log('🔍 Detailed Error Analysis:');
        console.log('===========================\n');
        
        errorResults.forEach(result => {
            console.log(`${result.name}: ${result.status}`);
            if (result.error) console.log(`  Error: ${result.error}`);
            console.log('');
        });
    }
    
    console.log('🚀 Next Steps:');
    console.log('==============');
    console.log('1. If authentication errors: Clear localStorage and log in again');
    console.log('2. If permission errors: Check user roles and permissions');
    console.log('3. If network errors: Verify backend server is running');
    console.log('4. Test endpoints with authentication token from browser');
}

// Test with authentication token if provided as argument
async function testWithAuth() {
    console.log('\n🔐 Testing with authentication...');
    console.log('To test with auth token, run in browser console:\n');
    
    const browserScript = `
// Copy this to browser console (F12) to test with authentication
async function testApiWithAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('❌ No auth token found. Please log in first.');
        return;
    }
    
    const endpoints = [
        '/admin/users',
        '/admin/roles', 
        '/permissions/roles-list',
        '/users/roles'
    ];
    
    console.log('🧪 Testing with authentication token...');
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch('/api' + endpoint, {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });
            
            const status = response.status;
            const data = await response.text();
            
            console.log(\`\${endpoint}: \${status} - \${status < 400 ? '✅ Success' : '❌ Error'}\`);
            if (status >= 400) {
                console.log('  Error:', data);
            }
        } catch (error) {
            console.log(\`\${endpoint}: ❌ Network error -\`, error.message);
        }
    }
}

testApiWithAuth();
    `;
    
    console.log(browserScript);
}

if (require.main === module) {
    testEndpoints().then(() => {
        testWithAuth();
    }).catch(console.error);
}
