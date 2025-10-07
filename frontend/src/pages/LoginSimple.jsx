import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Target } from 'lucide-react'
import config from '../config/config'

const LoginSimple = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault() // CRITICAL: Prevent form refresh
    setLoading(true)
    setError('')

    console.log('🚀 Login form submitted with:', {
      username: formData.username,
      password: formData.password ? '[REDACTED]' : 'empty',
      timestamp: new Date().toISOString()
    })

    try {
      // Step 1: Try backend API first
      
      const response = await fetch(`${config.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      })

      console.log('📡 API Response:', {
        status: response.status,
        ok: response.ok,
        url: response.url
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ API Success:', data)
        
        // Store tokens consistently
        if (data.data?.access_token) {
          localStorage.setItem('access_token', data.data.access_token)
          localStorage.setItem('authToken', data.data.access_token) // Backup key
        }
        
        if (data.data?.refresh_token) {
          localStorage.setItem('refresh_token', data.data.refresh_token)
        }
        
        if (data.data?.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user))
        }
        console.log('🏠 Navigating to dashboard...')
        navigate('/dashboard')
        return
        
      } else {
        const errorData = await response.json()
        console.log('❌ API Error:', errorData)
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
    } catch (apiError) {
      console.log('🔄 API failed, trying demo mode:', apiError.message)
      
      // Step 2: Fallback - try again with correct endpoint or credentials
      if (formData.username === 'admin' && formData.password === 'password') {
        setError('API connection failed but credentials look correct. Check if backend is running.')
        return
      }
      
      // Step 3: Show error if neither worked
      const errorMessage = apiError.message || 'Login failed'
      setError(`${errorMessage}. Try: admin / password`)
      console.error('❌ Login failed completely:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setError('') // Clear error when user types
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Target className="h-10 w-10 text-purple-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-purple-100">
            Sign in to your Ads Reporter account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your username"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Demo Credentials:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Username:</strong> admin</div>
              <div><strong>Password:</strong> password</div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Ads Reporter © 2025 - Secure Login System
            </p>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default LoginSimple
