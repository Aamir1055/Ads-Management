// =================================================================
// BROWSER DEBUG TEST - RUN THIS IN YOUR BROWSER CONSOLE
// =================================================================
// 
// Instructions:
// 1. Open your website in the browser
// 2. Open Developer Tools (F12)
// 3. Go to Console tab
// 4. Copy and paste this entire script
// 5. Press Enter to run it
// 6. Check the results
//
// This will diagnose authentication and API connection issues
// =================================================================

console.log('🚀 Starting authentication and API debug test...\n');

// Helper function to make API calls
const testApiCall = async (url, method = 'GET', data = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Check for token and add to headers
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers,
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`http://localhost:5000/api${url}`, options);
    const responseData = await response.json();
    
    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data: responseData
    };
  } catch (error) {
    return {
      error: error.message,
      status: 'NETWORK_ERROR'
    };
  }
};

// Test 1: Check current authentication state
console.log('📋 TEST 1: Checking authentication state...');
console.log('──────────────────────────────────────────────');

const accessToken = localStorage.getItem('access_token');
const authToken = localStorage.getItem('authToken');  // Old format
const user = localStorage.getItem('user');

console.log('🔑 Tokens found:');
console.log(`   - access_token: ${accessToken ? `YES (${accessToken.length} chars)` : 'NO'}`);
console.log(`   - authToken (old): ${authToken ? `YES (${authToken.length} chars)` : 'NO'}`);
console.log(`   - user data: ${user ? 'YES' : 'NO'}`);

if (accessToken) {
  console.log(`   - Token preview: ${accessToken.substring(0, 20)}...`);
}

// Test 2: Check backend connectivity
console.log('\n📋 TEST 2: Testing backend connectivity...');
console.log('──────────────────────────────────────────────');

testApiCall('/health').then(result => {
  console.log('🏥 Health check result:', result);
  
  if (result.ok) {
    console.log('✅ Backend is accessible and running');
    console.log('   - Database status:', result.data.database?.status);
    console.log('   - Server uptime:', result.data.system?.uptime, 'seconds');
  } else {
    console.log('❌ Backend connectivity issue');
  }
});

// Test 3: Test protected endpoint (brands)
console.log('\n📋 TEST 3: Testing protected endpoint access...');
console.log('──────────────────────────────────────────────');

testApiCall('/brands').then(result => {
  console.log('🏷️ Brands API result:', result);
  
  if (result.ok) {
    console.log('✅ Successfully accessed brands endpoint');
    console.log('   - Number of brands:', result.data.data?.length || 0);
    if (result.data.data && result.data.data.length > 0) {
      console.log('   - Sample brand:', result.data.data[0]);
    }
  } else {
    console.log('❌ Failed to access brands endpoint');
    console.log('   - Status:', result.status);
    console.log('   - Error:', result.data?.message || result.error);
    
    if (result.status === 401) {
      console.log('🚨 AUTHENTICATION ISSUE: Token is invalid or expired');
      console.log('   - Try logging out and logging back in');
    } else if (result.status === 403) {
      console.log('🚨 PERMISSION ISSUE: User lacks required permissions');
      console.log('   - Check user role and permissions');
    }
  }
});

// Test 4: Test other endpoints
console.log('\n📋 TEST 4: Testing other module endpoints...');
console.log('──────────────────────────────────────────────');

const endpoints = [
  { name: 'Users', path: '/users' },
  { name: 'Campaigns', path: '/campaigns' },
  { name: 'Cards', path: '/cards' },
  { name: 'Campaign Types', path: '/campaign-types' },
  { name: 'Campaign Data', path: '/campaign-data' }
];

endpoints.forEach((endpoint, index) => {
  setTimeout(() => {
    testApiCall(endpoint.path).then(result => {
      console.log(`${endpoint.name} (${endpoint.path}):`, result.ok ? '✅ SUCCESS' : '❌ FAILED');
      if (!result.ok) {
        console.log(`   - Status: ${result.status}, Message: ${result.data?.message || result.error}`);
      } else {
        console.log(`   - Records: ${result.data.data?.length || 0}`);
      }
    });
  }, index * 100); // Stagger requests to avoid overwhelming
});

// Test 5: Check localStorage and sessionStorage
console.log('\n📋 TEST 5: Checking browser storage...');
console.log('──────────────────────────────────────────────');

console.log('📦 localStorage contents:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  if (key.includes('token') || key.includes('auth') || key.includes('user')) {
    console.log(`   - ${key}: ${value ? (value.length > 100 ? `${value.substring(0, 30)}... (${value.length} chars)` : value) : 'null'}`);
  }
}

console.log('📦 sessionStorage contents:');
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  const value = sessionStorage.getItem(key);
  console.log(`   - ${key}: ${value}`);
}

// Final recommendations
console.log('\n💡 DIAGNOSTIC COMPLETE');
console.log('══════════════════════════════════════════════');
console.log('If all tests pass but modules are still blank, check:');
console.log('1. Browser console for JavaScript errors');
console.log('2. Network tab for failed requests');
console.log('3. React component state and rendering');
console.log('4. Frontend routing issues');
console.log('\nIf authentication tests fail:');
console.log('1. Try logging out and back in');
console.log('2. Clear browser storage: clearAllTokens()');
console.log('3. Check user permissions in database');

// Provide utility functions
console.log('\n🔧 Utility functions available:');
console.log('- clearAllTokens() - Clear all authentication data');
console.log('- testApiCall("/endpoint") - Test any API endpoint');

window.testApiCall = testApiCall;
