// FIXED: Centralized configuration management
const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  
  // Token Management - Standardized
  TOKEN_KEY: 'access_token',
  
  // Debug mode
  DEBUG: import.meta.env.DEV,
  
  // Environment
  ENVIRONMENT: import.meta.env.MODE || 'development',
  
  // API Timeout
  API_TIMEOUT: 10000,
  
  // Auto-close message timeout
  MESSAGE_TIMEOUT: 5000
}

export default config
