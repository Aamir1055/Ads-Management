const { pool } = require('../config/database');

/**
 * Middleware to check if user has specific permission
 * @param {string} permissionName - The permission to check (e.g., 'users_read', 'campaign_data_create')
 * @returns {Function} Express middleware function
 */
const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated (should have been done by protect middleware)
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.id;
      const roleId = req.user.role_id;

      // Check if user has the required permission through their role
      const [permissions] = await pool.query(`
        SELECT p.name 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.name = ? AND p.is_active = 1
        LIMIT 1
      `, [roleId, permissionName]);

      if (permissions.length === 0) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${permissionName}`,
          userRole: req.user.role_id,
          requiredPermission: permissionName
        });
      }

      // Permission granted, continue to next middleware
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware to check if user has any permission in a category (module)
 * @param {string} categoryName - The category/module to check (e.g., 'users', 'campaign_data')
 * @returns {Function} Express middleware function
 */
const requireModuleAccess = (categoryName) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.id;
      const roleId = req.user.role_id;

      // Check if user has any permission in the specified category
      const [permissions] = await pool.query(`
        SELECT p.name 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.category = ? AND p.is_active = 1
        LIMIT 1
      `, [roleId, categoryName]);

      if (permissions.length === 0) {
        return res.status(403).json({
          success: false,
          message: `Access denied. No permissions for module: ${categoryName}`,
          userRole: req.user.role_id,
          requiredModule: categoryName
        });
      }

      // Module access granted, continue to next middleware
      next();
    } catch (error) {
      console.error('Module access check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Module access check failed'
      });
    }
  };
};

/**
 * Middleware to get user's effective permissions and attach to request
 * @returns {Function} Express middleware function
 */
const attachUserPermissions = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(); // No user, skip
    }

    const roleId = req.user.role_id;

    // Get user's permissions
    const [permissions] = await pool.query(`
      SELECT 
        p.name as permission_name,
        p.category,
        p.display_name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ? AND p.is_active = 1
      ORDER BY p.category, p.name
    `, [roleId]);

    // Organize permissions by category
    const permissionsByCategory = {};
    const allPermissions = [];
    
    permissions.forEach(perm => {
      if (!permissionsByCategory[perm.category]) {
        permissionsByCategory[perm.category] = [];
      }
      permissionsByCategory[perm.category].push(perm.permission_name);
      allPermissions.push(perm.permission_name);
    });

    // Attach to request for use in routes
    req.userPermissions = allPermissions;
    req.userPermissionsByCategory = permissionsByCategory;
    
    // Helper function to check permissions
    req.hasPermission = (permissionName) => {
      return allPermissions.includes(permissionName);
    };

    // Helper function to check module access
    req.hasModuleAccess = (categoryName) => {
      return permissionsByCategory[categoryName] && permissionsByCategory[categoryName].length > 0;
    };

    next();
  } catch (error) {
    console.error('Error attaching user permissions:', error);
    next(); // Don't block the request
  }
};

/**
 * Middleware factory that checks multiple permissions (user needs at least one)
 * @param {string[]} permissionNames - Array of permission names
 * @returns {Function} Express middleware function
 */
const requireAnyPermission = (permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const roleId = req.user.role_id;

      // Check if user has any of the required permissions
      const placeholders = permissionNames.map(() => '?').join(',');
      const [permissions] = await pool.query(`
        SELECT p.name 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.name IN (${placeholders}) AND p.is_active = 1
        LIMIT 1
      `, [roleId, ...permissionNames]);

      if (permissions.length === 0) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permissions (any): ${permissionNames.join(', ')}`,
          userRole: req.user.role_id,
          requiredPermissions: permissionNames
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

module.exports = {
  requirePermission,
  requireModuleAccess,
  requireAnyPermission,
  attachUserPermissions
};
