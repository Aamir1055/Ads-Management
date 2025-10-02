const axios = require('axios');

async function debugAuthIssues() {
  console.log('🔍 Diagnosing Authentication Issues...\n');
  
  // Check what's in localStorage
  console.log('1. 📋 Checking stored authentication data:');
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const user = localStorage.getItem('user');
  const authToken = localStorage.getItem('authToken');
  
  console.log(`• Access Token: ${accessToken ? '✅ Present' : '❌ Missing'}`);
  console.log(`• Refresh Token: ${refreshToken ? '✅ Present' : '❌ Missing'}`);
  console.log(`• User Data: ${user ? '✅ Present' : '❌ Missing'}`);
  console.log(`• Legacy AuthToken: ${authToken ? '⚠️  Present (should remove)' : '✅ Not present'}`);
  
  // Check token validity if present
  if (accessToken) {
    console.log('\n2. 🔍 Checking token validity:');
    try {
      // Decode JWT payload (without verification)
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      console.log(`• Token expires at: ${new Date(expirationTime).toLocaleString()}`);
      console.log(`• Current time: ${new Date(currentTime).toLocaleString()}`);
      
      if (timeUntilExpiry > 0) {
        const minutesLeft = Math.floor(timeUntilExpiry / 60000);
        console.log(`• Status: ✅ Valid (${minutesLeft} minutes remaining)`);
        
        if (minutesLeft < 5) {
          console.log('⚠️  Token expires very soon, refresh may be needed');
        }
      } else {
        const minutesAgo = Math.abs(Math.floor(timeUntilExpiry / 60000));
        console.log(`• Status: ❌ EXPIRED (${minutesAgo} minutes ago)`);
      }
      
    } catch (error) {
      console.log(`• Status: ❌ INVALID (cannot decode: ${error.message})`);
    }
  }
  
  // Test API connectivity
  console.log('\n3. 🌐 Testing API connectivity:');
  try {
    const response = await fetch('http://localhost:5000/api/auth/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('• Backend API: ✅ Reachable');
    } else {
      console.log(`• Backend API: ❌ HTTP ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`• Backend API: ❌ ${error.message}`);
    console.log('  Make sure backend is running on http://localhost:5000');
  }
  
  // Test authentication endpoint
  if (accessToken) {
    console.log('\n4. 🔐 Testing authentication with current token:');
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('• Auth test: ✅ Token is valid');
        console.log(`• User: ${data.data.user.username} (ID: ${data.data.user.id})`);
      } else {
        console.log(`• Auth test: ❌ ${data.message || 'Authentication failed'}`);
        
        if (response.status === 401) {
          console.log('  → Token is invalid or expired');
        }
      }
    } catch (error) {
      console.log(`• Auth test: ❌ ${error.message}`);
    }
  }
  
  // Test refresh token if available
  if (refreshToken) {
    console.log('\n5. 🔄 Testing token refresh:');
    try {
      const response = await fetch('http://localhost:5000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('• Refresh test: ✅ Refresh token is valid');
        console.log('• New tokens can be obtained');
        
        // Ask user if they want to refresh tokens
        const shouldRefresh = confirm('Would you like to refresh your tokens now?');
        if (shouldRefresh) {
          localStorage.setItem('access_token', data.data.accessToken);
          localStorage.setItem('refresh_token', data.data.refreshToken);
          console.log('✅ Tokens refreshed successfully!');
          console.log('🔄 Please reload the page to apply changes.');
        }
      } else {
        console.log(`• Refresh test: ❌ ${data.message || 'Refresh failed'}`);
        
        if (response.status === 401) {
          console.log('  → Refresh token is invalid or expired');
        }
      }
    } catch (error) {
      console.log(`• Refresh test: ❌ ${error.message}`);
    }
  }
  
  // Provide recommendations
  console.log('\n6. 💡 Recommendations:');
  
  if (!accessToken && !refreshToken) {
    console.log('❌ No authentication tokens found');
    console.log('→ Please log in again');
  } else if (accessToken && refreshToken) {
    // Check if tokens are expired
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        console.log('❌ Access token is expired');
        console.log('→ Try refreshing tokens or log in again');
      } else {
        console.log('✅ Tokens appear valid');
        console.log('→ 401 errors might be due to:');
        console.log('   - Backend not running');
        console.log('   - CORS issues');
        console.log('   - Token format mismatch');
        console.log('   - API endpoint changes');
      }
    } catch (e) {
      console.log('❌ Token format is invalid');
      console.log('→ Clear localStorage and log in again');
    }
  }
  
  // Clean up old tokens
  if (authToken) {
    console.log('\n7. 🧹 Cleaning up old token formats:');
    localStorage.removeItem('authToken');
    console.log('✅ Removed legacy authToken');
  }
}

// Export for browser console use
window.debugAuthIssues = debugAuthIssues;

console.log('🚀 Auth debugging script loaded. Run debugAuthIssues() in console to diagnose issues.');
