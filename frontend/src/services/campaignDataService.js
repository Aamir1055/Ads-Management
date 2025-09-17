import api from '../utils/api';

const campaignDataService = {
  // Get all campaign data with pagination and filters
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/campaign-data', { params });
      return response.data;
    } catch (error) {
      console.error('API getAll error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get campaign data by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/campaign-data/${id}`);
      return response.data;
    } catch (error) {
      console.error('API getById error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create new campaign data
  create: async (data) => {
    try {
      const response = await api.post('/campaign-data', data);
      return response.data;
    } catch (error) {
      console.error('API create error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update campaign data
  update: async (id, data) => {
    try {
      const response = await api.put(`/campaign-data/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('API update error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete campaign data
  delete: async (id) => {
    try {
      const response = await api.delete(`/campaign-data/${id}`);
      return response.data;
    } catch (error) {
      console.error('API delete error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get campaigns for dropdown (only enabled ones) - now with privacy filtering
  getCampaignsForDropdown: async () => {
    try {
      // Use the main campaigns endpoint which has privacy filtering
      const response = await api.get('/campaigns', { params: { is_enabled: true, limit: 1000 } });
      return {
        success: response.data.success,
        data: response.data.data?.campaigns || response.data.data || [],
        message: response.data.message
      };
    } catch (error) {
      console.error('API getCampaignsForDropdown error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get cards for dropdown (only active ones)
  getCardsForDropdown: async () => {
    try {
      const response = await api.get('/campaign-data/cards');
      return response.data;
    } catch (error) {
      console.error('API getCardsForDropdown error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get all campaign data for a specific campaign
  getByCampaignId: async (campaignId, params = {}) => {
    try {
      const response = await api.get('/campaign-data', {
        params: {
          campaign_id: campaignId,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('API getByCampaignId error:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default campaignDataService;
