import { api } from '../utils/api';

const reportsService = {
  // ============================================================================
  // REPORT GENERATION & BUILDING
  // ============================================================================

  /**
   * Build daily reports for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  buildDaily: async (date) => {
    try {
      const response = await api.post(`/reports/build?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error building daily reports:', error);
      throw error;
    }
  },

  /**
   * Build reports for a date range
   * @param {string} fromDate - Start date in YYYY-MM-DD format
   * @param {string} toDate - End date in YYYY-MM-DD format
   */
  buildRange: async (fromDate, toDate) => {
    try {
      const response = await api.post(`/reports/build-range?from=${fromDate}&to=${toDate}`);
      return response.data;
    } catch (error) {
      console.error('Error building range reports:', error);
      throw error;
    }
  },

  /**
   * Rebuild reports for a specific campaign over a date range
   * @param {number} campaignId - Campaign ID
   * @param {string} fromDate - Start date in YYYY-MM-DD format
   * @param {string} toDate - End date in YYYY-MM-DD format
   */
  rebuildCampaignRange: async (campaignId, fromDate, toDate) => {
    try {
      const response = await api.post(
        `/reports/rebuild-campaign?campaign_id=${campaignId}&from=${fromDate}&to=${toDate}`
      );
      return response.data;
    } catch (error) {
      console.error('Error rebuilding campaign reports:', error);
      throw error;
    }
  },

  /**
   * Generate comprehensive report with filters (from campaign_data)
   * @param {Object} filters - Filter options
   * @param {string} filters.date_from - Start date filter (YYYY-MM-DD)
   * @param {string} filters.date_to - End date filter (YYYY-MM-DD)
   * @param {string} [filters.brand] - Brand filter
   * @param {number} [filters.campaign_id] - Campaign ID filter
   */
  generateReport: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Map frontend filter names to backend expected names
      const filterMap = {
        dateFrom: 'date_from',
        dateTo: 'date_to',
        campaignId: 'campaign_id',
        brand: 'brand'
      };
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          const backendKey = filterMap[key] || key;
          queryParams.append(backendKey, value);
        }
      });

      const response = await api.get(`/reports/generate?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all reports with filters and pagination
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=10] - Items per page
   * @param {number} [options.campaignId] - Filter by campaign ID
   * @param {string} [options.dateFrom] - Filter from date
   * @param {string} [options.dateTo] - Filter to date
   * @param {string} [options.month] - Filter by month (YYYY-MM)
   * @param {string} [options.search] - Search term
   */
  getAll: async (options = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Set defaults
      const { page = 1, limit = 10, ...filters } = options;
      
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/reports?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  /**
   * Get a single report by ID
   * @param {number} id - Report ID
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/reports/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report by ID:', error);
      throw error;
    }
  },

  /**
   * Create a new report (manual entry)
   * @param {Object} reportData - Report data
   * @param {number} reportData.campaign_id - Campaign ID
   * @param {string} reportData.date - Date in YYYY-MM-DD format
   * @param {number} [reportData.spent] - Amount spent
   * @param {number} [reportData.facebook_result] - Facebook results
   * @param {number} [reportData.zoho_result] - Zoho results
   * @param {string} [reportData.notes] - Additional notes
   */
  create: async (reportData) => {
    try {
      const response = await api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },

  /**
   * Update an existing report
   * @param {number} id - Report ID
   * @param {Object} reportData - Updated report data
   */
  update: async (id, reportData) => {
    try {
      const response = await api.put(`/reports/${id}`, reportData);
      return response.data;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  },

  /**
   * Delete a report
   * @param {number} id - Report ID
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/reports/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  // ============================================================================
  // UTILITY & ANALYTICS
  // ============================================================================

  /**
   * Get available filter options
   */
  getFilterOptions: async () => {
    try {
      const response = await api.get('/reports/filters');
      return response.data;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get('/reports/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Format currency value
   * @param {number} value - Numeric value
   * @returns {string} Formatted currency string
   */
  formatCurrency: (value) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  },

  /**
   * Format number with commas
   * @param {number} value - Numeric value
   * @returns {string} Formatted number string
   */
  formatNumber: (value) => {
    if (value === null || value === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  },

  /**
   * Calculate ROI (Return on Investment)
   * @param {number} results - Total results (facebook + zoho)
   * @param {number} spent - Amount spent
   * @returns {number} ROI percentage
   */
  calculateROI: (results, spent) => {
    if (!spent || spent === 0) return 0;
    return ((results - spent) / spent) * 100;
  },

  /**
   * Calculate cost per result
   * @param {number} spent - Amount spent
   * @param {number} results - Total results
   * @returns {number} Cost per result
   */
  calculateCostPerResult: (spent, results) => {
    if (!results || results === 0) return 0;
    return spent / results;
  },

  /**
   * Get date range presets
   * @returns {Object} Preset date ranges
   */
  getDateRangePresets: () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastThreeMonths = new Date(today);
    lastThreeMonths.setMonth(lastThreeMonths.getMonth() - 3);
    
    const format = (date) => date.toISOString().split('T')[0];
    
    return {
      today: {
        label: 'Today',
        from: format(today),
        to: format(today)
      },
      yesterday: {
        label: 'Yesterday',
        from: format(yesterday),
        to: format(yesterday)
      },
      lastWeek: {
        label: 'Last 7 Days',
        from: format(lastWeek),
        to: format(today)
      },
      lastMonth: {
        label: 'Last 30 Days',
        from: format(lastMonth),
        to: format(today)
      },
      lastThreeMonths: {
        label: 'Last 3 Months',
        from: format(lastThreeMonths),
        to: format(today)
      }
    };
  }
};

export default reportsService;
