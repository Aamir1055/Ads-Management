import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContextFixed'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, token, loading, initialized, isAuthenticated, hasRole } = useAuth()
  const location = useLocation()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  console.log('🔐 ProtectedRoute render:', {
    path: location.pathname,
    loading,
    initialized,
    isAuthenticated: isAuthenticated(),
    user: user ? { id: user.id, username: user.username } : null,
    token: token ? 'EXISTS' : 'MISSING',
    requiredRole,
    shouldRedirect
  })

  useEffect(() => {
    // Only make redirect decision after auth is fully initialized
    if (!loading && initialized) {
      const authenticated = isAuthenticated()
      
      if (!authenticated) {
        console.log('❌ ProtectedRoute: Not authenticated, will redirect to login')
        setShouldRedirect(true)
        return
      }

      // Check role requirements
      if (requiredRole && !hasRole(requiredRole)) {
        console.log('❌ ProtectedRoute: Missing required role:', requiredRole)
        setShouldRedirect(true)
        return
      }

      console.log('✅ ProtectedRoute: Authentication check passed')
      setShouldRedirect(false)
    }
  }, [loading, initialized, isAuthenticated, hasRole, requiredRole])

  // Show loading spinner while auth is being determined
  if (loading || !initialized) {
    console.log('⏳ ProtectedRoute: Waiting for auth initialization...')
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-lg text-gray-600">Loading...</span>
      </div>
    )
  }

  // Redirect to login if authentication failed
  if (shouldRedirect) {
    console.log('🚨 ProtectedRoute: Redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Render protected content
  console.log('✅ ProtectedRoute: Rendering protected content')
  return children
}

export default ProtectedRoute
