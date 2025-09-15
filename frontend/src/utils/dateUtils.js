/**
 * Date formatting utilities
 * Consistent dd/mm/yyyy date formatting across the application
 */

/**
 * Parse various date formats and return a Date object
 * @param {string|Date} date - Input date
 * @returns {Date|null} Parsed Date object or null if invalid
 */
const parseDate = (date) => {
  if (!date) return null;
  
  if (date instanceof Date) return date;
  
  if (typeof date === 'string') {
    // Handle dd/mm/yyyy format specifically
    const ddmmyyyyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = date.match(ddmmyyyyPattern);
    
    if (match) {
      const [, day, month, year] = match;
      // JavaScript Date constructor expects mm/dd/yyyy, so we need to rearrange
      const dateObj = new Date(year, month - 1, day);
      return isNaN(dateObj.getTime()) ? null : dateObj;
    }
    
    // Try parsing as ISO string or other standard formats
    const dateObj = new Date(date);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }
  
  return null;
};

/**
 * Format a date for display in dd/mm/yyyy format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string in dd/mm/yyyy format
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = parseDate(date);
    
    if (!dateObj) return 'Invalid Date';
    
    // Format as dd/mm/yyyy
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a date and time for display in dd/mm/yyyy HH:mm format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = parseDate(date);
    
    if (!dateObj) return 'Invalid Date';
    
    // Format as dd/mm/yyyy HH:mm
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a date for input fields - converts from dd/mm/yyyy to yyyy-mm-dd format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string for HTML input fields (yyyy-mm-dd)
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = parseDate(date);
    
    if (!dateObj) return '';
    
    // Format as YYYY-MM-DD for HTML input fields
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Format a date for API requests - converts from dd/mm/yyyy to yyyy-mm-dd format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string for API (yyyy-mm-dd)
 */
export const formatDateForAPI = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = parseDate(date);
    
    if (!dateObj) return '';
    
    // Format as YYYY-MM-DD for API
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return '';
  }
};

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = parseDate(date);
    
    if (!dateObj) return 'Invalid Date';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
};

/**
 * Parse a date string from HTML input (yyyy-mm-dd) to dd/mm/yyyy format
 * @param {string} inputDate - Date string from HTML input
 * @returns {string} Date in dd/mm/yyyy format
 */
export const parseDateFromInput = (inputDate) => {
  if (!inputDate) return '';
  
  try {
    const [year, month, day] = inputDate.split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error parsing date from input:', error);
    return '';
  }
};

/**
 * Check if a date string is valid dd/mm/yyyy format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid dd/mm/yyyy format
 */
export const isValidDateFormat = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const ddmmyyyyPattern = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!ddmmyyyyPattern.test(dateString)) return false;
  
  const dateObj = parseDate(dateString);
  return dateObj !== null;
};

/**
 * Get current date in dd/mm/yyyy format
 * @returns {string} Today's date in dd/mm/yyyy format
 */
export const getCurrentDate = () => {
  return formatDate(new Date());
};

/**
 * Get current date and time in dd/mm/yyyy HH:mm format
 * @returns {string} Current datetime in dd/mm/yyyy HH:mm format
 */
export const getCurrentDateTime = () => {
  return formatDateTime(new Date());
};

/**
 * Add days to a date and return in dd/mm/yyyy format
 * @param {string|Date} date - Base date
 * @param {number} days - Number of days to add
 * @returns {string} New date in dd/mm/yyyy format
 */
export const addDays = (date, days) => {
  if (!date) return '';
  
  try {
    const dateObj = parseDate(date);
    if (!dateObj) return '';
    
    const newDate = new Date(dateObj);
    newDate.setDate(newDate.getDate() + days);
    
    return formatDate(newDate);
  } catch (error) {
    console.error('Error adding days to date:', error);
    return '';
  }
};

/**
 * Subtract days from a date and return in dd/mm/yyyy format
 * @param {string|Date} date - Base date
 * @param {number} days - Number of days to subtract
 * @returns {string} New date in dd/mm/yyyy format
 */
export const subtractDays = (date, days) => {
  return addDays(date, -days);
};

/**
 * Format a date range for display
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (start === 'N/A' && end === 'N/A') return 'N/A';
  if (start === 'N/A') return `Until ${end}`;
  if (end === 'N/A') return `From ${start}`;
  
  return `${start} - ${end}`;
};
