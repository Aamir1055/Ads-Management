import api from '../utils/api'

// FIXED: Standardized to use /user-management endpoints for consistency
const usersService = {
  // Get all users with filters and pagination
  getAll: async (params = {}) => {
    const response = await api.get('/user-management', { params })
    return response.data
  },

  // Get user by ID
  getById: async (id) => {
    const response = await api.get(`/user-management/${id}`)
    return response.data
  },

  // Get users for dropdown (simple format)
  getForDropdown: async () => {
    const response = await api.get('/user-management', { 
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
    const response = await api.post('/user-management', data)
    return response.data
  },

  // Update user
  update: async (id, data) => {
    const response = await api.put(`/user-management/${id}`, data)
    return response.data
  },

  // Delete user
  delete: async (id) => {
    const response = await api.delete(`/user-management/${id}`)
    return response.data
  },

  // Toggle user status
  toggleStatus: async (id) => {
    const response = await api.patch(`/user-management/${id}/toggle-status`)
    return response.data
  },

  // Get available roles - FIXED: Use consistent user-management endpoint
  getRoles: async () => {
    try {
      // Primary: Use user-management/roles endpoint for consistency
      const response = await api.get('/user-management/roles')
      
      // Transform to match expected format for user management
      if (response.data.success && response.data.data?.roles) {
        return {
          success: true,
          data: {
            roles: response.data.data.roles.map(role => ({
              id: role.id,
              role_name: role.display_name || role.name,
              name: role.name,
              display_name: role.display_name || role.name,
              description: role.description,
              is_system_role: role.is_system_role
            }))
          }
        }
      }
      
      return response.data
    } catch (error) {
      console.error('Error fetching roles from user-management API:', error)
      // Fallback to permissions API only if primary fails
      try {
        const response = await api.get('/permissions/roles-list')
        if (response.data.success && response.data.data) {
          return {
            success: true,
            data: {
              roles: response.data.data.map(role => ({
                id: role.id,
                role_name: role.name,
                name: role.name,
                display_name: role.display_name || role.name,
                description: role.description,
                is_system_role: role.is_system_role
              }))
            }
          }
        }
        return response.data
      } catch (fallbackError) {
        console.error('Both user-management and permissions APIs failed:', fallbackError)
        throw error // Throw the original error
      }
    }
  },

  // Check username availability - FIXED: Use user-management endpoint
  checkUsername: async (username) => {
    const response = await api.get(`/user-management/check/username/${username}`)
    return response.data
  }
}

export default usersService
