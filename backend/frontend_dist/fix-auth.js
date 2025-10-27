// Quick Authentication Fix Script
// Run this in browser console to diagnose and fix auth issues

async function fixAuth() {
  console.log('🔧 Quick Auth Fix Starting...\n');
  
  // 1. Check current auth state
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const user = localStorage.getItem('user');
  
  console.log('Current Auth State:');
  console.log('• Access Token:', accessToken ? '✅ Present' : '❌ Missing');
  console.log('• Refresh Token:', refreshToken ? '✅ Present' : '❌ Missing');
  console.log('• User Data:', user ? '✅ Present' : '❌ Missing');
  
  // 2. If no tokens, try to login
  if (!accessToken && !refreshToken) {
    console.log('\n❌ No auth tokens found. Please log in.');
    
    // Clear any corrupted data
    ['access_token', 'refresh_token', 'authToken', 'auth_token', 'user'].forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Redirect to login
    if (window.location.pathname !== '/login') {
      console.log('🔄 Redirecting to login...');
      window.location.href = '/login';
    }
    return;
  }
  
  // 3. Check if token is expired
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        console.log('⏰ Access token is expired');
        
        // Try to refresh if refresh token exists
        if (refreshToken) {
          console.log('🔄 Attempting token refresh...');
          
          try {
            const response = await fetch('http://localhost:5000/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
              localStorage.setItem('access_token', data.data.accessToken);
              localStorage.setItem('refresh_token', data.data.refreshToken);
              
              console.log('✅ Tokens refreshed successfully!');
              console.log('🔄 Reloading page...');
              window.location.reload();
              return;
            } else {
              console.log('❌ Token refresh failed:', data.message);
            }
          } catch (error) {
            console.log('❌ Token refresh error:', error.message);
          }
        }
        
        // If refresh failed, clear data and redirect to login
        console.log('🧹 Clearing expired auth data...');
        ['access_token', 'refresh_token', 'authToken', 'auth_token', 'user'].forEach(key => {
          localStorage.removeItem(key);
        });
        
        if (window.location.pathname !== '/login') {
          console.log('🔄 Redirecting to login...');
          window.location.href = '/login';
        }
        return;
      } else {
        console.log('✅ Access token is valid');
      }
    } catch (error) {
      console.log('❌ Invalid token format:', error.message);
      
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return;
    }
  }
  
  // 4. Test API connection
  console.log('\n🌐 Testing API connection...');
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ API connection successful');
      console.log(`✅ Authenticated as: ${data.data.user.username}`);
      console.log('🎉 Authentication is working correctly!');
      
      // Ensure user data is up to date
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
    } else {
      console.log('❌ API authentication failed:', data.message);
      
      // If it's a 401, try refresh or redirect to login
      if (response.status === 401) {
        console.log('🔄 Attempting token refresh...');
        // Try refresh logic again or clear and redirect
        fixAuth(); // Recursive call to retry
      }
    }
  } catch (error) {
    console.log('❌ API connection error:', error.message);
    console.log('Make sure the backend server is running on http://localhost:5000');
  }
}

// Quick login function
async function quickLogin(username = 'admin', password = 'password') {
  console.log(`🔑 Attempting quick login as ${username}...`);
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      console.log('✅ Login successful!');
      console.log('🔄 Reloading page...');
      window.location.reload();
    } else {
      console.log('❌ Login failed:', data.message);
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
  }
}

// Clear auth data
function clearAuth() {
  console.log('🧹 Clearing all authentication data...');
  
  ['access_token', 'refresh_token', 'authToken', 'auth_token', 'user'].forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('✅ Auth data cleared');
  console.log('🔄 Redirecting to login...');
  window.location.href = '/login';
}

// Make functions globally available
window.fixAuth = fixAuth;
window.quickLogin = quickLogin;
window.clearAuth = clearAuth;

console.log('🚀 Auth Fix Tools Loaded!');
console.log('Available functions:');
console.log('• fixAuth() - Diagnose and fix auth issues');
console.log('• quickLogin() - Quick login with admin/password');
console.log('• clearAuth() - Clear all auth data and redirect to login');
