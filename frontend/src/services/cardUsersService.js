import api from '../utils/api'

const cardUsersService = {
  // Get all card user assignments with filters and pagination
  getAll: async (params = {}) => {
    const response = await api.get('/card-users', { params })
    return response.data
  },

  // Get card user assignment by ID
  getById: async (id) => {
    const response = await api.get(`/card-users/${id}`)
    return response.data
  },

  // Create new card user assignment
  create: async (data) => {
    const response = await api.post('/card-users', data)
    return response.data
  },

  // Update card user assignment
  update: async (id, data) => {
    const response = await api.put(`/card-users/${id}`, data)
    return response.data
  },

  // Delete card user assignment
  delete: async (id) => {
    const response = await api.delete(`/card-users/${id}`)
    return response.data
  },

  // Get all cards assigned to a user
  getCardsByUser: async (userId) => {
    const response = await api.get(`/card-users/user/${userId}/cards`)
    return response.data
  },

  // Get all users assigned to a card
  getUsersByCard: async (cardId) => {
    const response = await api.get(`/card-users/card/${cardId}/users`)
    return response.data
  }
}

export default cardUsersService
