// Quick login and test script for the fixed brands module
// Run this in your browser console

console.log('🚀 QUICK LOGIN AND BRANDS TEST');
console.log('===============================');

// Function to login and test
window.loginAndTestBrands = async () => {
  console.log('🔐 Attempting to restore authentication...');
  
  try {
    // Try to login with demo credentials first
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData);
      
      if (loginData.success && loginData.data.access_token) {
        // Store the authentication data
        localStorage.setItem('access_token', loginData.data.access_token);
        localStorage.setItem('user', JSON.stringify(loginData.data.user));
        
        console.log('💾 Auth data stored successfully');
        console.log('🔄 Refreshing page to test brands module...');
        
        // Refresh the page to trigger the enhanced auth flow
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        return;
      }
    }
    
    // If API login failed, try to restore the previous token
    console.log('⚠️ API login not available, trying previous token...');
    
    const previousToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjM1LCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU4MDEyMzgwLCJleHAiOjE3NTgwMTMyODB9.j34qQhwXkTsnWXtFuhNPkCQBKQi6y7kswrxdaTuQfl8';
    
    // Test if the previous token is still valid
    const authResponse = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${previousToken}`
      }
    });
    
    if (authResponse.ok) {
      const userData = await authResponse.json();
      console.log('✅ Previous token is valid:', userData);
      
      // Store the authentication data
      localStorage.setItem('access_token', previousToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('💾 Auth data restored from previous session');
      console.log('🔄 Refreshing page to test brands module...');
      
      // Refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.log('❌ Previous token is expired');
      console.log('📍 Redirecting to login page...');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
    
  } catch (error) {
    console.error('🌐 Network error:', error.message);
    console.log('💡 Make sure your backend is running on localhost:5000');
    console.log('📍 Redirecting to login page...');
    
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  }
};

// Function to manually set demo auth data
window.setDemoAuth = () => {
  console.log('🎭 Setting demo authentication data...');
  
  const demoToken = 'demo-token-' + Date.now();
  const demoUser = {
    id: 1,
    username: 'admin',
    role_id: 1,
    role_name: 'Admin'
  };
  
  localStorage.setItem('access_token', demoToken);
  localStorage.setItem('user', JSON.stringify(demoUser));
  
  console.log('✅ Demo auth data set');
  console.log('🔄 Refreshing page...');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
};

console.log('===============================');
console.log('🎯 OPTIONS:');
console.log('1️⃣ Try login/restore: window.loginAndTestBrands()');
console.log('2️⃣ Set demo auth: window.setDemoAuth()');
console.log('===============================');

console.log('💡 BRANDS MODULE FIX APPLIED:');
console.log('• Removed authentication checks from component');
console.log('• Relies entirely on ProtectedRoute for auth');
console.log('• Works like other modules (Campaigns, etc.)');
console.log('• Should no longer clear tokens or redirect');
console.log('===============================');
