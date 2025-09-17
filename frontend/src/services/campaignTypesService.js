import api from '../utils/api';

// Campaign Types API
export const campaignTypesAPI = {
  // Get all campaign types
  getAll: async (params = {}) => {
    try {
      // Clean up params - remove undefined values
      const cleanParams = Object.entries(params)
        .filter(([key, value]) => value !== undefined && value !== null && value !== '')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
      
      console.log('API getAll params:', cleanParams)
      const response = await api.get('/campaign-types', { params: cleanParams })
      console.log('API getAll response:', response.data)
      return response.data
    } catch (error) {
      console.error('API getAll error:', error.response?.data || error.message)
      throw error
    }
  },

  // Get single campaign type by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/campaign-types/${id}`)
      console.log('API getById response:', response.data)
      return response.data
    } catch (error) {
      console.error('API getById error:', error.response?.data || error.message)
      throw error
    }
  },

  // Create new campaign type
  create: async (data) => {
    try {
      console.log('API create data:', data)
      const response = await api.post('/campaign-types', data)
      console.log('API create response:', response.data)
      return response.data
    } catch (error) {
      console.error('API create error:', error.response?.data || error.message)
      throw error
    }
  },

  // Update campaign type
  update: async (id, data) => {
    try {
      console.log('API update id:', id, 'data:', data)
      const response = await api.put(`/campaign-types/${id}`, data)
      console.log('API update response:', response.data)
      return response.data
    } catch (error) {
      console.error('API update error:', error.response?.data || error.message)
      throw error
    }
  },

  // Delete campaign type
  delete: async (id) => {
    try {
      console.log('API delete id:', id)
      const response = await api.delete(`/campaign-types/${id}`)
      console.log('API delete response:', response.data)
      return response.data
    } catch (error) {
      console.error('API delete error:', error.response?.data || error.message)
      throw error
    }
  }
}

export default campaignTypesAPI
