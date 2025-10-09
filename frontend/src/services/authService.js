import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class AuthService {
  constructor() {
    this.refreshPromise = null;
    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    console.log('😫 Axios interceptors DISABLED to prevent auth loops');
    // TEMPORARILY DISABLED - these interceptors might be causing infinite loops
    // by triggering token refresh which changes auth state
    
    // Basic request interceptor only - no auto-refresh
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // NO RESPONSE INTERCEPTOR - to prevent auth loops
  }

  async login(username, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });

      if (response.data.success) {
        const { access_token, refresh_token, user } = response.data.data;
        
        // Store tokens and user data
        this.setAuthData(access_token, refresh_token, user);
        
        return response.data;
      }
      
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      console.error('🚫 Login error:', error);
      throw error;
    }
  }

  async loginWith2FA(userId, token) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login-2fa`, {
        user_id: userId,
        token
      });

      if (response.data.success) {
        const { access_token, refresh_token, user } = response.data.data;
        
        // Store tokens and user data
        this.setAuthData(access_token, refresh_token, user);
        
        return response.data;
      }
      
      throw new Error(response.data.message || '2FA login failed');
    } catch (error) {
      console.error('🚫 2FA login error:', error);
      throw error;
    }
  }

  async refreshToken() {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      console.error('🚫 No refresh token available');
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  async performTokenRefresh(refreshToken) {
    try {
      console.log('🔄 Refreshing tokens...');
      
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });

      if (response.data.success) {
        // Backend returns access_token and refresh_token (snake_case)
        const { access_token, refresh_token, user } = response.data.data;
        
        // Update stored tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        // Update user data if provided
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        console.log('✅ Tokens refreshed successfully');
        
        // Return camelCase for consistency with frontend
        return { accessToken: access_token, refreshToken: refresh_token };
      }
      
      throw new Error(response.data.message || 'Token refresh failed');
    } catch (error) {
      console.error('🚫 Token refresh error:', error);
      
      // If refresh fails with 401, the refresh token is invalid/expired
      if (error.response?.status === 401) {
        console.log('🚫 Refresh token expired or invalid');
      }
      
      throw error;
    }
  }

  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        // Notify server to revoke refresh token
        await axios.post(`${API_BASE_URL}/auth/logout`, {
          refreshToken
        });
      }
    } catch (error) {
      console.warn('⚠️ Logout API call failed:', error.message);
      // Continue with local cleanup even if server call fails
    } finally {
      this.clearAuthData();
      this.redirectToLogin();
    }
  }

  async getCurrentUser() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      
      if (response.data.success) {
        const user = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
      
      throw new Error(response.data.message || 'Failed to get user info');
    } catch (error) {
      console.error('🚫 Get current user error:', error);
      throw error;
    }
  }

  setAuthData(accessToken, refreshToken, user) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    console.log('✅ Auth data stored successfully');
  }

  clearAuthData() {
    const keysToRemove = [
      'access_token',
      'refresh_token', 
      'auth_token',
      'authToken',
      'user'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('🧹 Auth data cleared');
  }

  handleAuthFailure(reason = 'Authentication failed') {
    console.log(`🚫 Auth failure: ${reason}`);
    this.clearAuthData();
    this.redirectToLogin();
  }

  redirectToLogin() {
    // Avoid infinite redirects if already on login page
    if (window.location.pathname !== '/login') {
      console.log('🔄 Redirecting to login page...');
      
      // Store the current location to redirect back after login
      if (window.location.pathname !== '/') {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      }
      
      window.location.href = '/login';
    }
  }

  isAuthenticated() {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const user = localStorage.getItem('user');
    
    // For full auth, we need access token and user data
    // Refresh token is optional (for demo mode)
    return !!(accessToken && user);
  }

  getStoredUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('🚫 Failed to parse stored user:', error);
      return null;
    }
  }

  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  // Check if token is close to expiring (for proactive refresh)
  isTokenExpiringSoon() {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Decode JWT payload (without verification - just to read expiry)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // Only consider token expiring soon if less than 5 minutes remaining
      // AND it has already been at least 10 minutes since token was issued
      const tokenAge = currentTime - (payload.iat * 1000);
      const isTokenOldEnough = tokenAge > 10 * 60 * 1000; // 10 minutes
      
      console.log('🔍 Token expiry check:', {
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000),
        tokenAge: Math.round(tokenAge / 1000),
        isOldEnough: isTokenOldEnough,
        shouldRefresh: timeUntilExpiry < 5 * 60 * 1000 && isTokenOldEnough
      });
      
      return timeUntilExpiry < 5 * 60 * 1000 && isTokenOldEnough;
    } catch (error) {
      console.error('😫 Error checking token expiration:', error);
      return false;
    }
  }

  // Proactively refresh token if it's expiring soon
  async checkAndRefreshToken() {
    if (this.isTokenExpiringSoon() && this.getRefreshToken()) {
      try {
        console.log('🔄 Token expiring soon, proactively refreshing...');
        await this.refreshToken();
      } catch (error) {
        console.error('🚫 Proactive token refresh failed:', error);
      }
    }
  }

  // Start periodic token check (call this after login)
  startTokenRefreshTimer() {
    // Disabled to prevent refresh loops during development
    // TODO: Re-enable in production with proper safeguards
    console.log('🔄 Token refresh timer disabled to prevent loops');
    return;
    
    // Check token every minute
    setInterval(() => {
      this.checkAndRefreshToken();
    }, 60 * 1000);
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
