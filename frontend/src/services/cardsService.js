import api from '../utils/api';

const ENDPOINT = '/cards';

const cardsService = {
  // Get all cards with pagination and filters
  getAll: async (params = {}) => {
    try {
      const response = await api.get(ENDPOINT, { params });
      return response.data;
    } catch (error) {
      console.error('API get all cards error:', error.response?.data || error);
      throw error;
    }
  },

  // Get only active cards for assignment dropdowns
  getActive: async (params = {}) => {
    try {
      const response = await api.get(`${ENDPOINT}/active`, { params });
      return response.data;
    } catch (error) {
      console.error('API get active cards error:', error.response?.data || error);
      throw error;
    }
  },

  // Get single card by ID
  getById: async (id) => {
    try {
      const response = await api.get(`${ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      console.error('API get card error:', error.response?.data || error);
      throw error;
    }
  },

  // Get cards by account ID
  getByAccount: async (accountId) => {
    try {
      const response = await api.get(`${ENDPOINT}/by-account/${accountId}`);
      return response.data;
    } catch (error) {
      console.error('API get cards by account error:', error.response?.data || error);
      throw error;
    }
  },

  // Create new card
  create: async (cardData) => {
    try {
      const response = await api.post(ENDPOINT, cardData);
      return response.data;
    } catch (error) {
      console.error('API create card error:', error.response?.data || error);
      throw error;
    }
  },

  // Update existing card
  update: async (id, cardData) => {
    try {
      const response = await api.put(`${ENDPOINT}/${id}`, cardData);
      return response.data;
    } catch (error) {
      console.error('API update card error:', error.response?.data || error);
      throw error;
    }
  },

  // Add balance to card
  addBalance: async (id, amount, description = '') => {
    try {
      const response = await api.post(`${ENDPOINT}/${id}/add-balance`, {
        amount: Number(amount),
        description: description || ''
      });
      return response.data;
    } catch (error) {
      console.error('API add balance error:', error.response?.data || error);
      throw error;
    }
  },

  // Delete card (soft delete - deactivate)
  delete: async (id) => {
    try {
      const response = await api.delete(`${ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      console.error('API delete card error:', error.response?.data || error);
      throw error;
    }
  }
};

export default cardsService;
