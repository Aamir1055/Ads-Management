// Debug helper script - load in browser console
// You can copy and paste these functions into the browser console for debugging

// Function to inspect current token state
window.debugTokens = function() {
  console.log('🔍 Current Token State:');
  console.log('  access_token:', localStorage.getItem('access_token')?.substring(0, 20) + '...');
  console.log('  authToken:', localStorage.getItem('authToken')?.substring(0, 20) + '...');
  console.log('  user:', JSON.parse(localStorage.getItem('user') || '{}'));
  console.log('  sessionStorage auth error:', sessionStorage.getItem('recent_auth_error'));
  console.log('  loginMessage:', sessionStorage.getItem('loginMessage'));
  return {
    access_token: localStorage.getItem('access_token'),
    authToken: localStorage.getItem('authToken'),
    user: localStorage.getItem('user'),
    sessionStorage: {
      recent_auth_error: sessionStorage.getItem('recent_auth_error'),
      loginMessage: sessionStorage.getItem('loginMessage')
    }
  };
};

// Quick token cleanup function (already available via tokenCleanup.js)
window.quickCleanup = function() {
  const keys = ['access_token', 'authToken', 'auth_token', 'refresh_token', 'user'];
  keys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  sessionStorage.clear();
  console.log('✅ All tokens cleared');
  return 'Tokens cleared - reload page to login fresh';
};

// Function to test API connection without token
window.testAPI = function() {
  console.log('🔌 Testing API connection...');
  fetch('http://localhost:5000/api/brands')
    .then(response => {
      console.log('API Response Status:', response.status);
      if (response.status === 401) {
        console.log('✅ API is working (401 expected without token)');
      } else if (response.status === 200) {
        console.log('⚠️  API allowed request without token (unexpected)');
      }
      return response.text();
    })
    .then(text => console.log('Response:', text))
    .catch(error => console.log('❌ API Error:', error));
};

// Function to simulate demo login
window.demoLogin = function() {
  console.log('🎭 Setting up demo login...');
  const token = 'demo-token-' + Date.now();
  const user = {
    id: 1,
    username: 'admin',
    role_id: 1,
    role_name: 'super_admin',
    role: { name: 'super_admin' },
    permissions: ['*']
  };
  
  localStorage.setItem('access_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  console.log('✅ Demo login setup complete');
  console.log('🔄 Refreshing page...');
  window.location.reload();
};

console.log('🛠️  Debug functions loaded:');
console.log('  - debugTokens() - inspect current tokens');
console.log('  - quickCleanup() - clear all tokens');
console.log('  - testAPI() - test backend connection'); 
console.log('  - demoLogin() - setup demo login');
console.log('  - clearAllTokens() - from tokenCleanup.js (redirects to login)');
