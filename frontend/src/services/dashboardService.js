import axios from 'axios';

// Use Vite environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

class DashboardService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/dashboard`;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.requestsInProgress = new Set();
    this.lastRequestTime = new Map();
    this.minRequestInterval = 1000; // 1 second between requests of same type
  }

  /**
   * Get or create axios instance with authentication
   */
  getAxiosInstance() {
    const token = localStorage.getItem('token');
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Cache management
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Check if request should be debounced
   */
  shouldDebounceRequest(key) {
    // Check if request is already in progress
    if (this.requestsInProgress.has(key)) {
      console.log(`Dashboard service: Request ${key} already in progress, skipping...`);
      return true;
    }

    // Check minimum interval between requests
    const lastRequestTime = this.lastRequestTime.get(key);
    const now = Date.now();
    if (lastRequestTime && (now - lastRequestTime) < this.minRequestInterval) {
      console.log(`Dashboard service: Request ${key} too soon, debouncing...`);
      return true;
    }

    return false;
  }

  /**
   * Mark request as started
   */
  startRequest(key) {
    this.requestsInProgress.add(key);
    this.lastRequestTime.set(key, Date.now());
  }

  /**
   * Mark request as completed
   */
  endRequest(key) {
    this.requestsInProgress.delete(key);
  }

  /**
   * Get dashboard overview statistics
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} Dashboard overview data
   */
  async getOverview(useCache = true) {
    const cacheKey = 'dashboard_overview';
    const requestKey = 'overview';
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    // Check if request should be debounced
    if (this.shouldDebounceRequest(requestKey)) {
      // Return cached data if available, otherwise return empty response
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
      return { success: false, message: 'Request debounced' };
    }

    try {
      this.startRequest(requestKey);
      const axios = this.getAxiosInstance();
      const response = await axios.get('/overview');
      
      if (response.data.success) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard overview');
      }
    } catch (error) {
      console.error('Dashboard overview service error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Handle authentication errors
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }
      throw new Error(error.response?.data?.message || error.message || 'Network error');
    } finally {
      this.endRequest(requestKey);
    }
  }

  /**
   * Get performance trends for charts
   * @param {number} days - Number of days to fetch
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} Trends data
   */
  async getTrends(days = 30, useCache = true) {
    const cacheKey = `dashboard_trends_${days}`;
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    try {
      const axios = this.getAxiosInstance();
      const response = await axios.get(`/trends?days=${days}`);
      
      if (response.data.success) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch trends data');
      }
    } catch (error) {
      console.error('Dashboard trends service error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }
      throw new Error(error.response?.data?.message || error.message || 'Network error');
    }
  }

  /**
   * Get top performing campaigns
   * @param {number} limit - Number of campaigns to fetch
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} Campaigns data
   */
  async getCampaigns(limit = 10, useCache = true) {
    const cacheKey = `dashboard_campaigns_${limit}`;
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    try {
      const axios = this.getAxiosInstance();
      const response = await axios.get(`/campaigns?limit=${limit}`);
      
      if (response.data.success) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch campaigns data');
      }
    } catch (error) {
      console.error('Dashboard campaigns service error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }
      throw new Error(error.response?.data?.message || error.message || 'Network error');
    }
  }

  /**
   * Get brand performance data
   * @param {number} limit - Number of brands to fetch
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} Brands data
   */
  async getBrands(limit = 8, useCache = true) {
    const cacheKey = `dashboard_brands_${limit}`;
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    try {
      const axios = this.getAxiosInstance();
      const response = await axios.get(`/brands?limit=${limit}`);
      
      if (response.data.success) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch brands data');
      }
    } catch (error) {
      console.error('Dashboard brands service error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }
      throw new Error(error.response?.data?.message || error.message || 'Network error');
    }
  }

  /**
   * Get recent system activities
   * @param {number} limit - Number of activities to fetch
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} Activities data
   */
  async getActivities(limit = 20, useCache = true) {
    const cacheKey = `dashboard_activities_${limit}`;
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    try {
      const axios = this.getAxiosInstance();
      const response = await axios.get(`/activities?limit=${limit}`);
      
      if (response.data.success) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch activities data');
      }
    } catch (error) {
      console.error('Dashboard activities service error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }
      throw new Error(error.response?.data?.message || error.message || 'Network error');
    }
  }

  /**
   * Get real-time dashboard metrics (never cached)
   * @returns {Promise<Object>} Real-time metrics
   */
  async getRealTimeMetrics() {
    try {
      const axios = this.getAxiosInstance();
      const response = await axios.get('/realtime');
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch real-time metrics');
      }
    } catch (error) {
      console.error('Dashboard real-time service error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }
      throw new Error(error.response?.data?.message || error.message || 'Network error');
    }
  }

  /**
   * Get dashboard summary (lightweight version)
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} Summary data
   */
  async getSummary(useCache = true) {
    const cacheKey = 'dashboard_summary';
    
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    try {
      const axios = this.getAxiosInstance();
      const response = await axios.get('/summary');
      
      if (response.data.success) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard summary');
      }
    } catch (error) {
      console.error('Dashboard summary service error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }
      throw new Error(error.response?.data?.message || error.message || 'Network error');
    }
  }

  /**
   * Export dashboard data
   * @param {string} type - Type of data to export (overview, campaigns, brands, activities)
   * @param {string} format - Export format (json, csv)
   * @returns {Promise<Blob>} Export data as blob
   */
  async exportData(type = 'overview', format = 'json') {
    try {
      const axios = this.getAxiosInstance();
      const response = await axios.get(`/export?type=${type}&format=${format}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Dashboard export service error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }
      throw new Error('Failed to export dashboard data');
    }
  }

  /**
   * Refresh all dashboard data by clearing cache
   */
  async refreshAll() {
    this.clearCache();
    
    // Fetch fresh data for all sections
    const promises = [
      this.getOverview(false),
      this.getTrends(30, false),
      this.getCampaigns(10, false),
      this.getBrands(8, false),
      this.getActivities(20, false)
    ];

    try {
      await Promise.all(promises);
      return { success: true, message: 'Dashboard refreshed successfully' };
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get all dashboard data at once
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Object>} All dashboard data
   */
  async getAllDashboardData(useCache = true) {
    try {
      const [overview, trends, campaigns, brands, activities] = await Promise.all([
        this.getOverview(useCache),
        this.getTrends(30, useCache),
        this.getCampaigns(10, useCache),
        this.getBrands(8, useCache),
        this.getActivities(20, useCache)
      ]);

      return {
        overview: overview?.data,
        trends: trends?.data,
        campaigns: campaigns?.data,
        brands: brands?.data,
        activities: activities?.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get all dashboard data error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates (WebSocket implementation placeholder)
   * @param {Function} callback - Callback function for updates
   */
  subscribeToRealTimeUpdates(callback) {
    // Placeholder for WebSocket implementation
    // For now, we'll use polling
    const interval = setInterval(async () => {
      try {
        const realTimeData = await this.getRealTimeMetrics();
        callback(realTimeData);
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    }, 30000); // Update every 30 seconds

    // Return unsubscribe function
    return () => clearInterval(interval);
  }

  /**
   * Download exported data as file
   * @param {string} type - Type of data to export
   * @param {string} format - Export format
   */
  async downloadExport(type, format) {
    try {
      const blob = await this.exportData(type, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-${type}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download export error:', error);
      throw error;
    }
  }
}

export default new DashboardService();