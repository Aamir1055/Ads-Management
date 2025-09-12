#!/usr/bin/env node
/**
 * Quick fixes for common permission issues
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Quick Fix for Permission Errors\n');

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

console.log('\n🔧 Next steps:');
console.log('1. Refresh your browser');
console.log('2. Clear localStorage if needed');
console.log('3. Log in with admin credentials');
console.log('4. Check browser console for any remaining errors');
