import api from './api';

class PermissionService {
  constructor() {
    this.cachedPermissions = null;
    this.cachedRoles = null;
    this.permissionsCacheTimestamp = null; // Separate timestamps
    this.rolesCacheTimestamp = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.pendingPermissionsRequest = null; // Prevent duplicate requests
    this.pendingRolesRequest = null;
    this.maxRetries = 3;
  }

  // Enhanced user retrieval with validation
  getCurrentUser() {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return null;
      
      const user = JSON.parse(userString);
      
      // Validate user object structure
      if (!user || typeof user !== 'object' || !user.id) {
        console.warn('Invalid user data structure');
        this.clearUserData();
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.clearUserData(); // Clear corrupted data
      return null;
    }
  }

  // Clear corrupted user data
  clearUserData() {
    try {
      localStorage.removeItem('user');
      this.clearCache();
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Enhanced cache clearing
  clearCache() {
    this.cachedPermissions = null;
    this.cachedRoles = null;
    this.permissionsCacheTimestamp = null;
    this.rolesCacheTimestamp = null;
    this.pendingPermissionsRequest = null;
    this.pendingRolesRequest = null;
  }

  // Separate cache validation for permissions and roles
  isPermissionsCacheValid() {
    if (!this.permissionsCacheTimestamp) return false;
    return Date.now() - this.permissionsCacheTimestamp < this.CACHE_DURATION;
  }

  isRolesCacheValid() {
    if (!this.rolesCacheTimestamp) return false;
    return Date.now() - this.rolesCacheTimestamp < this.CACHE_DURATION;
  }

  // Enhanced API request with retry logic
  async makeApiRequest(endpoint, retryCount = 0) {
    try {
      const response = await api.get(endpoint);
      
      // Validate response structure
      if (!response || !response.data) {
        throw new Error('Invalid API response structure');
      }

      // Check for API-level errors
      if (!response.data.success) {
        throw new Error(response.data.message || 'API request failed');
      }

      return response.data.data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error.message);
      
      // Retry logic for network errors
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        console.log(`Retrying request ${retryCount + 1}/${this.maxRetries}`);
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.makeApiRequest(endpoint, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Check if error is retryable
  isRetryableError(error) {
    return error.code === 'NETWORK_ERROR' || 
           error.response?.status >= 500 || 
           error.message.includes('timeout');
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fixed getUserPermissions with race condition prevention
  async getUserPermissions(userId = null) {
    try {
      const user = userId ? { id: userId } : this.getCurrentUser();
      if (!user?.id) {
        console.warn('No valid user found for permissions request');
        return {};
      }

      // Use cache if valid
      if (this.isPermissionsCacheValid() && this.cachedPermissions) {
        return this.cachedPermissions;
      }

      // Prevent duplicate requests
      if (this.pendingPermissionsRequest) {
        return await this.pendingPermissionsRequest;
      }

      // Make the request
      this.pendingPermissionsRequest = this.makeApiRequest('/permissions/my-permissions')
        .then(data => {
          // Validate permissions structure
          const permissions = this.validatePermissionsData(data);
          this.cachedPermissions = permissions;
          this.permissionsCacheTimestamp = Date.now();
          return permissions;
        })
        .catch(error => {
          console.error('Failed to get user permissions:', error.message);
          return {};
        })
        .finally(() => {
          this.pendingPermissionsRequest = null;
        });

      return await this.pendingPermissionsRequest;
    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      return {};
    }
  }

  // Validate permissions data structure
  validatePermissionsData(data) {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid permissions data structure');
      return {};
    }

    const validatedPermissions = {};
    
    for (const [moduleName, permissions] of Object.entries(data)) {
      if (Array.isArray(permissions)) {
        validatedPermissions[moduleName] = permissions.filter(p => 
          p && typeof p === 'object' && typeof p.permission_key === 'string'
        );
      }
    }

    return validatedPermissions;
  }

  // Fixed getUserRoles with race condition prevention
  async getUserRoles(userId = null) {
    try {
      const user = userId ? { id: userId } : this.getCurrentUser();
      if (!user?.id) {
        console.warn('No valid user found for roles request');
        return [];
      }

      // Use cache if valid
      if (this.isRolesCacheValid() && this.cachedRoles) {
        return this.cachedRoles;
      }

      // Prevent duplicate requests
      if (this.pendingRolesRequest) {
        return await this.pendingRolesRequest;
      }

      // Make the request
      this.pendingRolesRequest = this.makeApiRequest('/permissions/my-roles')
        .then(data => {
          // Validate roles structure
          const roles = this.validateRolesData(data);
          this.cachedRoles = roles;
          this.rolesCacheTimestamp = Date.now();
          return roles;
        })
        .catch(error => {
          console.error('Failed to get user roles:', error.message);
          return [];
        })
        .finally(() => {
          this.pendingRolesRequest = null;
        });

      return await this.pendingRolesRequest;
    } catch (error) {
      console.error('Error in getUserRoles:', error);
      return [];
    }
  }

  // Validate roles data structure
  validateRolesData(data) {
    if (!Array.isArray(data)) {
      console.warn('Invalid roles data structure');
      return [];
    }

    return data.filter(role => 
      role && typeof role === 'object' && typeof role.name === 'string'
    );
  }

  // Enhanced permission checking with input validation
  async hasPermission(permissionKey, userId = null) {
    try {
      // Input validation
      if (!permissionKey || typeof permissionKey !== 'string') {
        console.warn('Invalid permission key provided');
        return false;
      }

      const permissions = await this.getUserPermissions(userId);
      
      // Check if permission exists in any module
      for (const moduleName of Object.keys(permissions)) {
        const modulePermissions = permissions[moduleName] || [];
        if (modulePermissions.some(p => p.permission_key === permissionKey)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Enhanced module access check
  async hasModuleAccess(moduleName, userId = null) {
    try {
      // Input validation
      if (!moduleName || typeof moduleName !== 'string') {
        console.warn('Invalid module name provided');
        return false;
      }

      const permissions = await this.getUserPermissions(userId);
      return permissions[moduleName] && permissions[moduleName].length > 0;
    } catch (error) {
      console.error('Error checking module access:', error);
      return false;
    }
  }

  // Enhanced multiple permissions check
  async hasAnyPermission(permissionKeys, userId = null) {
    try {
      // Input validation
      if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
        console.warn('Invalid permission keys array provided');
        return false;
      }

      // Check all permissions in parallel for better performance
      const permissionChecks = permissionKeys.map(key => 
        this.hasPermission(key, userId)
      );
      
      const results = await Promise.all(permissionChecks);
      return results.some(result => result === true);
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  // Enhanced role checking
  async hasRole(roleName, userId = null) {
    try {
      // Input validation
      if (!roleName || typeof roleName !== 'string') {
        console.warn('Invalid role name provided');
        return false;
      }

      const roles = await this.getUserRoles(userId);
      return roles.some(role => role.name === roleName);
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  // Enhanced multiple roles check
  async hasAnyRole(roleNames, userId = null) {
    try {
      // Input validation
      if (!Array.isArray(roleNames) || roleNames.length === 0) {
        console.warn('Invalid role names array provided');
        return false;
      }

      const roles = await this.getUserRoles(userId);
      const userRoleNames = roles.map(role => role.name);
      return roleNames.some(roleName => userRoleNames.includes(roleName));
    } catch (error) {
      console.error('Error checking roles:', error);
      return false;
    }
  }

  // Updated module permissions with better structure
  getModulePermissions() {
    return {
      'dashboard': ['dashboard.view'],
      'user-management': ['users.read', 'users.create', 'users.update', 'users.delete'],
      'role-management': ['roles.read'],
      'campaign-types': ['campaign-types.read'],
      'campaign-data': ['campaign-data.read'],
      'campaigns': ['campaigns.read'],
      'ads': ['ads.read'],
      'cards': ['cards.read'],
      'card-users': ['card-users.read'],
      'reports-table': ['reports.read'],
      'reports': ['reports.read'],
      'analytics': ['analytics.view'],
      '2fa': ['2fa.setup'],
      'modules': ['modules.read'],
      'settings': ['settings.update']
    };
  }

  // Enhanced route access check
  async canAccessRoute(routePath, userId = null) {
    try {
      // Input validation
      if (!routePath || typeof routePath !== 'string') {
        console.warn('Invalid route path provided');
        return false;
      }

      // Normalize route path
      const route = routePath.replace(/^\/+/, '').toLowerCase();
      const modulePermissions = this.getModulePermissions();
      const requiredPermissions = modulePermissions[route];

      // If no permissions required, allow access
      if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
      }

      // Check if user has any of the required permissions
      return await this.hasAnyPermission(requiredPermissions, userId);
    } catch (error) {
      console.error('Error checking route access:', error);
      return false;
    }
  }

  // Enhanced refresh with proper cleanup
  async refreshPermissions() {
    try {
      this.clearCache();
      const user = this.getCurrentUser();
      
      if (user?.id) {
        // Refresh both permissions and roles in parallel
        await Promise.allSettled([
          this.getUserPermissions(user.id),
          this.getUserRoles(user.id)
        ]);
      }
    } catch (error) {
      console.error('Error refreshing permissions:', error);
    }
  }

  // Add cleanup method for memory management
  destroy() {
    this.clearCache();
    // Clear any remaining timeouts/intervals if added later
  }
}

// Export singleton instance
const permissionService = new PermissionService();
export default permissionService;
