// Debug authentication flow
// Run this in browser console to debug auth issues

console.log('🔍 Starting authentication debug...');

// Check localStorage
console.log('📦 LocalStorage tokens:');
console.log('  - access_token:', localStorage.getItem('access_token') ? 'EXISTS' : 'MISSING');
console.log('  - authToken:', localStorage.getItem('authToken') ? 'EXISTS' : 'MISSING'); 
console.log('  - auth_token:', localStorage.getItem('auth_token') ? 'EXISTS' : 'MISSING');
console.log('  - user:', localStorage.getItem('user') ? 'EXISTS' : 'MISSING');

// Show token details (first 20 chars only)
const accessToken = localStorage.getItem('access_token');
const authToken = localStorage.getItem('authToken');
const user = localStorage.getItem('user');

if (accessToken) {
  console.log('🔑 Access token preview:', accessToken.substring(0, 20) + '...');
}

if (authToken) {
  console.log('🔑 Auth token preview:', authToken.substring(0, 20) + '...');
}

if (user) {
  try {
    const userObj = JSON.parse(user);
    console.log('👤 User object:', {
      id: userObj.id,
      username: userObj.username,
      role_id: userObj.role_id
    });
  } catch (e) {
    console.error('❌ Invalid user object in localStorage');
  }
}

// Test the cleanupOldTokens function logic
const cleanupOldTokens = () => {
  const accessToken = localStorage.getItem('access_token')
  const oldAuthToken = localStorage.getItem('authToken')
  const oldToken = localStorage.getItem('auth_token')
  
  console.log('🧹 Token cleanup check:');
  console.log('  - accessToken:', accessToken ? 'EXISTS' : 'MISSING');
  console.log('  - oldAuthToken:', oldAuthToken ? 'EXISTS' : 'MISSING');
  console.log('  - oldToken:', oldToken ? 'EXISTS' : 'MISSING');
  
  if (!accessToken && (oldAuthToken || oldToken)) {
    console.log('⚠️ ISSUE FOUND: No access_token but old tokens exist!');
    console.log('🔄 This would trigger a redirect to login');
    return null;
  }
  
  console.log('✅ Token cleanup check passed');
  return accessToken;
};

const finalToken = cleanupOldTokens();
console.log('🎯 Final token for requests:', finalToken ? 'VALID' : 'INVALID');

// Test authentication context
console.log('🔄 Testing AuthContext state...');
window.testAuth = () => {
  try {
    // This assumes you have access to useAuth hook somehow
    console.log('This needs to be run from within a React component');
  } catch (e) {
    console.log('Cannot test AuthContext from here - needs to be in component');
  }
};

// Test API request
console.log('🌐 Testing API request to brands...');
window.testBrandsAPI = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/brands', {
      headers: {
        'Authorization': `Bearer ${finalToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Success:', data);
    } else {
      const errorData = await response.json();
      console.log('❌ API Error:', errorData);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

console.log('🎯 Debug complete. Run these functions in console:');
console.log('  - window.testBrandsAPI() - Test brands API directly');
console.log('  - window.clearAllTokens() - Clear all tokens (already available)');

export default {};
