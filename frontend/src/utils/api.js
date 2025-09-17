import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
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

// Clean up old tokens and ensure we're using the correct token
const cleanupOldTokens = () => {
  // If we have old tokens but no access_token, clear everything
  const accessToken = localStorage.getItem('access_token')
  const oldAuthToken = localStorage.getItem('authToken')
  const oldToken = localStorage.getItem('auth_token')
  
  if (!accessToken && (oldAuthToken || oldToken)) {
    console.log('Cleaning up old token format, please login again')
    localStorage.removeItem('authToken')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return null
  }
  
  return accessToken
}

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = cleanupOldTokens()
  console.log('🔑 Token being sent:', token ? `${token.substring(0, 20)}...` : 'No token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Enhanced error handling with user-friendly messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error scenarios
    if (error.response?.status === 401) {
      // Clear auth data (all possible token names for compatibility)
      localStorage.removeItem('access_token')
      localStorage.removeItem('authToken')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      
      // Show user-friendly message
      const message = error.response?.data?.message || 'Your session has expired. Please log in again.'
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        // Store the message to show on login page if needed
        sessionStorage.setItem('loginMessage', message)
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      // Permission denied - check if it's a token type issue
      const message = error.response?.data?.message || 'Access denied. You don\'t have permission to perform this action.'
      console.error('Permission denied:', message)
      
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

// User API functions
export const userApi = {
  // Get all users
  getUsers: () => api.get('/users'),
  
  // Create new user
  createUser: (userData) => api.post('/users', userData),
  
  // Update user
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  
  // Delete user
  deleteUser: (userId) => api.delete(`/users/${userId}`),
  
  // Toggle user status
  toggleUserStatus: (userId) => api.patch(`/users/${userId}/toggle-status`),
  
  // Enable 2FA for user
  enable2FA: (userId) => api.post(`/users/${userId}/enable-2fa`),
  
  // Disable 2FA
  disable2FA: (userId) => api.post(`/users/${userId}/disable-2fa`),
  
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
