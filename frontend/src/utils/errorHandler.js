import toast from 'react-hot-toast';

/**
 * Standardized error handler for API responses
 * @param {Error} error - The error object from axios
 * @param {string} defaultMessage - Default message if no specific error is found
 * @param {string} action - The action being performed (e.g., 'update', 'delete', 'create')
 * @param {string} resource - The resource being acted upon (e.g., 'Facebook account', 'campaign')
 */
export const handleApiError = (error, defaultMessage = 'An error occurred', action = '', resource = '') => {
  console.error('API Error:', error);

  // Handle specific HTTP status codes
  if (error.response?.status === 403) {
    const actionText = action ? ` ${action}` : '';
    const resourceText = resource ? ` ${resource}` : '';
    const message = `You don't have permission to${actionText}${resourceText}. Please contact your administrator.`;
    toast.error(message);
    return;
  }

  if (error.response?.status === 401) {
    toast.error('Your session has expired. Please refresh the page and try again.');
    return;
  }

  if (error.response?.status === 404) {
    const resourceText = resource ? ` ${resource}` : ' resource';
    toast.error(`The${resourceText} was not found. It may have been deleted.`);
    return;
  }

  if (error.response?.status === 422) {
    toast.error('Please check your input data and try again.');
    return;
  }

  if (error.response?.status === 500) {
    toast.error('Server error occurred. Please try again later or contact support.');
    return;
  }

  // Handle network errors
  if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
    toast.error('Unable to connect to server. Please check your internet connection.');
    return;
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED') {
    toast.error('Request timed out. Please try again.');
    return;
  }

  // Use backend error message if available, otherwise use default
  const errorMessage = error.response?.data?.message || defaultMessage;
  toast.error(errorMessage);
};

/**
 * Handle validation errors from backend
 * @param {Array} errors - Array of validation errors from backend
 * @param {Function} setErrors - Function to set form errors
 */
export const handleValidationErrors = (errors, setErrors) => {
  if (errors && Array.isArray(errors)) {
    const formErrors = {};
    errors.forEach(err => {
      formErrors[err.path || err.param || err.field] = err.msg || err.message;
    });
    setErrors(formErrors);
    toast.error('Please fix the validation errors');
    return true;
  }
  return false;
};

/**
 * Show success message for API operations
 * @param {string} message - Success message
 * @param {string} action - The action performed (e.g., 'created', 'updated', 'deleted')
 * @param {string} resource - The resource acted upon (e.g., 'Facebook account', 'campaign')
 */
export const showSuccessMessage = (message, action = '', resource = '') => {
  if (message) {
    toast.success(message);
  } else {
    const actionText = action ? ` ${action}` : '';
    const resourceText = resource ? `${resource} ` : '';
    toast.success(`${resourceText}${actionText} successfully!`);
  }
};

export default {
  handleApiError,
  handleValidationErrors,
  showSuccessMessage
};