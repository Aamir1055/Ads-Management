import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check for access_token first, then fall back to authToken for compatibility
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔑 Using token from services/api.js:', token.substring(0, 20) + '...')
    } else {
      console.log('⚠️ No token found in services/api.js')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear all token types
      localStorage.removeItem('access_token')
      localStorage.removeItem('authToken')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else if (error.response?.status === 403 && error.response?.data?.message?.includes('malformed')) {
      // Malformed token - clear everything and redirect
      localStorage.removeItem('access_token')
      localStorage.removeItem('authToken')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      console.log('🧹 Malformed token detected, clearing storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
