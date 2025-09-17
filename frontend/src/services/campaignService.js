import api from '../utils/api';

const campaignService = {
  // Get all campaigns with pagination and filters
  getCampaigns: async (params = {}) => {
    const response = await api.get('/campaigns', { params })
    return response.data
  },

  // Get single campaign by ID
  getCampaign: async (id) => {
    const response = await api.get(`/campaigns/${id}`)
    return response.data
  },

  // Create new campaign
  createCampaign: async (campaignData) => {
    const response = await api.post('/campaigns', campaignData)
    return response.data
  },

  // Update campaign
  updateCampaign: async (id, campaignData) => {
    const response = await api.put(`/campaigns/${id}`, campaignData)
    return response.data
  },

  // Delete campaign
  deleteCampaign: async (id) => {
    const response = await api.delete(`/campaigns/${id}`)
    return response.data
  },

  // Toggle campaign active/inactive status
  toggleCampaignStatus: async (id) => {
    const response = await api.put(`/campaigns/${id}/toggle-status`)
    return response.data
  },

  // Toggle campaign enabled/disabled status
  toggleCampaignEnabled: async (id) => {
    const response = await api.put(`/campaigns/${id}/toggle-enabled`)
    return response.data
  },

  // Activate campaign
  activateCampaign: async (id) => {
    const response = await api.put(`/campaigns/${id}/activate`)
    return response.data
  },

  // Deactivate campaign
  deactivateCampaign: async (id) => {
    const response = await api.put(`/campaigns/${id}/deactivate`)
    return response.data
  },

  // Get campaign statistics
  getCampaignStats: async () => {
    const response = await api.get('/campaigns/stats')
    return response.data
  },

  // Get campaigns by brand
  getCampaignsByBrand: async (brandId, params = {}) => {
    const response = await api.get(`/campaigns/by-brand/${brandId}`, { params })
    return response.data
  },

  // Get campaign types for dropdown
  getCampaignTypes: async () => {
    const response = await api.get('/campaign-types')
    return response.data
  },

  // Get brands for dropdown
  getBrands: async () => {
    const response = await api.get('/brands/active')
    return response.data
  }
}

export default campaignService
