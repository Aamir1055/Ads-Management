import api from '../utils/api'

const usersService = {
  // Get all users with filters and pagination
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params })
    return response.data
  },

  // Get user by ID
  getById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // Get users for dropdown (simple format)
  getForDropdown: async () => {
    const response = await api.get('/users', { 
      params: { 
        limit: 100,
        is_active: true 
      } 
    })
    
    // Transform the response to a simpler format for dropdowns
    if (response.data.success && response.data.data?.users) {
      return {
        success: true,
        data: response.data.data.users.map(user => ({
          id: user.id,
          name: user.username, // Use username as display name
          username: user.username,
          is_active: user.is_active
        }))
      }
    }
    
    return response.data
  },

  // Create new user
  create: async (data) => {
    const response = await api.post('/users', data)
    return response.data
  },

  // Update user
  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },

  // Delete user
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  // Toggle user status
  toggleStatus: async (id) => {
    const response = await api.patch(`/users/${id}/toggle-status`)
    return response.data
  },

  // Get available roles
  getRoles: async () => {
    try {
      // Use the permissions API to get roles since it's more reliable
      const response = await api.get('/permissions/roles-list')
      
      // Transform to match expected format for user management
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: {
            roles: response.data.data.map(role => ({
              id: role.id,
              role_name: role.name,
              name: role.name,
              description: role.description,
              is_system_role: role.is_system_role
            }))
          }
        }
      }
      
      return response.data
    } catch (error) {
      console.error('Error fetching roles from permissions API:', error)
      // Fallback to users API
      const response = await api.get('/users/roles')
      return response.data
    }
  },

  // Check username availability
  checkUsername: async (username) => {
    const response = await api.get(`/users/check/username/${username}`)
    return response.data
  }
}

export default usersService
