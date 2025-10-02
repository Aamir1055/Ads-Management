import { api } from '../utils/api';

const dashboardService = {
  /**
   * Get dashboard overview data with KPIs and analytics
   */
  getDashboardOverview: async () => {
    try {
      // Now use the original analytics/dashboard endpoint since we have real data in reports table
      const response = await api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  },

  /**
   * Get dashboard trends data for charts
   * @param {Object} options - Query options
   * @param {string} [options.period='30d'] - Time period (7d, 30d, 90d, 1y)
   * @param {string} [options.metric='leads'] - Primary metric (leads, spent, campaigns)
   */
  getTrendsData: async (options = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Convert period to date range
      const endDate = new Date();
      const startDate = new Date();
      const { period = '30d' } = options;
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default: // 30d
          startDate.setDate(endDate.getDate() - 30);
      }
      
      queryParams.append('date_from', startDate.toISOString().split('T')[0]);
      queryParams.append('date_to', endDate.toISOString().split('T')[0]);
      queryParams.append('group_by', 'day');

      const response = await api.get(`/analytics/charts/time-series?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trends data:', error);
      throw error;
    }
  },

  /**
   * Get campaign performance data for dashboard charts
   * @param {Object} options - Query options
   * @param {number} [options.limit=10] - Number of campaigns to return
   * @param {string} [options.sortBy='leads'] - Sort by metric
   */
  getCampaignPerformance: async (options = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      const { limit = 10, sortBy = 'leads', ...filters } = options;
      
      // Set date range for last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
      queryParams.append('date_from', startDate.toISOString().split('T')[0]);
      queryParams.append('date_to', endDate.toISOString().split('T')[0]);
      queryParams.append('limit', limit);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/analytics/charts/campaign-performance?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign performance:', error);
      throw error;
    }
  },

  /**
   * Get brand performance data
   * @param {Object} options - Query options
   */
  getBrandPerformance: async (options = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Set date range for last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
      queryParams.append('date_from', startDate.toISOString().split('T')[0]);
      queryParams.append('date_to', endDate.toISOString().split('T')[0]);
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/analytics/charts/brand-analysis?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching brand performance:', error);
      throw error;
    }
  },

  /**
   * Get recent activities for dashboard feed
   * @param {Object} options - Query options
   * @param {number} [options.limit=20] - Number of activities to return
   */
  getRecentActivities: async (options = {}) => {
    // Since activities endpoint doesn't exist yet, return mock data
    console.log('[Dashboard] Using mock activities data - activities endpoint not implemented yet');
    
    return {
      success: true,
      data: {
        activities: [
          {
            id: 1,
            type: 'report_generated',
            title: 'Campaign report generated',
            description: 'Monthly report for active campaigns',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            user: 'System',
            icon: 'FileText'
          },
          {
            id: 2,
            type: 'campaign_created',
            title: 'New campaign created',
            description: 'Facebook Ads Campaign launched',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            user: 'Admin',
            icon: 'Target'
          },
          {
            id: 3,
            type: 'user_login',
            title: 'User login',
            description: 'Dashboard access by user',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            user: 'User',
            icon: 'Users'
          },
          {
            id: 4,
            type: 'data_refresh',
            title: 'Data synchronized',
            description: 'Campaign data updated from sources',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            user: 'System',
            icon: 'RefreshCw'
          },
          {
            id: 5,
            type: 'analytics_view',
            title: 'Analytics viewed',
            description: 'Performance metrics accessed',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            user: 'User',
            icon: 'BarChart3'
          }
        ]
      }
    };
  },

  /**
   * Get system metrics for dashboard
   */
  getSystemMetrics: async () => {
    try {
      const response = await api.get('/analytics/system');
      return response.data;
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      // Return mock data if API fails
      return {
        success: true,
        data: {
          system: {
            totalUsers: 12,
            activeCampaigns: 8,
            totalReports: 156,
            systemUptime: '15 days',
            lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        }
      };
    }
  },

  /**
   * Export dashboard data
   * @param {Object} options - Export options
   * @param {string} [options.format='json'] - Export format (json, csv)
   * @param {Array} [options.sections] - Sections to include
   */
  exportDashboardData: async (options = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      const { format = 'json', sections = ['overview', 'campaigns', 'brands'], ...filters } = options;
      
      queryParams.append('format', format);
      sections.forEach(section => queryParams.append('sections', section));
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/analytics/export?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      throw error;
    }
  }
};

export default dashboardService;
