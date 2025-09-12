import React, { useState, useEffect } from 'react'
import { twoFactorApi } from '../utils/api'
import { Check, X, RefreshCw, Smartphone, AlertCircle } from 'lucide-react'

const TwoFactorAuth = ({ userId, username, onVerified, onCancel, isNewUser = false }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState('setup') // setup, verify, complete
  const [tempKey, setTempKey] = useState('') // For temporary 2FA setups
  const [isTemporary, setIsTemporary] = useState(false)

  useEffect(() => {
    if (username) {
      setupTwoFactor()
    }
  }, [userId, username, isNewUser])

  const setupTwoFactor = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      console.log('Setting up 2FA for username:', username, 'isNewUser:', isNewUser)
      
      // For new users or when userId is not a real ID, use temporary setup
      const useTemporary = isNewUser || !userId || userId === 'new' || typeof userId === 'string'
      
      const response = await twoFactorApi.setup(username, useTemporary)
      
      if (response.data && response.data.success) {
        const { qr_code, secret, message, temp_key, temporary } = response.data.data
        
        setQrCodeUrl(qr_code)
        setSecret(secret)
        setStep('verify')
        
        // Handle temporary setup
        if (temporary && temp_key) {
          setTempKey(temp_key)
          setIsTemporary(true)
          console.log('Temporary 2FA setup created with key:', temp_key)
        } else {
          setIsTemporary(false)
        }
        
        if (message) {
          setSuccess(message)
        }
      } else {
        throw new Error(response.data?.message || 'Failed to setup 2FA')
      }
      
    } catch (err) {
      console.error('Error setting up 2FA:', err)
      const errorMessage = err.userMessage || err.response?.data?.message || 'Failed to generate QR code. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      let response;
      
      if (isTemporary && tempKey) {
        // For temporary/new user verification
        console.log('Verifying temporary 2FA with key:', tempKey, 'and token:', verificationCode)
        response = await twoFactorApi.verifyTemporary(tempKey, verificationCode)
      } else {
        // For existing user verification
        if (!userId) {
          setError('User ID is required for verification')
          return
        }
        console.log('Verifying 2FA setup for user ID:', userId, 'with token:', verificationCode)
        response = await twoFactorApi.verifySetup(userId, verificationCode)
      }
      
      if (response.data && response.data.success) {
        const { message } = response.data
        
        setSuccess(message || '2FA has been successfully verified!')
        setStep('complete')
        
        // For temporary setup, we need to pass the temp_key and secret to the parent
        // so they can be used when creating the actual user
        const verificationData = {
          success: true,
          secret: secret,
          message: message || '2FA verified successfully'
        }
        
        if (isTemporary && tempKey) {
          verificationData.tempKey = tempKey
          verificationData.isTemporary = true
        }
        
        // Call the onVerified callback with success data
        setTimeout(() => {
          onVerified(verificationData)
        }, 2000)
        
      } else {
        throw new Error(response.data?.message || 'Verification failed')
      }
      
    } catch (err) {
      console.error('Error verifying 2FA:', err)
      const errorMessage = err.userMessage || err.response?.data?.message || 'Invalid verification code. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateQR = () => {
    setStep('setup')
    setVerificationCode('')
    setError('')
    setSuccess('')
    setQrCodeUrl('')
    setSecret('')
    setupTwoFactor()
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="text-center">
        <div className="mb-4">
          <Smartphone className="h-12 w-12 text-primary-500 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-gray-900">
            Set up Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Scan the QR code with Google Authenticator or similar app
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
            <span className="ml-2 text-gray-600">
              {step === 'setup' ? 'Generating QR code...' : 
               step === 'verify' ? 'Verifying code...' : 
               'Processing...'}
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
            <Check className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* QR Code Display Step */}
        {!loading && qrCodeUrl && step === 'verify' && (
          <>
            <div className="mb-6">
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600 mb-1">Manual entry key (if QR code doesn't work):</p>
              <code className="text-sm font-mono text-gray-800 break-all">{secret}</code>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter the 6-digit code from your authenticator app:
              </label>
              <input
                type="text"
                maxLength="6"
                className="input-field text-center text-lg tracking-widest font-mono"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  if (value.length <= 6) {
                    setVerificationCode(value)
                    setError('')
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && verificationCode.length === 6) {
                    handleVerifyCode()
                  }
                }}
                disabled={loading}
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleRegenerateQR}
                disabled={loading}
                className="text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate new QR code
              </button>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verificationCode.length !== 6 || loading}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Verify & Enable
                </button>
              </div>
            </div>
          </>
        )}

        {/* Success/Completion Step */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="mb-6">
              <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-gray-900 mb-2">
                Two-Factor Authentication Enabled!
              </h4>
              <p className="text-gray-600">
                Your account is now protected with two-factor authentication.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Save your backup codes in a safe place. 
                They can be used to access your account if you lose access to your authenticator app.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => onVerified({ success: true, secret: secret })}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TwoFactorAuth
