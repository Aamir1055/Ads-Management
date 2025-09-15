const moment = require('moment');

/**
 * Global Date Formatting Utilities
 * Standardizes all dates to dd/mm/yyyy format throughout the application
 */

class DateFormatUtils {
  /**
   * Format date to dd/mm/yyyy format
   * @param {Date|string|number} date - Input date
   * @returns {string} Formatted date string in dd/mm/yyyy format
   */
  static formatToDDMMYYYY(date) {
    if (!date) return '';
    
    try {
      // Handle various input formats
      let momentDate;
      
      if (moment.isMoment(date)) {
        momentDate = date;
      } else if (typeof date === 'string') {
        // Try to parse different string formats
        momentDate = moment(date, [
          'DD/MM/YYYY',
          'YYYY-MM-DD',
          'MM/DD/YYYY',
          'DD/MM/YYYY HH:mm:ss',
          'YYYY-MM-DD HH:mm:ss',
          'MM/DD/YYYY HH:mm:ss',
          moment.ISO_8601
        ], true); // strict parsing
      } else {
        momentDate = moment(date);
      }
      
      if (!momentDate.isValid()) {
        console.warn('Invalid date provided:', date);
        return '';
      }
      
      return momentDate.format('DD/MM/YYYY');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  /**
   * Format date with time to dd/mm/yyyy HH:mm format
   * @param {Date|string|number} date - Input date
   * @returns {string} Formatted datetime string
   */
  static formatToDDMMYYYYWithTime(date) {
    if (!date) return '';
    
    try {
      let momentDate;
      
      if (moment.isMoment(date)) {
        momentDate = date;
      } else if (typeof date === 'string') {
        momentDate = moment(date, [
          'DD/MM/YYYY',
          'YYYY-MM-DD',
          'MM/DD/YYYY',
          'DD/MM/YYYY HH:mm:ss',
          'YYYY-MM-DD HH:mm:ss',
          'MM/DD/YYYY HH:mm:ss',
          moment.ISO_8601
        ], true); // strict parsing
      } else {
        momentDate = moment(date);
      }
      
      if (!momentDate.isValid()) {
        console.warn('Invalid date provided:', date);
        return '';
      }
      
      return momentDate.format('DD/MM/YYYY HH:mm');
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return '';
    }
  }

  /**
   * Parse dd/mm/yyyy format to Date object
   * @param {string} dateString - Date string in dd/mm/yyyy format
   * @returns {Date|null} Parsed Date object or null if invalid
   */
  static parseFromDDMMYYYY(dateString) {
    if (!dateString) return null;
    
    try {
      const momentDate = moment(dateString, 'DD/MM/YYYY', true);
      return momentDate.isValid() ? momentDate.toDate() : null;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }

  /**
   * Parse dd/mm/yyyy hh:mm format to Date object
   * @param {string} dateString - DateTime string in dd/mm/yyyy hh:mm format
   * @returns {Date|null} Parsed Date object or null if invalid
   */
  static parseFromDDMMYYYYWithTime(dateString) {
    if (!dateString) return null;
    
    try {
      const momentDate = moment(dateString, 'DD/MM/YYYY HH:mm', true);
      return momentDate.isValid() ? momentDate.toDate() : null;
    } catch (error) {
      console.error('Error parsing datetime:', error);
      return null;
    }
  }

  /**
   * Convert any date format to MySQL date format (YYYY-MM-DD)
   * @param {Date|string|number} date - Input date
   * @returns {string} MySQL formatted date string
   */
  static formatForDatabase(date) {
    if (!date) return null;
    
    try {
      let momentDate;
      
      if (moment.isMoment(date)) {
        momentDate = date;
      } else if (typeof date === 'string') {
        // Handle dd/mm/yyyy format specifically
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
          momentDate = moment(date, 'DD/MM/YYYY', true);
        } else {
          momentDate = moment(date);
        }
      } else {
        momentDate = moment(date);
      }
      
      if (!momentDate.isValid()) {
        console.warn('Invalid date for database formatting:', date);
        return null;
      }
      
      return momentDate.format('YYYY-MM-DD');
    } catch (error) {
      console.error('Error formatting date for database:', error);
      return null;
    }
  }

  /**
   * Convert any datetime format to MySQL datetime format (YYYY-MM-DD HH:mm:ss)
   * @param {Date|string|number} date - Input date
   * @returns {string} MySQL formatted datetime string
   */
  static formatDateTimeForDatabase(date) {
    if (!date) return null;
    
    try {
      let momentDate;
      
      if (moment.isMoment(date)) {
        momentDate = date;
      } else if (typeof date === 'string') {
        // Handle dd/mm/yyyy hh:mm format specifically
        if (/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(date)) {
          momentDate = moment(date, 'DD/MM/YYYY HH:mm', true);
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
          momentDate = moment(date, 'DD/MM/YYYY', true);
        } else {
          momentDate = moment(date);
        }
      } else {
        momentDate = moment(date);
      }
      
      if (!momentDate.isValid()) {
        console.warn('Invalid date for database formatting:', date);
        return null;
      }
      
      return momentDate.format('YYYY-MM-DD HH:mm:ss');
    } catch (error) {
      console.error('Error formatting datetime for database:', error);
      return null;
    }
  }

  /**
   * Check if a date string is in dd/mm/yyyy format
   * @param {string} dateString - Date string to validate
   * @returns {boolean} True if valid dd/mm/yyyy format
   */
  static isValidDDMMYYYY(dateString) {
    if (!dateString || typeof dateString !== 'string') return false;
    
    try {
      const momentDate = moment(dateString, 'DD/MM/YYYY', true);
      return momentDate.isValid();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current date in dd/mm/yyyy format
   * @returns {string} Today's date in dd/mm/yyyy format
   */
  static today() {
    return moment().format('DD/MM/YYYY');
  }

  /**
   * Get current datetime in dd/mm/yyyy hh:mm format
   * @returns {string} Current datetime in dd/mm/yyyy hh:mm format
   */
  static now() {
    return moment().format('DD/MM/YYYY HH:mm');
  }

  /**
   * Add days to a date and return in dd/mm/yyyy format
   * @param {Date|string} date - Base date
   * @param {number} days - Number of days to add
   * @returns {string} New date in dd/mm/yyyy format
   */
  static addDays(date, days) {
    if (!date) return '';
    
    try {
      let momentDate = moment.isMoment(date) ? date : moment(date);
      if (!momentDate.isValid()) return '';
      
      return momentDate.add(days, 'days').format('DD/MM/YYYY');
    } catch (error) {
      console.error('Error adding days to date:', error);
      return '';
    }
  }

  /**
   * Subtract days from a date and return in dd/mm/yyyy format
   * @param {Date|string} date - Base date
   * @param {number} days - Number of days to subtract
   * @returns {string} New date in dd/mm/yyyy format
   */
  static subtractDays(date, days) {
    if (!date) return '';
    
    try {
      let momentDate = moment.isMoment(date) ? date : moment(date);
      if (!momentDate.isValid()) return '';
      
      return momentDate.subtract(days, 'days').format('DD/MM/YYYY');
    } catch (error) {
      console.error('Error subtracting days from date:', error);
      return '';
    }
  }

  /**
   * Format a date range for display
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {string} Formatted date range
   */
  static formatDateRange(startDate, endDate) {
    const start = this.formatToDDMMYYYY(startDate);
    const end = this.formatToDDMMYYYY(endDate);
    
    if (!start && !end) return '';
    if (!start) return `Until ${end}`;
    if (!end) return `From ${start}`;
    
    return `${start} - ${end}`;
  }
}

module.exports = DateFormatUtils;
