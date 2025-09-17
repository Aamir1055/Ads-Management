import React, { createContext, useState, useContext, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing authentication on app load
  useEffect(() => {
    const initAuth = () => {
      try {
        // Check for access_token first, then fall back to authToken
        const storedToken = localStorage.getItem('access_token') || localStorage.getItem('authToken')
        const storedUser = localStorage.getItem('user')
        
        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          
          // If we found an old authToken, migrate it to access_token
          if (localStorage.getItem('authToken') && !localStorage.getItem('access_token')) {
            console.log('Migrating authToken to access_token')
            localStorage.setItem('access_token', storedToken)
            localStorage.removeItem('authToken')
          }
        }
      } catch (error) {
        console.error('Error loading auth from localStorage:', error)
        // Clear invalid data
        localStorage.removeItem('authToken')
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
  }, [])

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    // Store as access_token for consistency
    localStorage.setItem('access_token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    // Remove old token format if it exists
    localStorage.removeItem('authToken')
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    // Clear all possible token formats
    localStorage.removeItem('access_token')
    localStorage.removeItem('authToken')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    
    // Optionally call logout endpoint
    try {
      api.post('/auth/logout')
    } catch (error) {
      console.error('Error calling logout endpoint:', error)
    }
  }

  const isAuthenticated = () => {
    return !!(user && token)
  }

  const hasRole = (roleName) => {
    return user?.role_name === roleName
  }

  const hasPermission = (permission) => {
    if (!isAuthenticated()) {
      return false
    }
    
    // Super admin has all permissions
    if (user?.role_name === 'super_admin' || user?.role?.name === 'super_admin') {
      return true
    }
    
    // Check user permissions array
    if (user?.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission)
    }
    
    // Check permissions object format
    if (user?.permissions && typeof user.permissions === 'object') {
      return Boolean(user.permissions[permission])
    }
    
    // For now, return true for authenticated users if no specific permission system
    return true
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    hasPermission
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
