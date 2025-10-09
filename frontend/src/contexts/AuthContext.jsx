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
  const [initialized, setInitialized] = useState(false)

  // Check for existing authentication on app load
  useEffect(() => {
    console.log('🔍 AuthContext: useEffect triggered, initialized:', initialized);
    console.log('🔍 AuthContext: Current URL:', window.location.href);
    if (initialized) {
      console.log('🔍 AuthContext: Already initialized, skipping...')
      return
    }
    
    const initAuth = () => {
      try {
        console.log('🔍 AuthContext: Initializing authentication...')
        setInitialized(true)
        
        const isAuth = authService.isAuthenticated()
        const storedUser = authService.getStoredUser()
        const storedToken = authService.getAccessToken()
        
        console.log('🔍 AuthContext Init Check:')
        console.log('  - isAuth:', isAuth)
        console.log('  - hasStoredUser:', !!storedUser)
        console.log('  - hasStoredToken:', !!storedToken)
        console.log('  - storedUserData:', storedUser)
        console.log('  - tokenLength:', storedToken?.length || 0)
        console.log('  - storedToken preview:', storedToken?.substring(0, 50) + '...')
        
        // Use authService to check authentication
        if (isAuth && storedToken && storedUser) {
          console.log('✅ AuthContext: Setting user and token state...')
          setToken(storedToken)
          setUser(storedUser)
          
          // Verify state was set
          console.log('✅ AuthContext: State set - User:', storedUser.username, 'Token length:', storedToken.length)
          
          console.log('✅ AuthContext: User authenticated from stored tokens')
        } else {
          console.log('⚠️ AuthContext: Auth failed - clearing states')
          console.log('  - isAuth:', isAuth, 'hasToken:', !!storedToken, 'hasUser:', !!storedUser)
          authService.clearAuthData()
          setUser(null)
          setToken(null)
        }
      } catch (error) {
        console.error('🚫 AuthContext: Error loading auth from localStorage:', error)
        // Clear invalid data
        authService.clearAuthData()
        setUser(null)
        setToken(null)
      } finally {
        console.log('🔍 AuthContext: Init complete, setting loading to false')
        setLoading(false)
      }
    }
    
    initAuth()
  }, [])

  const login = (userData, authToken, refreshToken) => {
    console.log('🔐 AuthContext login called:', { 
      hasUser: !!userData, 
      hasToken: !!authToken, 
      hasRefresh: !!refreshToken,
      userData: userData,
      tokenLength: authToken?.length || 0
    })
    
    // Validate input
    if (!userData || !authToken) {
      console.error('🚫 AuthContext: Invalid login data provided')
      return
    }
    
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
    
    // Remove old token formats if they exist
    localStorage.removeItem('authToken')
    
    console.log('✅ AuthContext login completed - User set:', !!user, 'Token set:', !!token)
    
    // Verify the data was stored correctly
    const verifyAuth = authService.isAuthenticated()
    console.log('🔍 AuthContext: Post-login auth check:', verifyAuth)
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
    
    // Debug logging
    const accessToken = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')
    
    console.log('🔍 Authentication Check:', {
      serviceAuth,
      stateAuth,
      hasUser: !!user,
      hasToken: !!token,
      hasAccessToken: !!accessToken,
      hasStoredUser: !!storedUser,
      accessTokenLength: accessToken?.length || 0,
      storedUserLength: storedUser?.length || 0
    })
    
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
