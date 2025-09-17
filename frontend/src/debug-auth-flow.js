// Auth Flow Debug Script - Run this in browser console when on brands page
console.log('🔍 AUTH FLOW DEBUGGER STARTED');
console.log('================================');

// 1. Check localStorage state
console.log('📦 LocalStorage Analysis:');
const tokens = {
  access_token: localStorage.getItem('access_token'),
  authToken: localStorage.getItem('authToken'), 
  auth_token: localStorage.getItem('auth_token'),
  user: localStorage.getItem('user')
};

Object.entries(tokens).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}:`, value.substring(0, 50) + '...');
  } else {
    console.log(`❌ ${key}: Missing`);
  }
});

// 2. Parse and validate user data
if (tokens.user) {
  try {
    const userData = JSON.parse(tokens.user);
    console.log('👤 User Data:', {
      id: userData.id,
      username: userData.username,
      role_id: userData.role_id,
      role_name: userData.role_name
    });
  } catch (e) {
    console.error('❌ User data parse error:', e.message);
  }
}

// 3. Test API connectivity
console.log('🌐 API Connectivity Test:');
const testUrls = [
  'http://localhost:3000/api/brands',
  'http://localhost:5000/api/brands'
];

testUrls.forEach(url => {
  const token = tokens.access_token || tokens.authToken;
  
  fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  .then(response => {
    console.log(`📡 ${url}: ${response.status} ${response.statusText}`);
    return response.json();
  })
  .then(data => console.log(`📝 Response data:`, data))
  .catch(error => console.log(`❌ ${url}: ${error.message}`));
});

// 4. Check current React Auth Context (if available)
setTimeout(() => {
  console.log('⚛️  React Context Check:');
  
  // Try to access auth context through React DevTools
  try {
    // This will work if React DevTools is available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React DevTools detected');
    }
    
    // Check if useAuth hook data is available in DOM
    const authElements = document.querySelectorAll('[data-auth-debug]');
    if (authElements.length > 0) {
      console.log('✅ Auth debug elements found:', authElements.length);
    }
  } catch (e) {
    console.log('ℹ️ React context check not available');
  }
}, 1000);

// 5. Monitor auth state changes
let previousAuthState = null;
const monitorAuth = () => {
  const currentAuthState = {
    hasToken: !!(tokens.access_token || tokens.authToken),
    hasUser: !!tokens.user,
    url: window.location.pathname
  };
  
  if (JSON.stringify(currentAuthState) !== JSON.stringify(previousAuthState)) {
    console.log('🔄 Auth state changed:', currentAuthState);
    previousAuthState = currentAuthState;
  }
};

// Set up monitoring
setInterval(monitorAuth, 1000);

// 6. Provide utility functions
window.authDebug = {
  clearAll: () => {
    Object.keys(tokens).forEach(key => localStorage.removeItem(key));
    console.log('🧹 All tokens cleared');
  },
  
  testAuth: async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (!token) {
      console.log('❌ No token to test');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Auth test passed:', userData);
      } else {
        console.log('❌ Auth test failed:', response.status, await response.text());
      }
    } catch (error) {
      console.log('❌ Auth test error:', error.message);
    }
  },
  
  checkBrands: async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (!token) {
      console.log('❌ No token for brands test');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/brands', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📋 Brands API response:', response.status);
      if (response.ok) {
        const brands = await response.json();
        console.log('✅ Brands loaded:', brands);
      } else {
        const error = await response.text();
        console.log('❌ Brands error:', error);
      }
    } catch (error) {
      console.log('❌ Brands fetch error:', error.message);
    }
  },
  
  simulateLogin: () => {
    // This is just for testing - don't use in production
    const fakeUser = { id: 1, username: 'test', role_id: 1 };
    const fakeToken = 'test-token-12345';
    
    localStorage.setItem('access_token', fakeToken);
    localStorage.setItem('user', JSON.stringify(fakeUser));
    
    console.log('🎭 Simulated login data set');
    console.log('🔄 Refresh page to test auth flow');
  }
};

console.log('🛠️ Debug utilities:', Object.keys(window.authDebug));
console.log('💡 Use window.authDebug.testAuth() to test authentication');
console.log('💡 Use window.authDebug.checkBrands() to test brands API');
console.log('💡 Use window.authDebug.clearAll() to clear all tokens');
console.log('================================');
