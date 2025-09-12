import api from './api'

const campaignService = {
  // Get all campaigns with pagination
  getCampaigns: async (params = {}) => {
    const response = await api.get('/campaigns', { params })
    // Handle the nested data structure from backend
    const apiResponse = response.data
    return {
      success: apiResponse.success,
      message: apiResponse.message,
      data: apiResponse.data?.campaigns || apiResponse.data || []
    }
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

  // Get campaign types for dropdown
  getCampaignTypes: async () => {
    const response = await api.get('/campaign-types')
    return response.data
  },

  // Toggle campaign status
  toggleCampaignStatus: async (id) => {
    const response = await api.patch(`/campaigns/${id}/toggle-status`)
    return response.data
  }
}

export default campaignService
