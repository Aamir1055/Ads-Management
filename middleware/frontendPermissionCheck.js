const { pool } = require('../config/database');

/**
 * Middleware that adds permission information to authenticated users
 * Works with your existing authMiddleware system
 * Does NOT block requests - just adds permission data for frontend to use
 */
const attachUserPermissions = async (req, res, next) => {
  try {
    // Check if user is authenticated and has user data
    if (req.user && req.user.id && req.user.role_id) {
      const userId = req.user.id;
      const roleId = req.user.role_id;

      // Get user's permissions from database
      const [permissions] = await pool.query(`
        SELECT 
          p.name as permission_name,
          p.category,
          p.display_name,
          p.description
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.is_active = 1
        ORDER BY p.category, p.name
      `, [roleId]);

      // Organize permissions by category for easy frontend access
      const permissionsByCategory = {};
      const allPermissions = [];
      
      permissions.forEach(perm => {
        if (!permissionsByCategory[perm.category]) {
          permissionsByCategory[perm.category] = [];
        }
        permissionsByCategory[perm.category].push({
          name: perm.permission_name,
          display_name: perm.display_name,
          description: perm.description
        });
        allPermissions.push(perm.permission_name);
      });

      // Attach to request object
      req.userPermissions = allPermissions;
      req.userPermissionsByCategory = permissionsByCategory;
      
      // Helper functions
      req.hasPermission = (permissionName) => {
        return allPermissions.includes(permissionName);
      };
      
      req.hasModuleAccess = (categoryName) => {
        return permissionsByCategory[categoryName] && permissionsByCategory[categoryName].length > 0;
      };

      // Get user's role information
      const [roleInfo] = await pool.query(`
        SELECT name, description, level
        FROM roles 
        WHERE id = ?
      `, [roleId]);

      if (roleInfo.length > 0) {
        req.userRole = roleInfo[0];
      }
    }

    // Always continue to next middleware - never block
    next();
  } catch (error) {
    console.error('Error attaching user permissions:', error);
    // Don't block request even if permission lookup fails
    next();
  }
};

/**
 * Middleware to add permission information to API responses
 * Useful for frontend to know what user can access
 */
const addPermissionsToResponse = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to add permissions
  res.json = function(body) {
    // Only add permissions if user is authenticated and has permissions
    if (req.user && req.userPermissions) {
      // If response is successful and has data, add permission info
      if (body && body.success !== false) {
        body.userPermissions = {
          all: req.userPermissions,
          byCategory: req.userPermissionsByCategory,
          role: req.userRole
        };
      }
    }
    
    // Call original json method
    return originalJson.call(this, body);
  };
  
  next();
};

/**
 * Simple permission checker that adds warning to response if user lacks permission
 * Does NOT block access - just warns
 */
const checkPermissionSoft = (requiredPermission) => {
  return (req, res, next) => {
    if (req.user && req.userPermissions) {
      if (!req.hasPermission(requiredPermission)) {
        // Add warning but don't block
        req.permissionWarning = `User may not have required permission: ${requiredPermission}`;
        console.warn(`Permission Warning: User ${req.user.id} accessing without ${requiredPermission}`);
      }
    }
    next();
  };
};

/**
 * Route-specific permission info for frontend
 */
const getRoutePermissions = (req, res, next) => {
  const route = req.route?.path || req.originalUrl;
  const method = req.method;
  
  // Map routes to required permissions (customize as needed)
  const routePermissionMap = {
    '/api/user-management': {
      'GET': 'users_read',
      'POST': 'users_create',
      'PUT': 'users_update', 
      'DELETE': 'users_delete'
    },
    '/api/campaign-data': {
      'GET': 'campaign_data_read',
      'POST': 'campaign_data_create',
      'PUT': 'campaign_data_update',
      'DELETE': 'campaign_data_delete'
    }
  };
  
  // Add route permission info to request
  for (const [routePattern, permissions] of Object.entries(routePermissionMap)) {
    if (req.originalUrl.startsWith(routePattern)) {
      req.routeRequiredPermission = permissions[method];
      break;
    }
  }
  
  next();
};

module.exports = {
  attachUserPermissions,
  addPermissionsToResponse,
  checkPermissionSoft,
  getRoutePermissions
};
