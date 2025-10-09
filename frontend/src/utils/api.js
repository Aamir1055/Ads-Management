import axios from 'axios'
import config from '../config/config'
import authService from '../services/authService'

// FIXED: Use centralized configuration
const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Global function for manual token cleanup (accessible from console)
window.clearAllTokens = () => {
  console.log('🧹 Clearing all tokens manually...');
  localStorage.removeItem('access_token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  sessionStorage.clear();
  console.log('✅ All tokens cleared! Redirecting to login...');
  window.location.href = '/login';
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if this is a token expiration error and not already a retry
    if (error.response?.status === 401 && 
        (error.response?.data?.code === 'TOKEN_EXPIRED' || error.response?.data?.message?.includes('token')) && 
        !originalRequest._retry) {
      
      console.log('🔄 Token expired, attempting refresh...');
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using the refresh endpoint
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${config.API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        const data = await response.json();
        
        if (data.success) {
          const { accessToken, refreshToken: newRefreshToken } = data.data;
          
          // Update stored tokens
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          console.log('✅ Token refreshed successfully');
          
          // Retry the original request
          return api(originalRequest);
        } else {
          throw new Error(data.message || 'Token refresh failed');
        }
      } catch (refreshError) {
        console.error('🚫 Token refresh failed:', refreshError);
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // For other 401 errors or if refresh failed
    if (error.response?.status === 401) {
      console.log('🚩 Authentication failed, redirecting to login');
      
      // Check if this might be related to new modules
      const isNewModuleRequest = originalRequest.url?.includes('/facebook-') || 
                                originalRequest.url?.includes('/bm') ||
                                originalRequest.url?.includes('/ads-manager')
      
      if (isNewModuleRequest) {
        sessionStorage.setItem('loginMessage', 
          'Please log in again to access the new Facebook and Advertising modules with updated permissions.'
        )
      }
      
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle other error scenarios
    if (error.response?.status === 403) {
      // Permission denied - check if it's a token type issue
      const message = error.response?.data?.message || 'Access denied. You don\'t have permission to perform this action.'
      console.error('Permission denied:', message)
      
      // Check if this is related to new modules (Facebook, Business Manager, Ads Manager)
      const isNewModuleRequest = originalRequest.url?.includes('/facebook-') || 
                                originalRequest.url?.includes('/bm') ||
                                originalRequest.url?.includes('/ads-manager')
      
      // If it's a token type error, clear old tokens and redirect to login
      if (message.includes('Wrong token type') || message.includes('access token')) {
        console.log('Token type error detected, clearing old tokens')
        localStorage.removeItem('access_token')
        localStorage.removeItem('authToken')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        
        if (window.location.pathname !== '/login') {
          sessionStorage.setItem('loginMessage', 'Please log in again to get a fresh access token.')
          window.location.href = '/login'
        }
      } else if (isNewModuleRequest) {
        // Specific handling for new module permissions
        console.log('🔒 Access denied to new module - may need fresh session')
        const newModuleMessage = 'You may need to log out and log in again to access the new Facebook and Advertising modules.'
        sessionStorage.setItem('permissionMessage', newModuleMessage)
        
        // Enhanced error for components to use
        error.isNewModulePermissionError = true
        error.newModuleMessage = newModuleMessage
      }
      // You could show a toast notification here
    } else if (error.response?.status === 404) {
      // Resource not found
      const message = error.response?.data?.message || 'The item you\'re looking for doesn\'t exist or may have been removed.'
      console.error('Resource not found:', message)
    } else if (error.response?.status >= 500) {
      // Server errors
      const message = error.response?.data?.message || 'We\'re experiencing technical difficulties. Please try again in a few minutes.'
      console.error('Server error:', message)
    } else if (error.response?.data?.message) {
      // Any other error with a message from the backend
      console.error('API Error:', error.response.data.message)
    }
    
    // Enhance the error object with user-friendly message for components to use
    if (error.response?.data?.message) {
      error.userMessage = error.response.data.message
    } else {
      // Fallback messages based on status codes
      switch (error.response?.status) {
        case 400:
          error.userMessage = 'There was an issue with your request. Please check your input and try again.'
          break
        case 403:
          error.userMessage = 'Access denied. You don\'t have permission to perform this action.'
          break
        case 404:
          error.userMessage = 'The item you\'re looking for doesn\'t exist or may have been removed.'
          break
        case 409:
          error.userMessage = 'This action conflicts with existing data. Please try again.'
          break
        case 422:
          error.userMessage = 'Some of the information you provided is not valid. Please check and try again.'
          break
        case 429:
          error.userMessage = 'You\'re making too many requests. Please wait a moment and try again.'
          break
        case 500:
        case 502:
        case 503:
        case 504:
          error.userMessage = 'We\'re experiencing technical difficulties. Please try again in a few minutes.'
          break
        default:
          error.userMessage = 'Something went wrong. Please try again later.'
      }
    }
    
    return Promise.reject(error)
  }
)

// FIXED: User API functions - Standardized to use /user-management endpoints
export const userApi = {
  // Get all users
  getUsers: () => api.get('/user-management'),
  
  // Create new user
  createUser: (userData) => api.post('/user-management', userData),
  
  // Update user
  updateUser: (userId, userData) => api.put(`/user-management/${userId}`, userData),
  
  // Delete user
  deleteUser: (userId) => api.delete(`/user-management/${userId}`),
  
  // Toggle user status
  toggleUserStatus: (userId) => api.patch(`/user-management/${userId}/toggle-status`),
  
  // Generate 2FA QR code for user
  generate2FA: (userId) => api.post(`/user-management/${userId}/generate-2fa`),
  
  // Get roles
  getRoles: () => api.get('/user-management/roles'),
  
  // Legacy 2FA endpoints (kept for compatibility)
  verify2FA: (userId, code) => api.post(`/2fa/verify`, { userId, code }),
}

// Two-Factor Authentication API functions
export const twoFactorApi = {
  // Setup 2FA - generates QR code and secret
  setup: (username, temporary = false) => api.post('/2fa/setup', { username, temporary }),
  
  // Verify setup token and complete 2FA setup
  verifySetup: (userId, token) => api.post('/2fa/verify-setup', { user_id: userId, token }),
  
  // Verify temporary 2FA token for new users
  verifyTemporary: (tempKey, token) => api.post('/2fa/verify-temporary', { temp_key: tempKey, token }),
  
  // Get temporary 2FA data
  getTemporary: (tempKey) => api.get(`/2fa/temporary/${tempKey}`),
  
  // Verify 2FA token during login
  verifyLogin: (userId, token) => api.post('/2fa/verify-login', { user_id: userId, token }),
  
  // Get 2FA status for user
  getStatus: (userId) => api.get(`/2fa/status/${userId}`),
  
  // Disable 2FA (requires current token)
  disable: (userId, currentToken) => api.post('/2fa/disable', { user_id: userId, current_token: currentToken }),
  
  // Generate backup codes (requires current token)
  generateBackupCodes: (userId, currentToken) => api.post('/2fa/backup-codes', { user_id: userId, current_token: currentToken }),
  
  // Get 2FA information
  getInfo: () => api.get('/2fa/info'),
}

// Role API functions
export const roleApi = {
  // Get all roles
  getRoles: () => api.get('/permissions/roles'),
  
  // Create new role
  createRole: (roleData) => api.post('/permissions/roles', roleData),
  
  // Update role
  updateRole: (roleId, roleData) => api.put(`/permissions/roles/${roleId}`, roleData),
  
  // Delete role
  deleteRole: (roleId) => api.delete(`/permissions/role/${roleId}`),
}

// Brand API functions
export const brandApi = {
  // Get all brands
  getBrands: () => api.get('/brands'),
  
  // Get brand by ID
  getBrand: (brandId) => api.get(`/brands/${brandId}`),
  
  // Create new brand
  createBrand: (brandData) => api.post('/brands', brandData),
  
  // Update brand
  updateBrand: (brandId, brandData) => api.put(`/brands/${brandId}`, brandData),
  
  // Delete brand
  deleteBrand: (brandId) => api.delete(`/brands/${brandId}`),
  
  // Toggle brand status
  toggleBrandStatus: (brandId) => api.patch(`/brands/${brandId}/status`),
}

// Export both named and default exports
export { api }
export default api
