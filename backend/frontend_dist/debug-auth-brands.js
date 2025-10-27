console.log('🔍 Authentication & Brands Debug Script Starting...');

// Check localStorage for auth data
const token = localStorage.getItem('token');
const refreshToken = localStorage.getItem('refreshToken');
const userData = localStorage.getItem('user');

console.log('💾 LocalStorage Data:', {
  token: token ? 'EXISTS (' + token.length + ' chars)' : 'MISSING',
  refreshToken: refreshToken ? 'EXISTS (' + refreshToken.length + ' chars)' : 'MISSING',
  userData: userData ? 'EXISTS' : 'MISSING'
});

if (userData) {
  try {
    const user = JSON.parse(userData);
    console.log('👤 User Data:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    });
  } catch (e) {
    console.error('❌ Error parsing user data:', e);
  }
}

// Check if token is expired
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < now;
    
    console.log('🔑 Token Info:', {
      userId: payload.userId,
      username: payload.username,
      exp: new Date(payload.exp * 1000).toLocaleString(),
      iat: new Date(payload.iat * 1000).toLocaleString(),
      isExpired: isExpired,
      timeUntilExp: isExpired ? 'EXPIRED' : Math.floor((payload.exp - now) / 60) + ' minutes'
    });
  } catch (e) {
    console.error('❌ Error parsing token:', e);
  }
}

// Test API connectivity with more detailed logging
console.log('🌐 Testing API connectivity...');

const testAuth = async () => {
  try {
    console.log('🔐 Testing /api/auth/profile endpoint...');
    const response = await fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🔐 Auth Profile Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      redirected: response.redirected,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.ok) {
      const profile = await response.json();
      console.log('✅ Profile Data:', profile);
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Profile Error Response:', errorData);
      return false;
    }
  } catch (error) {
    console.error('💥 Auth Test Network Error:', error);
    return false;
  }
};

const testBrands = async () => {
  try {
    console.log('🏷️ Testing /api/brands endpoint...');
    const response = await fetch('/api/brands', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🏷️ Brands API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      redirected: response.redirected,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.ok) {
      const brands = await response.json();
      console.log('✅ Brands Data:', brands);
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Brands Error Response:', errorData);
      return false;
    }
  } catch (error) {
    console.error('💥 Brands Test Network Error:', error);
    return false;
  }
};

// Check React AuthContext if available
const checkReactAuthContext = () => {
  console.log('⚛️ Checking React AuthContext...');
  
  // Try to find auth context in React DevTools
  if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    console.log('⚛️ React detected, but context checking requires dev tools');
  }
  
  // Check for any auth-related global variables
  const authVars = Object.keys(window).filter(key => 
    key.toLowerCase().includes('auth') || 
    key.toLowerCase().includes('user') ||
    key.toLowerCase().includes('token')
  );
  
  if (authVars.length > 0) {
    console.log('🌐 Auth-related global variables found:', authVars);
  }
};

// Check current page location and state
const checkPageState = () => {
  console.log('📍 Current Page State:', {
    href: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    referrer: document.referrer
  });
  
  // Check for any error messages in the DOM
  const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [class*="danger"]');
  if (errorElements.length > 0) {
    console.log('⚠️ Error elements found on page:', errorElements.length);
    errorElements.forEach((el, i) => {
      console.log(`Error ${i + 1}:`, el.textContent.trim());
    });
  }
};

// Run comprehensive tests
const runTests = async () => {
  checkPageState();
  checkReactAuthContext();
  
  if (token) {
    console.log('\n🧪 Running API Tests...');
    const authOk = await testAuth();
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    const brandsOk = await testBrands();
    
    console.log('\n📊 Test Results:', {
      authEndpoint: authOk ? '✅ PASS' : '❌ FAIL',
      brandsEndpoint: brandsOk ? '✅ PASS' : '❌ FAIL'
    });
    
    if (authOk && brandsOk) {
      console.log('🎉 All tests passed! Authentication should be working.');
    } else {
      console.log('🚨 Some tests failed. Check the detailed logs above.');
    }
  } else {
    console.warn('⚠️ No token found, skipping API tests');
    console.log('💡 Suggestion: Try logging in again to generate a fresh token.');
  }
};

// Execute the tests
runTests().then(() => {
  console.log('\n🔍 Debug script completed. Summary above ⬆️');
}).catch(error => {
  console.error('💥 Debug script error:', error);
});
