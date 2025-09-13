import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Target, Shield, ShieldCheck } from 'lucide-react'
import { twoFactorApi } from '../utils/api'

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    twofa_code: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [currentStep, setCurrentStep] = useState('credentials') // 'credentials' or '2fa'
  const [userId, setUserId] = useState(null) // Store user_id for 2FA step
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Login attempt:', { username: formData.username, step: currentStep })

    try {
      if (currentStep === 'credentials') {
        // First step - check username and password
        
        // Development mode - simple authentication (DISABLED for debugging)
        if (false && import.meta.env.MODE === 'development') {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Simple demo authentication
          if (formData.username === 'admin' && formData.password === 'password') {
            // Simulate 2FA requirement
            if (formData.username === 'admin') {
              setRequires2FA(true)
              setCurrentStep('2fa')
              return
            } else {
              // Login successful without 2FA
              localStorage.setItem('authToken', 'demo-token-' + Date.now())
              localStorage.setItem('user', JSON.stringify({ 
                id: 1, 
                username: formData.username, 
                role_id: 1 
              }))
              navigate('/dashboard')
            return
            }
          } else {
            setError('Invalid username or password (Demo: admin/password)')
            return
          }
        }
        
        // Production mode - real API call
        console.log('Making API call to backend...')
        try {
          const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: formData.username,
              password: formData.password
            })
          })

          console.log('API response status:', response.status)
          console.log('API response ok:', response.ok)
          
          const data = await response.json()
          console.log('API response data:', data)

          if (data.success) {
            // Check if user requires 2FA
            if (data.data.requires_2fa) {
              setRequires2FA(true)
              setUserId(data.data.user.id) // Store user_id for 2FA step
              setCurrentStep('2fa')
              console.log('2FA required for user:', data.data.user.username)
            } else {
              // Login successful without 2FA
              console.log('Login successful, storing token and navigating...')
              // Store with consistent token key - fix: use access_token from API
              localStorage.setItem('access_token', data.data.access_token)
              localStorage.setItem('authToken', data.data.access_token)
              localStorage.setItem('user', JSON.stringify(data.data.user))
              navigate('/dashboard')
            }
          } else {
            setError(data.message || 'Invalid username or password')
          }
        } catch (apiError) {
          console.warn('API not available, using demo mode')
          // Fallback to demo authentication if API is not available
          if (formData.username === 'admin' && formData.password === 'password') {
            const token = 'demo-token-' + Date.now()
            localStorage.setItem('access_token', token)
            localStorage.setItem('authToken', token)
            localStorage.setItem('user', JSON.stringify({ 
              id: 1, 
              username: formData.username, 
              role_id: 1 
            }))
            navigate('/dashboard')
          } else {
            setError('API unavailable. Use demo credentials: admin/password')
          }
        }
        
      } else if (currentStep === '2fa') {
        // Second step - verify 2FA code
        
        // Development mode - simple 2FA (DISABLED for debugging)
        if (false && import.meta.env.MODE === 'development') {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Demo 2FA code is '123456'
          if (formData.twofa_code === '123456') {
            const token = 'demo-token-2fa-' + Date.now()
            localStorage.setItem('access_token', token)
            localStorage.setItem('authToken', token)
            localStorage.setItem('user', JSON.stringify({ 
              id: 1, 
              username: formData.username, 
              role_id: 1,
              has_2fa: true 
            }))
            navigate('/dashboard')
            return
          } else {
            setError('Invalid 2FA code (Demo: 123456)')
            setFormData({ ...formData, twofa_code: '' })
            return
          }
        }
        
        // Production mode - real API call for 2FA using auth controller
        try {
          console.log('Making 2FA API call with user ID:', userId, 'token:', formData.twofa_code)
          
          const response = await fetch('http://localhost:5000/api/auth/login-2fa', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId,
              token: formData.twofa_code
            })
          })
          
          const data = await response.json()
          console.log('2FA API response:', data)

          if (data.success) {
            const { access_token, user } = data.data
            
            // Store tokens with consistent keys
            localStorage.setItem('access_token', access_token)
            localStorage.setItem('authToken', access_token)
            localStorage.setItem('user', JSON.stringify(user))
            
            console.log('2FA verification successful, navigating to dashboard')
            navigate('/dashboard')
          } else {
            const errorMsg = data.message || 'Invalid 2FA code'
            console.error('2FA verification failed:', errorMsg)
            setError(errorMsg)
            setFormData({ ...formData, twofa_code: '' })
          }
        } catch (apiError) {
          console.warn('API not available, using demo 2FA')
          // Fallback to demo 2FA
          if (formData.twofa_code === '123456') {
            const token = 'demo-token-2fa-' + Date.now()
            localStorage.setItem('access_token', token)
            localStorage.setItem('authToken', token)
            localStorage.setItem('user', JSON.stringify({
              id: 1, 
              username: formData.username, 
              role_id: 1,
              has_2fa: true 
            }))
            navigate('/dashboard')
          } else {
            setError('API unavailable. Demo 2FA code: 123456')
            setFormData({ ...formData, twofa_code: '' })
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setError('')
  }

  const handleBackToCredentials = () => {
    setCurrentStep('credentials')
    setRequires2FA(false)
    setUserId(null) // Clear stored user_id
    setFormData({ ...formData, twofa_code: '' })
    setError('')
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
            {currentStep === 'credentials' 
              ? 'Sign in to your Ads Reporter account' 
              : 'Enter your 2FA code to complete login'
            }
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 'credentials' ? (
              <>
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
              </>
            ) : (
              /* 2FA Step */
              <div>
                <div className="text-center mb-4">
                  <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <ShieldCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Please enter the 6-digit code from your authenticator app
                  </p>
                </div>
                
                <label htmlFor="twofa_code" className="block text-sm font-medium text-gray-700 mb-1">
                  2FA Code
                </label>
                <input
                  id="twofa_code"
                  name="twofa_code"
                  type="text"
                  required
                  maxLength="6"
                  value={formData.twofa_code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').substring(0, 6)
                    setFormData({ ...formData, twofa_code: value })
                    setError('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg tracking-widest"
                  placeholder="000000"
                />
                
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="mt-3 text-sm text-purple-600 hover:text-purple-800"
                >
                  ← Back to login
                </button>
              </div>
            )}

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
                currentStep === 'credentials' ? 'Sign In' : 'Verify & Continue'
              )}
            </button>
          </form>

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

export default Login
