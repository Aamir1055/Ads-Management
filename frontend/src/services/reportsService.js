import api from './api';

const BASE_URL = '/reports';

const reportsService = {
  // ============================================================================
  // REPORT GENERATION AND SYNC
  // ============================================================================

  /**
   * Generate reports from campaign data without storing them
   * @param {Object} params - { dateFrom, dateTo, campaignId?, brandId? }
   */
  generateReports: async (params) => {
    try {
      const response = await api.post(`${BASE_URL}/generate`, params);
      return response.data;
    } catch (error) {
      console.error('Reports Service - Generate reports error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Sync generated reports to the reports table
   * @param {Object} params - { dateFrom, dateTo, campaignId?, brandId?, updateExisting? }
   */
  syncReports: async (params) => {
    try {
      const response = await api.post(`${BASE_URL}/sync`, params);
      return response.data;
    } catch (error) {
      console.error('Reports Service - Sync reports error:', error);
      throw error.response?.data || error;
    }
  },

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all reports with pagination and filters
   * @param {Object} params - Query parameters for filtering and pagination
   */
  getAllReports: async (params = {}) => {
    try {
      const response = await api.get(BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Reports Service - Get all reports error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get a specific report by ID
   * @param {number} id - Report ID
   */
  getReportById: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Reports Service - Get report by ID error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Create a new report manually
   * @param {Object} reportData - Report data to create
   */
  createReport: async (reportData) => {
    try {
      const response = await api.post(BASE_URL, reportData);
      return response.data;
    } catch (error) {
      console.error('Reports Service - Create report error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Update an existing report
   * @param {number} id - Report ID
   * @param {Object} reportData - Updated report data
   */
  updateReport: async (id, reportData) => {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, reportData);
      return response.data;
    } catch (error) {
      console.error('Reports Service - Update report error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a specific report
   * @param {number} id - Report ID
   */
  deleteReport: async (id) => {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Reports Service - Delete report error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete reports in a date range
   * @param {Object} params - { dateFrom, dateTo, campaignId?, brandId? }
   */
  deleteReportsInRange: async (params) => {
    try {
      const response = await api.delete(`${BASE_URL}/range`, { data: params });
      return response.data;
    } catch (error) {
      console.error('Reports Service - Delete reports in range error:', error);
      throw error.response?.data || error;
    }
  },

  // ============================================================================
  // ANALYTICS AND UTILITIES
  // ============================================================================

  /**
   * Get available filter options
   */
  getFilterOptions: async () => {
    try {
      const response = await api.get(`${BASE_URL}/filters`);
      return response.data;
    } catch (error) {
      console.error('Reports Service - Get filter options error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get report statistics
   * @param {Object} filters - Filter parameters
   */
  getReportStats: async (filters = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/stats`, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Reports Service - Get report stats error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get dashboard statistics
   * @param {Object} filters - Filter parameters
   */
  getDashboardStats: async (filters = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/dashboard`, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Reports Service - Get dashboard stats error:', error);
      throw error.response?.data || error;
    }
  },

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Format date for API requests (YYYY-MM-DD)
   * @param {Date|string} date 
   */
  formatDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },

  /**
   * Get date range for common periods
   * @param {string} period - 'today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth'
   */
  getDateRange: (period) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    switch (period) {
      case 'today':
        return {
          dateFrom: reportsService.formatDate(today),
          dateTo: reportsService.formatDate(today)
        };

      case 'yesterday':
        return {
          dateFrom: reportsService.formatDate(yesterday),
          dateTo: reportsService.formatDate(yesterday)
        };

      case 'last7days':
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        return {
          dateFrom: reportsService.formatDate(last7Days),
          dateTo: reportsService.formatDate(yesterday)
        };

      case 'last30days':
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        return {
          dateFrom: reportsService.formatDate(last30Days),
          dateTo: reportsService.formatDate(yesterday)
        };

      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          dateFrom: reportsService.formatDate(startOfMonth),
          dateTo: reportsService.formatDate(yesterday)
        };

      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          dateFrom: reportsService.formatDate(lastMonthStart),
          dateTo: reportsService.formatDate(lastMonthEnd)
        };

      default:
        return {
          dateFrom: reportsService.formatDate(yesterday),
          dateTo: reportsService.formatDate(yesterday)
        };
    }
  }
};

export default reportsService;