/**
 * Access Denied Handler Utility
 * 
 * This utility provides a consistent way to handle 403/401 errors across the application.
 * It ensures a better user experience by:
 * 1. Closing any open forms/modals first
 * 2. Displaying a prominent, clear access denied message
 * 3. Providing helpful next steps for the user
 */

/**
 * Handles access denied errors with improved UX
 * @param {Object} options - Configuration options
 * @param {Function} options.closeForm - Function to close the current form/modal
 * @param {Function} options.setMessage - Function to set the error message
 * @param {Function} options.setError - Optional function to set error state
 * @param {Error} options.error - The error object received
 * @param {string} options.context - Context of where the error occurred (e.g., "creating user", "loading users")
 */
export const handleAccessDenied = ({
  closeForm,
  setMessage,
  setError,
  error,
  context = "performing this action"
}) => {
  console.error(`Access denied while ${context}:`, error);
  
  // Step 1: Close any open forms/modals immediately
  if (closeForm && typeof closeForm === 'function') {
    closeForm();
  }
  
  // Step 2: Extract error message
  const errorResponse = error?.response;
  const errorData = errorResponse?.data;
  let accessDeniedMessage = '';
  
  if (errorResponse?.status === 403) {
    // Handle 403 Forbidden
    accessDeniedMessage = errorData?.message || 'Access denied. You do not have permission to perform this action.';
  } else if (errorResponse?.status === 401) {
    // Handle 401 Unauthorized
    accessDeniedMessage = 'Authentication required. Please log in first.';
  } else {
    // Fallback for other access-related errors
    accessDeniedMessage = errorData?.message || error?.message || `Access denied while ${context}`;
  }
  
  // Step 3: Show the prominent error message after a brief delay to ensure form closes first
  setTimeout(() => {
    if (setMessage) {
      setMessage({ 
        type: 'error', 
        content: accessDeniedMessage,
        isAccessDenied: true // Flag to show this is an access denied error
      });
    }
    
    // Step 4: Set error state if provided
    if (setError) {
      setError(accessDeniedMessage);
    }
  }, 100); // 100ms delay to ensure form closing animation completes
  
  // Step 5: Optional - redirect to login after delay for 401 errors
  if (errorResponse?.status === 401) {
    setTimeout(() => {
      // Check if we should redirect to login
      const shouldRedirect = !localStorage.getItem('authToken') && !localStorage.getItem('access_token');
      if (shouldRedirect && window.location.pathname !== '/login') {
        console.log('No valid token found, redirecting to login...');
        // Uncomment the next line if you want automatic redirect
        // window.location.href = '/login';
      }
    }, 3000); // 3 second delay to let user read the message
  }
  
  return {
    isAccessDenied: true,
    status: errorResponse?.status,
    message: accessDeniedMessage
  };
};

/**
 * Creates a specialized access denied handler for a specific component
 * @param {Object} componentState - Component state handlers
 * @returns {Function} Specialized handler function
 */
export const createAccessDeniedHandler = (componentState) => {
  const {
    setShowModal,
    setSelectedItem,
    setMessage,
    setError,
    // Add any other state setters your component uses
    clearFormData
  } = componentState;
  
  return (error, context) => {
    // Create the closeForm function that handles all form closing logic
    const closeForm = () => {
      // Close modals
      if (setShowModal) {
        setShowModal(false);
      }
      
      // Clear selected items
      if (setSelectedItem) {
        setSelectedItem(null);
      }
      
      // Clear form data
      if (clearFormData) {
        clearFormData();
      }
      
      // Add any other cleanup your component needs
    };
    
    return handleAccessDenied({
      closeForm,
      setMessage,
      setError,
      error,
      context
    });
  };
};

/**
 * Checks if an error is an access denied error
 * @param {Error} error - The error to check
 * @returns {boolean} True if it's an access denied error
 */
export const isAccessDeniedError = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

/**
 * Enhanced error message component props for access denied errors
 * @param {Object} message - Message object from component state
 * @returns {Object} Enhanced props for error display component
 */
export const getAccessDeniedMessageProps = (message) => {
  if (!message || !message.isAccessDenied) {
    return message;
  }
  
  return {
    ...message,
    title: 'Access Denied',
    className: 'bg-red-100 border-2 border-red-300 shadow-lg', // More prominent styling
    autoClose: false, // Don't auto-close access denied messages
    actions: [
      {
        text: 'Go to Login',
        action: () => window.location.href = '/login',
        className: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'
      },
      {
        text: 'Refresh Page',
        action: () => window.location.reload(),
        className: 'bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700'
      }
    ]
  };
};

export default handleAccessDenied;
