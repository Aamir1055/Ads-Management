import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to manage user permissions
 * Extracts permissions from the authenticated user's data
 */
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setPermissions({});
      setLoading(false);
      return;
    }

    try {
      // Extract permissions from user data
      let userPermissions = {};
      
      // Super admin gets all permissions
      const isSuperAdmin = user?.role_name === 'super_admin' || user?.role?.name === 'super_admin';
      
      if (isSuperAdmin) {
        // Grant all common permissions to super admin
        const allPermissions = [
          // Brand permissions
          'brands_create', 'brands_read', 'brands_update', 'brands_delete',
          // Role permissions
          'roles_create', 'roles_read', 'roles_update', 'roles_delete',
          // User permissions
          'users_create', 'users_read', 'users_update', 'users_delete',
          // Campaign permissions
          'campaigns_create', 'campaigns_read', 'campaigns_update', 'campaigns_delete',
          // Report permissions
          'reports_create', 'reports_read', 'reports_update', 'reports_delete',
          // Admin permissions
          'admin', 'super_admin'
        ];
        
        allPermissions.forEach(permission => {
          userPermissions[permission] = true;
        });
        
        console.log('🔑 usePermissions - Super admin detected, granted all permissions');
      } else {
        // Check if user has permissions array
        if (user.permissions && Array.isArray(user.permissions)) {
          // Convert array of permission names to object with boolean values
          user.permissions.forEach(permission => {
            userPermissions[permission] = true;
          });
        }
        
        // Also check for permissions object format
        if (user.permissions && typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
          userPermissions = { ...user.permissions };
        }

        // Check if permissions are stored under different key
        if (user.userPermissions && Array.isArray(user.userPermissions)) {
          user.userPermissions.forEach(permission => {
            userPermissions[permission] = true;
          });
        }
      }

      // Debug log
      console.log('🔑 usePermissions - User data:', user);
      console.log('🔑 usePermissions - Is super admin:', isSuperAdmin);
      console.log('🔑 usePermissions - Extracted permissions:', userPermissions);
      
      setPermissions(userPermissions);
    } catch (error) {
      console.error('❌ Error extracting permissions:', error);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission name to check
   * @returns {boolean} - Whether user has the permission
   */
  const hasPermission = (permission) => {
    if (!permission) return false;
    return Boolean(permissions[permission]);
  };

  /**
   * Check if user has any of the provided permissions
   * @param {string[]} permissionList - Array of permission names
   * @returns {boolean} - Whether user has any of the permissions
   */
  const hasAnyPermission = (permissionList) => {
    if (!Array.isArray(permissionList) || permissionList.length === 0) return false;
    return permissionList.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has all of the provided permissions
   * @param {string[]} permissionList - Array of permission names
   * @returns {boolean} - Whether user has all of the permissions
   */
  const hasAllPermissions = (permissionList) => {
    if (!Array.isArray(permissionList) || permissionList.length === 0) return false;
    return permissionList.every(permission => hasPermission(permission));
  };

  /**
   * Get permissions for a specific module
   * @param {string} module - Module name (e.g., 'brands', 'roles', 'users')
   * @returns {object} - Object with permission flags for the module
   */
  const getModulePermissions = (module) => {
    if (!module) return {};
    
    const modulePrefix = `${module}_`;
    const modulePermissions = {};
    
    // Standard CRUD permissions
    const crudOperations = ['create', 'read', 'update', 'delete'];
    
    crudOperations.forEach(operation => {
      const permissionName = `${modulePrefix}${operation}`;
      modulePermissions[operation] = hasPermission(permissionName);
    });
    
    // Add any additional permissions that start with module prefix
    Object.keys(permissions).forEach(permissionName => {
      if (permissionName.startsWith(modulePrefix)) {
        const operation = permissionName.replace(modulePrefix, '');
        if (!crudOperations.includes(operation)) {
          modulePermissions[operation] = hasPermission(permissionName);
        }
      }
    });
    
    return modulePermissions;
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getModulePermissions,
    
    // Convenience flags for common checks
    isAdmin: hasPermission('admin') || user?.role?.name === 'admin' || user?.role?.name === 'super_admin',
    isSuperAdmin: hasPermission('super_admin') || user?.role?.name === 'super_admin',
    
    // Module-specific permission objects
    brands: getModulePermissions('brands'),
    roles: getModulePermissions('roles'),
    users: getModulePermissions('users'),
    campaigns: getModulePermissions('campaigns'),
    reports: getModulePermissions('reports'),
  };
};

export default usePermissions;
