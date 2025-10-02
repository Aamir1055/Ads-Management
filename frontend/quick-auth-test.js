// Quick Authentication Test - Copy and paste into browser console
// This will help debug the current token situation

console.log('🔍 Starting Authentication Debug Test...');

// Check current tokens
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');
const authToken = localStorage.getItem('authToken');
const userData = localStorage.getItem('user');

console.log('📋 Current Token Status:');
console.log('  Access Token:', accessToken ? `Present (${accessToken.length} chars)` : 'MISSING');
console.log('  Refresh Token:', refreshToken ? `Present (${refreshToken.length} chars)` : 'MISSING');
console.log('  Legacy Auth Token:', authToken ? `Present (${authToken.length} chars)` : 'Not present');
console.log('  User Data:', userData ? `Present (${JSON.parse(userData).username})` : 'MISSING');

// Test function to login and get fresh tokens
async function quickLogin() {
    try {
        console.log('🔑 Attempting fresh login...');
        
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'password' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const { access_token, refresh_token, user } = data.data;
            
            // Store tokens
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            localStorage.setItem('user', JSON.stringify(user));
            
            console.log('✅ Login successful!');
            console.log('  New Access Token:', access_token.substring(0, 30) + '...');
            console.log('  New Refresh Token:', refresh_token.substring(0, 30) + '...');
            console.log('  User:', user.username);
            
            // Test API call immediately
            console.log('🧪 Testing API call with new token...');
            
            const testResponse = await fetch('http://localhost:5000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });
            
            const testData = await testResponse.json();
            
            if (testResponse.ok && testData.success) {
                console.log('✅ API test successful!');
                console.log('  API returned user:', testData.data.user.username);
            } else {
                console.log('❌ API test failed:', testData.message);
            }
            
            // Reload the page to apply the new tokens
            console.log('🔄 Reloading page to apply new authentication...');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } else {
            console.log('❌ Login failed:', data.message);
        }
        
    } catch (error) {
        console.log('❌ Login error:', error.message);
    }
}

// Test function to clear all tokens
function clearTokens() {
    const keys = ['access_token', 'refresh_token', 'authToken', 'auth_token', 'user'];
    keys.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    console.log('🧹 All tokens cleared. Redirecting to login...');
    window.location.href = '/login';
}

// If no tokens are present, suggest login
if (!accessToken && !refreshToken) {
    console.log('');
    console.log('❌ NO TOKENS FOUND!');
    console.log('🔧 Run: quickLogin() - to get fresh tokens and test');
    console.log('🧹 Or run: clearTokens() - to clear everything and go to login');
} else if (accessToken && refreshToken) {
    console.log('');
    console.log('✅ Tokens are present. The issue might be:');
    console.log('  1. Tokens are expired');
    console.log('  2. Request interceptor not working');
    console.log('  3. Backend server issue');
    console.log('');
    console.log('🔧 Run: quickLogin() - to refresh tokens and test');
} else {
    console.log('');
    console.log('⚠️ Partial tokens found. This might cause issues.');
    console.log('🔧 Run: quickLogin() - to get complete token set');
}

// Make functions available globally
window.quickLogin = quickLogin;
window.clearTokens = clearTokens;

console.log('');
console.log('🎯 Available commands:');
console.log('  quickLogin() - Login and test with fresh tokens');
console.log('  clearTokens() - Clear all tokens and redirect to login');
console.log('');
