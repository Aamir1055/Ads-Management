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
        const storedToken = localStorage.getItem('authToken')
        const storedUser = localStorage.getItem('user')
        
        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('Error loading auth from localStorage:', error)
        // Clear invalid data
        localStorage.removeItem('authToken')
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
    localStorage.setItem('authToken', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
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
    // This would need to be implemented based on your permission system
    // For now, return true for authenticated users
    return isAuthenticated()
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
