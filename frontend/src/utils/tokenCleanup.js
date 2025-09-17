// Token cleanup utility
// Use this when you get 401 errors due to expired tokens

export const clearAllTokens = () => {
  console.log('🧹 Clearing all authentication tokens...');
  
  // Remove all possible token keys
  const tokenKeys = [
    'access_token',
    'authToken', 
    'auth_token',
    'refresh_token',
    'user'
  ];
  
  tokenKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  console.log('✅ All tokens cleared');
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Check if current token is likely expired based on 401 errors
export const checkTokenExpiry = async () => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  
  if (!token) {
    console.log('❌ No token found');
    return false;
  }
  
  try {
    // Try to decode JWT token to check expiry (basic check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp < currentTime) {
      console.log('⏰ Token has expired');
      clearAllTokens();
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('🔍 Could not decode token, assuming valid');
    return true;
  }
};

// Auto-cleanup function to run on app start
export const autoCleanupExpiredTokens = () => {
  // Check for common signs of token issues
  const hasRecentAuthError = sessionStorage.getItem('recent_auth_error');
  
  if (hasRecentAuthError) {
    console.log('🚨 Recent auth error detected, clearing tokens');
    clearAllTokens();
  }
  
  checkTokenExpiry();
};

// Function to call when you get 401 errors
export const handleAuthError = (error) => {
  if (error.response?.status === 401 || error.status === 401) {
    console.log('🚨 401 Unauthorized - clearing tokens and redirecting');
    sessionStorage.setItem('recent_auth_error', 'true');
    clearAllTokens();
  }
};

// Make this available globally for console debugging
if (typeof window !== 'undefined') {
  window.clearAllTokens = clearAllTokens;
  window.checkTokenExpiry = checkTokenExpiry;
}
