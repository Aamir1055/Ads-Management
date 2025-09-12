#!/usr/bin/env node
/**
 * Fix Permission Errors Script
 * Addresses the "Insufficient permissions" errors in the frontend
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting permission errors fix...\n');

// Step 1: Check if backend server is running
console.log('📋 Step 1: Checking backend server status...');
const { execSync } = require('child_process');

try {
    const result = execSync('netstat -an | findstr "5000"', { encoding: 'utf8' });
    if (result.includes('5000')) {
        console.log('✅ Backend server is running on port 5000');
    } else {
        console.log('❌ Backend server is NOT running on port 5000');
        console.log('💡 You need to start the backend server first:');
        console.log('   cd backend && npm start');
        console.log('   or: node backend/server.js\n');
    }
} catch (error) {
    console.log('❌ Backend server is NOT running on port 5000');
    console.log('💡 Start the backend server: cd backend && npm start\n');
}

// Step 2: Fix API service conflicts
console.log('📋 Step 2: Checking for API service conflicts...');

const servicesApiPath = './frontend/src/services/api.js';
const utilsApiPath = './frontend/src/utils/api.js';

if (fs.existsSync(servicesApiPath) && fs.existsSync(utilsApiPath)) {
    console.log('⚠️  Found multiple API service files:');
    console.log('   - ./frontend/src/services/api.js');
    console.log('   - ./frontend/src/utils/api.js');
    console.log('💡 This can cause conflicts. Consider consolidating them.\n');
} else {
    console.log('✅ API service setup looks clean\n');
}

// Step 3: Create authentication check function
console.log('📋 Step 3: Creating authentication checker...');

const authCheckerContent = `// Authentication Status Checker
// Add this to your browser console to check auth status

function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    console.log('🔐 Authentication Status:');
    console.log('Token exists:', !!token);
    console.log('User data exists:', !!user);
    
    if (token) {
        try {
            // Decode JWT token (basic check - don't use in production)
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', payload);
            console.log('Token expired?', payload.exp < Date.now() / 1000);
        } catch (e) {
            console.log('Token format invalid:', e.message);
        }
    }
    
    if (user) {
        try {
            const userData = JSON.parse(user);
            console.log('User data:', userData);
        } catch (e) {
            console.log('User data format invalid:', e.message);
        }
    }
}

// Check auth status
checkAuthStatus();
`;

fs.writeFileSync('./auth-checker.js', authCheckerContent);
console.log('✅ Created auth-checker.js - run in browser console\n');

// Step 4: Provide debugging steps
console.log('📋 Step 4: Debugging recommendations...');

const debugSteps = `
# Permission Error Debugging Steps

## Immediate Actions:

### 1. Start the Backend Server
cd backend
npm install  # if not already done
npm start    # or: node server.js

### 2. Check Authentication in Browser
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Check localStorage for:
   - authToken (should contain JWT token)
   - user (should contain user data)
4. If missing, you need to log in again

### 3. Verify User Permissions
Run this in browser console after logging in:
\`\`\`javascript
// Check current user permissions
fetch('/api/permissions/user/' + JSON.parse(localStorage.getItem('user')).id, {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
    }
})
.then(r => r.json())
.then(data => console.log('User permissions:', data))
\`\`\`

### 4. Check API Endpoints
Verify these endpoints are working:
- GET /api/admin/users
- GET /api/admin/roles  
- GET /api/permissions/roles-list

## Common Solutions:

### A. Authentication Issues:
- Clear localStorage and log in again
- Check if JWT token has expired
- Verify backend authentication middleware

### B. Permission Issues:
- User needs admin role/permissions
- Check user_roles table in database
- Verify role_permissions associations

### C. API Configuration Issues:
- Ensure backend server is running on port 5000
- Check CORS configuration
- Verify API route definitions

## Files to Check:

Frontend:
- ./frontend/src/services/api.js
- ./frontend/src/utils/api.js
- ./frontend/src/services/usersService.js
- ./frontend/src/services/roleService.js

Backend:
- ./backend/routes/permissionsRoutes.js
- ./backend/controllers/permissionsController.js
- ./backend/middleware/auth.js
`;

fs.writeFileSync('./DEBUG_PERMISSIONS.md', debugSteps);
console.log('✅ Created DEBUG_PERMISSIONS.md with detailed steps\n');

// Step 5: Create quick fix script
console.log('📋 Step 5: Creating quick fix helpers...');

const quickFixContent = `#!/usr/bin/env node
/**
 * Quick fixes for common permission issues
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Quick Fix for Permission Errors\\n');

// Check if in correct directory
if (!require('fs').existsSync('./frontend') || !require('fs').existsSync('./backend')) {
    console.log('❌ Run this script from the project root directory');
    process.exit(1);
}

// Start backend server
console.log('🔄 Starting backend server...');
try {
    const serverProcess = execSync('cd backend && npm start', { 
        stdio: 'inherit',
        timeout: 5000 
    });
    console.log('✅ Backend server started');
} catch (error) {
    console.log('⚠️  Starting server in background...');
    console.log('💡 Manually run: cd backend && npm start');
}

console.log('\\n🔧 Next steps:');
console.log('1. Refresh your browser');
console.log('2. Clear localStorage if needed');
console.log('3. Log in with admin credentials');
console.log('4. Check browser console for any remaining errors');
`;

fs.writeFileSync('./quick-fix.js', quickFixContent);
console.log('✅ Created quick-fix.js\n');

console.log('🎉 Fix script completed!\n');
console.log('📖 Next steps:');
console.log('1. Read DEBUG_PERMISSIONS.md for detailed instructions');
console.log('2. Start backend server: cd backend && npm start');
console.log('3. Clear browser localStorage and log in again');
console.log('4. Run auth-checker.js in browser console to verify');

console.log('\n🔍 If issues persist, check:');
console.log('- Database connection in backend');
console.log('- User permissions in database');
console.log('- JWT token validity');
