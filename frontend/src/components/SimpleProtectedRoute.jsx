import React from 'react'
import { Navigate } from 'react-router-dom'

const SimpleProtectedRoute = ({ children }) => {
  // Simple localStorage check - avoid complex hooks that might cause loops
  const hasToken = localStorage.getItem('access_token')
  const hasUser = localStorage.getItem('user')
  
  console.log('🚪 SimpleProtectedRoute: Checking auth...', {
    hasToken: !!hasToken,
    hasUser: !!hasUser,
    currentPath: window.location.pathname
  })
  
  // If not authenticated, redirect to login
  if (!hasToken || !hasUser) {
    console.log('🚨 SimpleProtectedRoute: Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }
  
  // If authenticated, render the protected content
  console.log('✅ SimpleProtectedRoute: User authenticated, rendering protected content')
  return children
}

export default SimpleProtectedRoute