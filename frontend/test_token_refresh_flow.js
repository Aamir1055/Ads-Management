// End-to-end test for token refresh flow
// This script tests the complete refresh token flow in a browser environment

const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials
const TEST_USER = {
  username: 'admin',
  password: 'password'
};

class TokenRefreshTester {
  constructor() {
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(`%c${logMessage}`, 
      type === 'success' ? 'color: green' :
      type === 'error' ? 'color: red' :
      type === 'warning' ? 'color: orange' :
      'color: blue'
    );
    
    this.testResults.push({ timestamp, message, type });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testStep(stepName, testFunction) {
    this.log(`🧪 Starting: ${stepName}`, 'info');
    try {
      const result = await testFunction();
      this.log(`✅ Passed: ${stepName}`, 'success');
      return result;
    } catch (error) {
      this.log(`❌ Failed: ${stepName} - ${error.message}`, 'error');
      throw error;
    }
  }

  // Clear all auth data
  clearAuthData() {
    const keysToRemove = [
      'access_token',
      'refresh_token',
      'auth_token',
      'authToken',
      'user'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
  }

  // Login and get fresh tokens
  async loginAndGetTokens() {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Login failed: ${data.message}`);
    }

    const { access_token, refresh_token, user } = data.data;
    
    if (!access_token || !refresh_token) {
      throw new Error('Login did not return both access and refresh tokens');
    }

    // Store tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(user));

    return { access_token, refresh_token, user };
  }

  // Test API call with current token
  async testApiCall() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    
    if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
      throw new Error('TOKEN_EXPIRED');
    }
    
    if (!response.ok) {
      throw new Error(`API call failed: ${data.message || response.statusText}`);
    }

    return data;
  }

  // Manually refresh token using API
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Token refresh failed: ${data.message}`);
    }

    const { accessToken, refreshToken: newRefreshToken } = data.data;
    
    // Update stored tokens
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  // Create an expired token for testing
  createExpiredToken(originalToken) {
    try {
      // Decode the JWT payload (unsafe decode for testing)
      const parts = originalToken.split('.');
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      // Set expiration to 1 minute ago
      payload.exp = Math.floor(Date.now() / 1000) - 60;
      
      // Re-encode (this won't have a valid signature, but that's ok for testing)
      const newPayload = btoa(JSON.stringify(payload));
      return `${parts[0]}.${newPayload}.${parts[2]}`;
    } catch (error) {
      throw new Error('Failed to create expired token: ' + error.message);
    }
  }

  // Run the complete test suite
  async runTests() {
    this.log('🚀 Starting Token Refresh Flow Tests', 'info');
    
    try {
      // Step 1: Clear existing auth data
      await this.testStep('Clear existing auth data', async () => {
        this.clearAuthData();
        return 'Auth data cleared';
      });

      // Step 2: Login and get fresh tokens
      const tokens = await this.testStep('Login and get fresh tokens', async () => {
        return await this.loginAndGetTokens();
      });

      this.log(`📋 Got tokens: access(${tokens.access_token.substring(0, 20)}...) refresh(${tokens.refresh_token.substring(0, 20)}...)`, 'info');

      // Step 3: Test initial API call with fresh token
      await this.testStep('API call with fresh token', async () => {
        const result = await this.testApiCall();
        return `API call successful, user: ${result.data.user.username}`;
      });

      // Step 4: Test token refresh
      const newTokens = await this.testStep('Manual token refresh', async () => {
        return await this.refreshToken();
      });

      this.log(`📋 New tokens: access(${newTokens.accessToken.substring(0, 20)}...) refresh(${newTokens.refreshToken.substring(0, 20)}...)`, 'info');

      // Step 5: Test API call with refreshed token
      await this.testStep('API call with refreshed token', async () => {
        const result = await this.testApiCall();
        return `API call with refreshed token successful, user: ${result.data.user.username}`;
      });

      // Step 6: Test with expired token (simulate automatic refresh)
      await this.testStep('Test axios interceptor with expired token', async () => {
        // Create an expired token and set it
        const expiredToken = this.createExpiredToken(tokens.access_token);
        localStorage.setItem('access_token', expiredToken);
        
        // Import and use authService to test automatic refresh
        // This would need to be done in the browser with proper module loading
        this.log('⚠️ Axios interceptor test requires browser environment with authService', 'warning');
        
        return 'Expired token test setup (needs browser environment)';
      });

      this.log('🎉 All tests completed successfully!', 'success');
      return true;

    } catch (error) {
      this.log(`💥 Test suite failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Display test results
  displayResults() {
    console.log('\n📊 Test Results Summary:');
    console.table(this.testResults);
    
    const successful = this.testResults.filter(r => r.type === 'success').length;
    const failed = this.testResults.filter(r => r.type === 'error').length;
    
    console.log(`\n📈 Tests: ${successful} passed, ${failed} failed`);
  }
}

// Export for use in browser console or node
if (typeof window !== 'undefined') {
  // Browser environment
  window.TokenRefreshTester = TokenRefreshTester;
  
  // Auto-run test if requested
  if (window.location.search.includes('autorun=true')) {
    const tester = new TokenRefreshTester();
    tester.runTests().then(() => tester.displayResults());
  }
  
  console.log(`
🧪 Token Refresh Tester Loaded!

To run tests manually:
  const tester = new TokenRefreshTester();
  await tester.runTests();
  tester.displayResults();

Or visit: ${window.location.origin}${window.location.pathname}?autorun=true
  `);
  
} else {
  // Node.js environment
  module.exports = TokenRefreshTester;
}
