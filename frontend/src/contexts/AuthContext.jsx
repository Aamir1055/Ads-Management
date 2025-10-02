import React, { createContext, useState, useContext, useEffect } from 'react'
import authService from '../services/authService'

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
        // Use authService to check authentication
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser()
          const storedToken = authService.getAccessToken()
          
          if (storedToken && storedUser) {
            setToken(storedToken)
            setUser(storedUser)
            
            // Check if token needs refresh
            authService.checkAndRefreshToken()
            
            console.log('✅ User authenticated from stored tokens')
          } else {
            console.log('⚠️ Invalid stored auth data, clearing...')
            authService.clearAuthData()
          }
        } else {
          console.log('❤️ No valid authentication found')
          // Don't aggressively clear data - let the user try to login
          // authService.clearAuthData()
        }
      } catch (error) {
        console.error('Error loading auth from localStorage:', error)
        // Clear invalid data
        authService.clearAuthData()
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
  }, [])

  const login = (userData, authToken, refreshToken) => {
    console.log('🔐 AuthContext login called:', { 
      hasUser: !!userData, 
      hasToken: !!authToken, 
      hasRefresh: !!refreshToken 
    })
    
    // Set local state immediately
    setUser(userData)
    setToken(authToken)
    
    // Use authService to set auth data properly
    if (refreshToken) {
      authService.setAuthData(authToken, refreshToken, userData)
    } else {
      // Fallback for backward compatibility
      localStorage.setItem('access_token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
    }
    
    // Check token expiration
    authService.checkAndRefreshToken()
    
    // Remove old token formats if they exist
    localStorage.removeItem('authToken')
    
    console.log('✅ AuthContext login completed')
  }

  const logout = async () => {
    setUser(null)
    setToken(null)
    
    // Use authService for proper logout
    try {
      await authService.logout()
    } catch (error) {
      console.error('Error during logout:', error)
      // Even if logout fails, clear local state
      authService.clearAuthData()
    }
  }

  const isAuthenticated = () => {
    // Primary check: use authService which checks localStorage
    const serviceAuth = authService.isAuthenticated()
    
    // Secondary check: local state (for immediate UI updates)
    const stateAuth = !!(user && token)
    
    // Return true if either check passes (allows for immediate UI updates after login)
    const result = serviceAuth || stateAuth
    
    if (!result && serviceAuth !== stateAuth) {
      console.log('🔍 Auth state mismatch:', { serviceAuth, stateAuth, hasUser: !!user, hasToken: !!token })
    }
    
    return result
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
    
    // FIXED: Be restrictive by default if no permission system available
    return false
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
