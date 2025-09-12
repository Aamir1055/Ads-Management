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

  // Get campaigns for dropdown (only enabled ones)
  getCampaignsForDropdown: async () => {
    try {
      const response = await api.get('/campaign-data/campaigns');
      return response.data;
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
  }
};

export default campaignDataService;
