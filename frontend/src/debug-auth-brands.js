// Authentication debugging tool for brands page issue
console.log('🔍 DEBUGGING AUTHENTICATION ISSUE ON BRANDS PAGE');

// Check current URL and page
console.log('🌐 Current page:', window.location.pathname);

// Check all stored authentication data
const authData = {
  access_token: localStorage.getItem('access_token'),
  authToken: localStorage.getItem('authToken'),
  auth_token: localStorage.getItem('auth_token'),
  refresh_token: localStorage.getItem('refresh_token'),
  user: localStorage.getItem('user')
};

console.log('💾 Stored authentication data:', {
  access_token: authData.access_token ? 'EXISTS' : 'MISSING',
  authToken: authData.authToken ? 'EXISTS' : 'MISSING',
  auth_token: authData.auth_token ? 'EXISTS' : 'MISSING',
  refresh_token: authData.refresh_token ? 'EXISTS' : 'MISSING',
  user: authData.user ? 'EXISTS' : 'MISSING'
});

// Parse and check user data
if (authData.user) {
  try {
    const parsedUser = JSON.parse(authData.user);
    console.log('👤 Parsed user data:', {
      id: parsedUser.id,
      username: parsedUser.username,
      role_id: parsedUser.role_id,
      role_name: parsedUser.role_name,
      is_active: parsedUser.is_active
    });
  } catch (error) {
    console.error('❌ Error parsing user data:', error);
  }
}

// Test API connectivity
const testAPI = async () => {
  console.log('🧪 Testing API connectivity...');
  
  try {
    // Test health endpoint first (should not require auth)
    const healthResponse = await fetch('http://localhost:5000/api/health');
    console.log('💓 Health check:', healthResponse.status, healthResponse.ok);
    
    // Test brands endpoint with current auth
    const token = authData.access_token || authData.authToken;
    if (token) {
      console.log('🔑 Testing brands endpoint with token...');
      
      const brandsResponse = await fetch('http://localhost:5000/api/brands', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🏷️ Brands API response:', {
        status: brandsResponse.status,
        ok: brandsResponse.ok,
        statusText: brandsResponse.statusText
      });
      
      if (!brandsResponse.ok) {
        const errorText = await brandsResponse.text();
        console.log('❌ Brands API error details:', errorText);
      }
    } else {
      console.log('❌ No token available for brands API test');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
};

// Run API test
testAPI();

// Monitor for redirections
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

window.history.pushState = function(...args) {
  console.log('🧭 History pushState called:', args[2]);
  return originalPushState.apply(this, args);
};

window.history.replaceState = function(...args) {
  console.log('🧭 History replaceState called:', args[2]);
  return originalReplaceState.apply(this, args);
};

// Monitor location changes
let currentPath = window.location.pathname;
setInterval(() => {
  if (window.location.pathname !== currentPath) {
    console.log('🧭 Location changed:', currentPath, '->', window.location.pathname);
    currentPath = window.location.pathname;
  }
}, 100);

console.log('✅ Authentication debugging setup complete. Check console for results.');

// Export debugging functions to window for manual testing
window.debugAuth = {
  checkAuth: () => authData,
  testAPI,
  clearAuth: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    console.log('🧹 All auth data cleared');
  },
  restoreAuth: (token, userData) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('🔄 Auth data restored');
  }
};
