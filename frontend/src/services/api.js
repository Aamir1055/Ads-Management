import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Note: Token refresh and authentication handling is now managed by authService.js
// This api instance will automatically get tokens through axios interceptors set up there

// Request interceptor to add auth token (backup for legacy compatibility)
api.interceptors.request.use(
  (config) => {
    // Primary token source - used by new authService
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken')
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Simple error handler - token refresh is handled by authService
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Let authService handle authentication errors
    // This interceptor only handles non-auth errors
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      console.error('🚫 API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url
      })
    }
    return Promise.reject(error)
  }
)

export default api
