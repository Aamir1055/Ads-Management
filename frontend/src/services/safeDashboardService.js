import axios from 'axios';

// Use Vite environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

class SafeDashboardService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/dashboard`;
  }

  /**
   * Create axios instance with manual token handling - NO INTERCEPTORS
   */
  createAxiosInstance() {
    const token = localStorage.getItem('access_token');
    
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
  }

  /**
   * Safe API call wrapper that handles errors without triggering redirects
   */
  async safeApiCall(endpoint, options = {}) {
    try {
      const axiosInstance = this.createAxiosInstance();
      const response = await axiosInstance.get(endpoint, options);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'API call failed');
      }
    } catch (error) {
      // Handle specific error cases WITHOUT redirecting or showing confusing errors
      if (error.response?.status === 401) {
        // Silent handling for auth errors - user might just need to refresh
        throw new Error('Please refresh the page to reload your session');
      }
      
      if (error.response?.status === 403) {
        throw new Error('You don\'t have permission to view this data');
      }
      
      // For other errors, provide user-friendly messages
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      
      throw new Error(error.response?.data?.message || 'Unable to load dashboard data');
    }
  }

  /**
   * Get dashboard overview statistics
   */
  async getOverview() {
    return await this.safeApiCall('/overview');
  }

  /**
   * Get performance trends for charts
   */
  async getTrends(days = 30) {
    return await this.safeApiCall(`/trends?days=${days}`);
  }

  /**
   * Get top performing campaigns
   */
  async getCampaigns(limit = 10) {
    return await this.safeApiCall(`/campaigns?limit=${limit}`);
  }

  /**
   * Get brand performance data
   */
  async getBrands(limit = 8) {
    return await this.safeApiCall(`/brands?limit=${limit}`);
  }

  /**
   * Get real-time dashboard metrics
   */
  async getRealTimeMetrics() {
    return await this.safeApiCall('/realtime');
  }

  /**
   * Get dashboard summary (lightweight version)
   */
  async getSummary() {
    return await this.safeApiCall('/summary');
  }

  /**
   * Test connection to the API
   */
  async testConnection() {
    try {
      const response = await this.createAxiosInstance().get('/summary');
      return { success: true, message: 'API connection successful' };
    } catch (error) {
      // Provide user-friendly error messages
      if (error.response?.status === 401) {
        return { success: false, message: 'Session expired. Please refresh the page.' };
      }
      if (error.response?.status === 403) {
        return { success: false, message: 'Access denied. You may not have permission to view dashboard data.' };
      }
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        return { success: false, message: 'Cannot connect to server. Please check if the backend is running.' };
      }
      return { success: false, message: 'Unable to connect to dashboard service.' };
    }
  }

  /**
   * Force refresh with cache busting
   */
  async forceGetOverview() {
    return await this.safeApiCall(`/overview?_t=${Date.now()}`);
  }

  async forceGetTrends(days = 30) {
    return await this.safeApiCall(`/trends?days=${days}&_t=${Date.now()}`);
  }

  async forceGetCampaigns(limit = 10) {
    return await this.safeApiCall(`/campaigns?limit=${limit}&_t=${Date.now()}`);
  }

  async forceGetBrands(limit = 8) {
    return await this.safeApiCall(`/brands?limit=${limit}&_t=${Date.now()}`);
  }
}

export default new SafeDashboardService();