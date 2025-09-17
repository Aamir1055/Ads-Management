import React from 'react'
import { AlertCircle, X } from 'lucide-react'

const ErrorAlert = ({ 
  error, 
  onDismiss, 
  className = '',
  dismissible = true,
  variant = 'error' // 'error', 'warning', 'info'
}) => {
  if (!error) return null

  const variantClasses = {
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-400',
      title: 'text-red-800',
      text: 'text-red-700'
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-400',
      title: 'text-amber-800',
      text: 'text-amber-700'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-400',
      title: 'text-blue-800',
      text: 'text-blue-700'
    }
  }

  const styles = variantClasses[variant]
  
  // Handle different error formats
  let errorMessage = ''
  let errorTitle = variant === 'error' ? 'Error' : variant === 'warning' ? 'Warning' : 'Information'
  
  if (typeof error === 'string') {
    errorMessage = error
  } else if (error?.message) {
    errorMessage = error.message
  } else if (error?.response?.data?.message) {
    errorMessage = error.response.data.message
  } else {
    errorMessage = 'An unexpected error occurred'
  }

  // Special handling for permission denied errors
  if (errorMessage.toLowerCase().includes('permission denied') || 
      errorMessage.toLowerCase().includes('access denied') ||
      errorMessage.toLowerCase().includes('unauthorized') ||
      errorMessage.toLowerCase().includes('forbidden')) {
    errorTitle = 'Access Denied'
  }

  return (
    <div className={`rounded-md border p-4 ${styles.container} ${className}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className={`h-5 w-5 ${styles.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${styles.title}`}>
            {errorTitle}
          </h3>
          <div className={`mt-1 text-sm ${styles.text}`}>
            {errorMessage}
          </div>
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600 ${styles.icon} hover:bg-red-100`}
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorAlert
