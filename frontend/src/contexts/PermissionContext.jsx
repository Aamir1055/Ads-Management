import React, { createContext, useContext, useState, useEffect } from 'react';
import permissionService from '../services/permissionService';

// Create the context
const PermissionContext = createContext();

// Permission context provider component
export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState({});
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Initialize permissions when component mounts or user changes
  useEffect(() => {
    initializePermissions();
  }, []);

  // Monitor localStorage changes (e.g., login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      const currentUser = permissionService.getCurrentUser();
      if (currentUser !== user) {
        setUser(currentUser);
        initializePermissions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const initializePermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = permissionService.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Get user permissions and roles
        const [userPermissions, userRoles] = await Promise.all([
          permissionService.getUserPermissions(currentUser.id),
          permissionService.getUserRoles(currentUser.id)
        ]);
        
        setPermissions(userPermissions);
        setRoles(userRoles);
      } else {
        // Clear permissions if no user
        setPermissions({});
        setRoles([]);
      }
    } catch (err) {
      console.error('Error initializing permissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshPermissions = async () => {
    await permissionService.refreshPermissions();
    await initializePermissions();
  };

  // Check if user has a specific permission
  const hasPermission = (permissionKey) => {
    if (!permissions || Object.keys(permissions).length === 0) return false;
    
    for (const moduleName of Object.keys(permissions)) {
      const modulePermissions = permissions[moduleName] || [];
      if (modulePermissions.some(p => p.permission_key === permissionKey)) {
        return true;
      }
    }
    return false;
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissionKeys) => {
    if (!Array.isArray(permissionKeys)) return hasPermission(permissionKeys);
    return permissionKeys.some(permission => hasPermission(permission));
  };

  // Check if user has access to a module
  const hasModuleAccess = (moduleName) => {
    return permissions[moduleName] && permissions[moduleName].length > 0;
  };

  // Check if user has a specific role
  const hasRole = (roleName) => {
    return roles.some(role => role.name === roleName);
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roleNames) => {
    if (!Array.isArray(roleNames)) return hasRole(roleNames);
    return roleNames.some(roleName => hasRole(roleName));
  };

  // Check if user can access a route
  const canAccessRoute = (routePath) => {
    const route = routePath.replace('/', '');
    const modulePermissions = permissionService.getModulePermissions();
    const requiredPermissions = modulePermissions[route];

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Check if user has any of the required permissions
    return hasAnyPermission(requiredPermissions);
  };

  // Get all permission keys user has
  const getAllPermissionKeys = () => {
    const allKeys = [];
    for (const moduleName of Object.keys(permissions)) {
      const modulePermissions = permissions[moduleName] || [];
      allKeys.push(...modulePermissions.map(p => p.permission_key));
    }
    return [...new Set(allKeys)]; // Remove duplicates
  };

  // Get user role levels (highest level)
  const getHighestRoleLevel = () => {
    if (!roles || roles.length === 0) return 0;
    return Math.max(...roles.map(role => role.level || 0));
  };

  // Check if user is admin (level >= 8)
  const isAdmin = () => {
    return getHighestRoleLevel() >= 8 || hasAnyRole(['Admin', 'Super Admin']);
  };

  // Check if user is super admin (level >= 10)
  const isSuperAdmin = () => {
    return getHighestRoleLevel() >= 10 || hasRole('Super Admin');
  };

  const contextValue = {
    // State
    permissions,
    roles,
    loading,
    error,
    user,
    
    // Methods
    initializePermissions,
    refreshPermissions,
    hasPermission,
    hasAnyPermission,
    hasModuleAccess,
    hasRole,
    hasAnyRole,
    canAccessRoute,
    getAllPermissionKeys,
    getHighestRoleLevel,
    isAdmin,
    isSuperAdmin
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

// Hook to use permission context
export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// Higher-order component for permission-based rendering
export const withPermission = (WrappedComponent, requiredPermission) => {
  return (props) => {
    const { hasPermission } = usePermissions();
    
    if (!hasPermission(requiredPermission)) {
      return null; // Or return a "No Permission" component
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Component for conditional rendering based on permissions
export const PermissionGuard = ({ 
  children, 
  permission, 
  permissions, 
  role, 
  roles,
  fallback = null,
  requireAll = false 
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasRole, 
    hasAnyRole 
  } = usePermissions();

  let hasAccess = true;

  // Check permissions
  if (permission && !hasPermission(permission)) hasAccess = false;
  if (permissions && permissions.length > 0) {
    const permissionCheck = requireAll 
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(permissions);
    if (!permissionCheck) hasAccess = false;
  }

  // Check roles
  if (role && !hasRole(role)) hasAccess = false;
  if (roles && roles.length > 0) {
    const roleCheck = requireAll
      ? roles.every(r => hasRole(r))
      : hasAnyRole(roles);
    if (!roleCheck) hasAccess = false;
  }

  return hasAccess ? children : fallback;
};

export default PermissionContext;
