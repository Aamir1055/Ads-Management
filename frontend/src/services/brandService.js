import api from '../utils/api';

// Brand API
export const brandAPI = {
  // Get all brands
  getAll: async (params = {}) => {
    try {
      // Clean up params - remove undefined values
      const cleanParams = Object.entries(params)
        .filter(([key, value]) => value !== undefined && value !== null && value !== '')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
      
      console.log('Brand API getAll params:', cleanParams)
      const response = await api.get('/brands', { params: cleanParams })
      console.log('Brand API getAll response:', response.data)
      return response.data
    } catch (error) {
      console.error('Brand API getAll error:', error.response?.data || error.message)
      throw error
    }
  },

  // Get single brand by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/brands/${id}`)
      console.log('Brand API getById response:', response.data)
      return response.data
    } catch (error) {
      console.error('Brand API getById error:', error.response?.data || error.message)
      throw error
    }
  },

  // Create new brand
  create: async (data) => {
    try {
      console.log('Brand API create data:', data)
      const response = await api.post('/brands', data)
      console.log('Brand API create response:', response.data)
      return response.data
    } catch (error) {
      console.error('Brand API create error:', error.response?.data || error.message)
      throw error
    }
  },

  // Update brand
  update: async (id, data) => {
    try {
      console.log('Brand API update id:', id, 'data:', data)
      const response = await api.put(`/brands/${id}`, data)
      console.log('Brand API update response:', response.data)
      return response.data
    } catch (error) {
      console.error('Brand API update error:', error.response?.data || error.message)
      throw error
    }
  },

  // Delete brand
  delete: async (id) => {
    try {
      console.log('Brand API delete id:', id)
      const response = await api.delete(`/brands/${id}`)
      console.log('Brand API delete response:', response.data)
      return response.data
    } catch (error) {
      console.error('Brand API delete error:', error.response?.data || error.message)
      throw error
    }
  }
}

export default brandAPI
