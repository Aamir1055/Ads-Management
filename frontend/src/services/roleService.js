import api from '../utils/api'

export const roleService = {
  // Get all roles
  getAllRoles: async () => {
    try {
      const response = await api.get('/permissions/roles-list')
      return response.data
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  },

  // Get all roles with their permissions
  getAllRolesWithPermissions: async () => {
    try {
      const rolesResponse = await api.get('/permissions/roles-list')
      const roles = rolesResponse.data.data || rolesResponse.data
      
      // Fetch permissions for each role
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          try {
            const permissionsResponse = await api.get(`/permissions/role/${role.id}/permissions`)
            const permissions = permissionsResponse.data.data || permissionsResponse.data.permissions || []
            return {
              ...role,
              permissions: permissions
            }
          } catch (err) {
            console.error(`Error fetching permissions for role ${role.id}:`, err)
            return {
              ...role,
              permissions: []
            }
          }
        })
      )
      
      return {
        ...rolesResponse.data,
        data: rolesWithPermissions
      }
    } catch (error) {
      console.error('Error fetching roles with permissions:', error)
      throw error
    }
  },

  // Get all modules
  getAllModules: async () => {
    try {
      const response = await api.get('/permissions/modules')
      return response.data
    } catch (error) {
      console.error('Error fetching modules:', error)
      throw error
    }
  },

  // Get all modules with their permissions
  getModulesWithPermissions: async () => {
    try {
      const response = await api.get('/permissions/modules-with-permissions')
      return response.data
    } catch (error) {
      console.error('Error fetching modules with permissions:', error)
      throw error
    }
  },

  // Get all permissions
  getAllPermissions: async () => {
    try {
      const response = await api.get('/permissions')
      return response.data
    } catch (error) {
      console.error('Error fetching permissions:', error)
      throw error
    }
  },

  // Get permissions for a specific role
  getRolePermissions: async (roleId) => {
    try {
      const response = await api.get(`/permissions/role/${roleId}/permissions`)
      return response.data
    } catch (error) {
      console.error('Error fetching role permissions:', error)
      throw error
    }
  },

  // Get user roles
  getUserRoles: async (userId) => {
    try {
      const response = await api.get(`/permissions/user/${userId}/roles`)
      return response.data
    } catch (error) {
      console.error('Error fetching user roles:', error)
      throw error
    }
  },

  // Get user permissions
  getUserPermissions: async (userId) => {
    try {
      const response = await api.get(`/permissions/user/${userId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      throw error
    }
  },

  // Check if user has specific permission
  checkUserPermission: async (userId, permissionKey) => {
    try {
      const response = await api.post('/permissions/check', {
        user_id: userId,
        permission_key: permissionKey
      })
      return response.data
    } catch (error) {
      console.error('Error checking user permission:', error)
      throw error
    }
  },

  // Create new role
  createRole: async (roleData) => {
    try {
      const response = await api.post('/permissions/role', roleData)
      return response.data
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  },

  // Create new role with permissions assigned
  createRoleWithPermissions: async (roleName, description, permissions = []) => {
    try {
      // First create the role
      const roleResponse = await api.post('/permissions/role', {
        name: roleName,
        description: description
      })
      
      const roleId = roleResponse.data.data?.id || roleResponse.data.data?.roleId
      
      // Then assign permissions if any
      if (permissions.length > 0 && roleId) {
        await api.post('/permissions/role/assign', {
          roleId: roleId,
          permissions: permissions
        })
      }
      
      return roleResponse.data
    } catch (error) {
      console.error('Error creating role with permissions:', error)
      throw error
    }
  },

  // Assign multiple permissions to a role
  assignPermissionsToRole: async (roleId, permissions) => {
    try {
      const response = await api.post('/permissions/role/assign', {
        roleId: roleId,
        permissions: permissions
      })
      return response.data
    } catch (error) {
      console.error('Error assigning permissions to role:', error)
      throw error
    }
  },

  // Update role
  updateRole: async (roleId, roleData) => {
    try {
      const response = await api.put(`/permissions/roles/${roleId}`, roleData)
      return response.data
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  },

  // Update role with permissions
  updateRoleWithPermissions: async (roleId, roleName, description, permissions = []) => {
    try {
      // First update the role details
      const roleResponse = await api.put(`/permissions/roles/${roleId}`, {
        name: roleName,
        description: description
      })
      
      // Then update permissions by reassigning them
      // (This will replace existing permissions with new ones)
      if (permissions.length >= 0) { // Allow empty permissions array to clear permissions
        await api.post('/permissions/role/assign', {
          roleId: roleId,
          permissions: permissions
        })
      }
      
      return roleResponse.data
    } catch (error) {
      console.error('Error updating role with permissions:', error)
      throw error
    }
  },

  // Delete role
  deleteRole: async (roleId) => {
    try {
      const response = await api.delete(`/permissions/role/${roleId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting role:', error)
      throw error
    }
  },

  // Assign permission to role
  assignPermissionToRole: async (roleId, permissionId) => {
    try {
      const response = await api.post('/permissions/grant-role-permission', {
        role_id: roleId,
        permission_id: permissionId
      })
      return response.data
    } catch (error) {
      console.error('Error assigning permission to role:', error)
      throw error
    }
  },

  // Revoke permission from role
  revokePermissionFromRole: async (roleId, permissionId) => {
    try {
      const response = await api.delete('/permissions/revoke-role-permission', {
        data: {
          role_id: roleId,
          permission_id: permissionId
        }
      })
      return response.data
    } catch (error) {
      console.error('Error revoking permission from role:', error)
      throw error
    }
  },

  // Assign user to role
  assignUserToRole: async (userId, roleId) => {
    try {
      const response = await api.post('/permissions/assign-role', {
        user_id: userId,
        role_id: roleId
      })
      return response.data
    } catch (error) {
      console.error('Error assigning user to role:', error)
      throw error
    }
  },

  // Remove user from role
  removeUserFromRole: async (userId, roleId) => {
    try {
      const response = await api.delete('/permissions/revoke-role', {
        data: {
          user_id: userId,
          role_id: roleId
        }
      })
      return response.data
    } catch (error) {
      console.error('Error removing user from role:', error)
      throw error
    }
  },

  // Get audit logs
  getAuditLogs: async (params = {}) => {
    try {
      const response = await api.get('/permissions/audit', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      throw error
    }
  }
}

export default roleService
