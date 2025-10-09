import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user, token } = useAuth()
  
  console.log('🚪 ProtectedRoute: Checking authentication...', {
    loading,
    hasUser: !!user,
    hasToken: !!token,
    currentPath: window.location.pathname
  })
  
  // Show loading while checking authentication
  if (loading) {
    console.log('🔄 ProtectedRoute: Still loading, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Check authentication
  const authResult = isAuthenticated()
  console.log('🔍 ProtectedRoute: Authentication result:', authResult)
  
  // If not authenticated, redirect to login
  if (!authResult) {
    console.log('🚨 ProtectedRoute: Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }
  
  // If authenticated, render the protected content
  console.log('✅ ProtectedRoute: User authenticated, rendering protected content')
  return children
}

export default ProtectedRoute
