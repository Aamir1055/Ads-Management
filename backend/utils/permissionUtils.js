const { pool } = require('../config/database');

/**
 * Permission Utility Functions
 * 
 * These utilities make it easier to check permissions within controllers
 * and provide consistent error responses throughout the application.
 */

/**
 * Check if a user has a specific permission
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @param {string} module - Module name
 * @param {string} action - Action name
 * @param {object} options - Additional options
 * @returns {Promise<object>} Permission check result
 */
const checkUserPermission = async (userId, roleId, module, action, options = {}) => {
  try {
    const permissionName = options.useNewFormat ? `${module}.${action}` : `${module}_${action}`;
    const fallbackPermissionName = options.useNewFormat ? `${module}_${action}` : `${module}.${action}`;

    // Check if user has the required permission
    const [permissions] = await pool.query(`
      SELECT p.name, p.permission_key, r.name as role_name, r.level as role_level,
             m.module_name, m.description as module_description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN roles r ON rp.role_id = r.id
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE rp.role_id = ? AND (p.name = ? OR p.permission_key = ? OR p.name = ? OR p.permission_key = ?) 
      AND p.is_active = 1
      LIMIT 1
    `, [roleId, permissionName, permissionName, fallbackPermissionName, fallbackPermissionName]);

    if (permissions.length === 0) {
      // Get available permissions for this module
      const [availablePermissions] = await pool.query(`
        SELECT p.name, p.permission_key, p.permission_name as action_name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        LEFT JOIN modules m ON p.module_id = m.id
        WHERE rp.role_id = ? AND (m.module_name = ? OR p.name LIKE ?)
        AND p.is_active = 1
      `, [roleId, module, `${module}_%`]);

      const availableActions = availablePermissions.map(p => {
        const actionMatch = p.name.match(new RegExp(`${module}[._](.+)`)) || p.permission_key.match(new RegExp(`${module}\\.(.+)`));
        return actionMatch ? actionMatch[1] : p.action_name || p.permission_name;
      }).filter(Boolean);

      return {
        hasPermission: false,
        permission: null,
        availableActions,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: availableActions.length > 0 
            ? `You don't have permission to ${action} ${module}. You can only: ${availableActions.join(', ')}.`
            : `You don't have any permissions for the ${module} module.`,
          suggestion: availableActions.length > 0 
            ? `Try using one of these actions: ${availableActions.join(', ')}`
            : `Contact your administrator to request ${module} permissions`
        }
      };
    }

    return {
      hasPermission: true,
      permission: permissions[0],
      availableActions: null,
      error: null
    };
  } catch (error) {
    console.error('Permission check error:', error);
    return {
      hasPermission: false,
      permission: null,
      availableActions: null,
      error: {
        code: 'PERMISSION_CHECK_ERROR',
        message: 'Permission check failed',
        details: error.message
      }
    };
  }
};

/**
 * Get all permissions for a user's role grouped by module
 * @param {number} roleId - Role ID
 * @returns {Promise<object>} Permissions grouped by module
 */
const getUserPermissionsByModule = async (roleId) => {
  try {
    const [permissions] = await pool.query(`
      SELECT 
        p.name as permission_name,
        p.permission_key,
        p.permission_name as action_name,
        m.module_name,
        m.description as module_description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE rp.role_id = ? AND p.is_active = 1
      ORDER BY m.module_name, p.permission_name
    `, [roleId]);

    const permissionsByModule = {};
    const allPermissions = [];
    
    permissions.forEach(perm => {
      const moduleName = perm.module_name || 'general';
      
      if (!permissionsByModule[moduleName]) {
        permissionsByModule[moduleName] = {
          module: moduleName,
          description: perm.module_description,
          permissions: [],
          actions: []
        };
      }

      permissionsByModule[moduleName].permissions.push(perm.permission_name || perm.permission_key);
      
      // Extract action from permission name
      const actionMatch = (perm.permission_name || perm.permission_key).match(new RegExp(`${moduleName}[._](.+)`));
      const action = actionMatch ? actionMatch[1] : perm.action_name;
      
      if (action && !permissionsByModule[moduleName].actions.includes(action)) {
        permissionsByModule[moduleName].actions.push(action);
      }

      allPermissions.push(perm.permission_name || perm.permission_key);
    });

    return {
      byModule: permissionsByModule,
      allPermissions: allPermissions,
      moduleList: Object.keys(permissionsByModule)
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    throw error;
  }
};

/**
 * Create a standardized permission error response
 * @param {string} module - Module name
 * @param {string} action - Action name
 * @param {array} availableActions - Available actions for the user
 * @param {string} userRole - User's role name
 * @returns {object} Standardized error response
 */
const createPermissionError = (module, action, availableActions = [], userRole = 'Unknown') => {
  const errorMessage = availableActions.length > 0 
    ? `You don't have permission to ${action} ${module}. You can only: ${availableActions.join(', ')}.`
    : `You don't have any permissions for the ${module} module.`;

  return {
    success: false,
    message: `Access denied. ${errorMessage}`,
    code: 'INSUFFICIENT_PERMISSIONS',
    details: {
      userRole: userRole,
      requiredPermission: `${module}_${action}`,
      action: action,
      module: module,
      availableActions: availableActions,
      suggestion: availableActions.length > 0 
        ? `Try using one of these actions: ${availableActions.join(', ')}`
        : `Contact your administrator to request ${module} permissions`
    }
  };
};

/**
 * Middleware factory for checking permissions within controllers
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {string} module - Module name
 * @param {string} action - Action name
 * @returns {Promise<boolean>} Returns true if permission granted, sends error response if denied
 */
const requirePermissionInController = async (req, res, module, action) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return false;
    }

    // 🔥 SUPERADMIN BYPASS: SuperAdmin has access to EVERYTHING
    const [roleInfo] = await pool.query('SELECT name, level FROM roles WHERE id = ? LIMIT 1', [req.user.role_id]);
    
    if (roleInfo.length > 0) {
      const roleName = roleInfo[0].name;
      const roleLevel = roleInfo[0].level;
      
      // SuperAdmin bypasses ALL permission checks
      if (roleName === 'SuperAdmin' || roleName === 'Super Admin' || roleName === 'super_admin' || roleLevel >= 10) {
        console.log(`🔥 SuperAdmin controller access granted: ${roleName} can ${action} ${module}`);
        req.currentPermission = {
          module: module,
          action: action,
          permissionName: `${module}_${action}`,
          roleLevel: roleLevel,
          isSuperAdmin: true,
          bypassReason: 'SuperAdmin has unrestricted access'
        };
        return true;
      }
    }

    const permissionCheck = await checkUserPermission(
      req.user.id, 
      req.user.role_id, 
      module, 
      action
    );

    if (!permissionCheck.hasPermission) {
      const [roleInfo] = await pool.query('SELECT name FROM roles WHERE id = ? LIMIT 1', [req.user.role_id]);
      const roleName = roleInfo.length > 0 ? roleInfo[0].name : 'Unknown';
      
      const errorResponse = createPermissionError(
        module, 
        action, 
        permissionCheck.availableActions, 
        roleName
      );

      res.status(403).json(errorResponse);
      return false;
    }

    // Store permission info in request for later use
    req.currentPermission = {
      module: module,
      action: action,
      permissionName: `${module}_${action}`,
      roleLevel: permissionCheck.permission.role_level
    };

    return true;
  } catch (error) {
    console.error('Controller permission check error:', error);
    res.status(500).json({
      success: false,
      message: 'Permission check failed',
      code: 'PERMISSION_CHECK_ERROR'
    });
    return false;
  }
};

/**
 * Check if user has multiple permissions (requires ALL)
 * @param {number} roleId - Role ID
 * @param {Array<{module: string, action: string}>} permissionList - List of required permissions
 * @returns {Promise<object>} Permission check result
 */
const checkMultiplePermissions = async (roleId, permissionList) => {
  try {
    const results = await Promise.all(
      permissionList.map(({module, action}) => 
        checkUserPermission(null, roleId, module, action)
      )
    );

    const missingPermissions = [];
    const grantedPermissions = [];

    results.forEach((result, index) => {
      const {module, action} = permissionList[index];
      if (result.hasPermission) {
        grantedPermissions.push(`${module}.${action}`);
      } else {
        missingPermissions.push(`${module}.${action}`);
      }
    });

    return {
      hasAllPermissions: missingPermissions.length === 0,
      grantedPermissions,
      missingPermissions,
      details: results
    };
  } catch (error) {
    console.error('Multiple permissions check error:', error);
    throw error;
  }
};

/**
 * Check if user has at least one of the specified permissions (requires ANY)
 * @param {number} roleId - Role ID
 * @param {Array<{module: string, action: string}>} permissionList - List of permissions (user needs at least one)
 * @returns {Promise<object>} Permission check result
 */
const checkAnyPermission = async (roleId, permissionList) => {
  try {
    const results = await Promise.all(
      permissionList.map(({module, action}) => 
        checkUserPermission(null, roleId, module, action)
      )
    );

    const grantedPermissions = [];
    results.forEach((result, index) => {
      const {module, action} = permissionList[index];
      if (result.hasPermission) {
        grantedPermissions.push(`${module}.${action}`);
      }
    });

    return {
      hasAnyPermission: grantedPermissions.length > 0,
      grantedPermissions,
      requiredPermissions: permissionList.map(({module, action}) => `${module}.${action}`)
    };
  } catch (error) {
    console.error('Any permission check error:', error);
    throw error;
  }
};

module.exports = {
  checkUserPermission,
  getUserPermissionsByModule,
  createPermissionError,
  requirePermissionInController,
  checkMultiplePermissions,
  checkAnyPermission
};
