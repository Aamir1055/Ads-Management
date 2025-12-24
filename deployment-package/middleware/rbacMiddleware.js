const { pool } = require('../config/database');
const { attachUserPermissions } = require('./permissionCheck');

/**
 * RBAC middleware with module-specific permission checking
 * 
 * This middleware provides:
 * 1. Module-specific permission checks (e.g., users.read, users.create)
 * 2. Clear error messages when access is denied
 * 3. Support for advertiser role restrictions
 */

/**
 * Check if user has specific permission for a module action
 * @param {string} module - Module name (e.g., 'users', 'campaigns')
 * @param {string} action - Action type ('read', 'create', 'update', 'delete')
 * @param {object} options - Additional options for permission checking
 * @returns {Function} Express middleware function
 */
const checkModulePermission = (module, action, options = {}) => {
    return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userId = req.user.id;
      const roleId = req.user.role ? req.user.role.id : req.user.role_id; // Support both structures
      
            
      // 🔥 SUPERADMIN BYPASS: SuperAdmin has access to EVERYTHING
      const [roleInfo] = await pool.query(`
        SELECT name, level FROM roles WHERE id = ? LIMIT 1
      `, [roleId]);
      
      if (roleInfo.length > 0) {
        const roleName = roleInfo[0].name;
        const roleLevel = roleInfo[0].level;
        
        // SuperAdmin bypasses ALL permission checks
        if (roleName === 'SuperAdmin' || roleName === 'Super Admin' || roleName === 'super_admin' || roleLevel >= 10) {
          console.log(`🔥 SuperAdmin access granted: ${roleName} can ${action} ${module}`);
          req.currentPermission = {
            module: module,
            action: action,
            permissionName: `${module}_${action}`,
            roleLevel: roleLevel,
            isSuperAdmin: true,
            bypassReason: 'SuperAdmin has unrestricted access'
          };
          return next();
        }
      }
      
      // Support both old format (module_action) and new format (module.action)
      const permissionName = options.useNewFormat ? `${module}.${action}` : `${module}_${action}`;
      const fallbackPermissionName = options.useNewFormat ? `${module}_${action}` : `${module}.${action}`;

    // 🐛 DEBUG: Add detailed logging for cards permission issue
    if (module === 'cards' && action === 'read') {
      console.log('🔍 RBAC DEBUG - Cards Read Permission Check:');
      console.log('   User ID:', userId);
      console.log('   Role ID:', roleId);
      console.log('   Module:', module);
      console.log('   Action:', action);
      console.log('   Permission Name:', permissionName);
      console.log('   Fallback Permission Name:', fallbackPermissionName);
    }

    // Check if user has the required permission through their role
          const [permissions] = await pool.query(`
      SELECT p.name, r.name as role_name, r.level as role_level, p.category as module_name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN roles r ON rp.role_id = r.id
      WHERE rp.role_id = ? AND p.name = ?
      AND p.is_active = 1
      LIMIT 1
    `, [roleId, permissionName]);
    
    // 🐛 DEBUG: Log the query result for cards
    if (module === 'cards' && action === 'read') {
      console.log('   Query Result:', permissions.length > 0 ? permissions[0] : 'NO PERMISSIONS FOUND');
      
      if (permissions.length === 0) {
        // Try to see what permissions this role actually has
        const [allRolePermissions] = await pool.query(`
          SELECT p.name, p.display_name
          FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = ? AND p.is_active = 1
        `, [roleId]);
        console.log('   All Role Permissions:', allRolePermissions.map(p => p.name));
      }
    }

            if (permissions.length === 0) {
        // Get user's role name and available permissions for better error message
        const [roleInfo] = await pool.query(`
          SELECT r.name, r.level, r.description
          FROM roles r WHERE r.id = ? LIMIT 1
        `, [roleId]);

        // Get available actions for this module that user has
        const [availablePermissions] = await pool.query(`
          SELECT p.name, p.display_name as action_name, p.category as module_name
          FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = ? AND (p.category = ? OR p.name LIKE ?)
          AND p.is_active = 1
        `, [roleId, module, `${module}_%`]);
        
        const roleName = roleInfo.length > 0 ? roleInfo[0].name : 'Unknown';
        const availableActions = availablePermissions.map(p => {
          // Extract action from permission name
          const actionMatch = p.name.match(new RegExp(`${module}[._](.+)`));
          return actionMatch ? actionMatch[1] : p.action_name;
        }).filter(Boolean);
        
        const errorMessage = availableActions.length > 0 
          ? `You don't have permission to ${action} ${module}. You can only: ${availableActions.join(', ')}.`
          : `You don't have any permissions for the ${module} module.`;
        
        return res.status(403).json({
          success: false,
          message: `Access denied. ${errorMessage}`,
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            userRole: roleName,
            requiredPermission: permissionName,
            action: action,
            module: module,
            availableActions: availableActions,
            suggestion: availableActions.length > 0 
              ? `Try using one of these actions: ${availableActions.join(', ')}`
              : `Contact your administrator to request ${module} permissions`
          }
        });
      }

      // Store permission info in request for later use
      req.currentPermission = {
        module: module,
        action: action,
        permissionName: permissionName,
        roleLevel: permissions[0].role_level
      };

      // Permission granted, continue to next middleware
      next();
    } catch (error) {
      console.error('RBAC permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Module permission factories
 * These create middleware functions for specific module/action combinations
 */
const modulePermissions = {
  users: {
    read: checkModulePermission('users', 'read'),
    create: checkModulePermission('users', 'create'),
    update: checkModulePermission('users', 'update'),
    delete: checkModulePermission('users', 'delete')
  },
  campaigns: {
    read: checkModulePermission('campaigns', 'read'),
    create: checkModulePermission('campaigns', 'create'),
    update: checkModulePermission('campaigns', 'update'),
    delete: checkModulePermission('campaigns', 'delete')
  },
  ads: {
    read: checkModulePermission('ads', 'read'),
    create: checkModulePermission('ads', 'create'),
    update: checkModulePermission('ads', 'update'),
    delete: checkModulePermission('ads', 'delete')
  },
  reports: {
    read: checkModulePermission('reports', 'read'),
    create: checkModulePermission('reports', 'create'),
    update: checkModulePermission('reports', 'update'),
    delete: checkModulePermission('reports', 'delete')
  },
  cards: {
    read: checkModulePermission('cards', 'read'),
    create: checkModulePermission('cards', 'create'),
    update: checkModulePermission('cards', 'update'),
    delete: checkModulePermission('cards', 'delete')
  },
  accounts: {
    read: checkModulePermission('accounts', 'read'),
    create: checkModulePermission('accounts', 'create'),
    update: checkModulePermission('accounts', 'update'),
    delete: checkModulePermission('accounts', 'delete')
  },
  modules: {
    read: checkModulePermission('modules', 'read'),
    create: checkModulePermission('modules', 'create'),
    update: checkModulePermission('modules', 'update'),
    delete: checkModulePermission('modules', 'delete')
  },
  permissions: {
    read: checkModulePermission('permissions', 'read'),
    create: checkModulePermission('permissions', 'create'),
    update: checkModulePermission('permissions', 'update'),
    delete: checkModulePermission('permissions', 'delete')
  },
  campaign_data: {
    read: checkModulePermission('campaign_data', 'read'),
    create: checkModulePermission('campaign_data', 'create'),
    update: checkModulePermission('campaign_data', 'update'),
    delete: checkModulePermission('campaign_data', 'delete')
  },
  brands: {
    read: checkModulePermission('brands', 'read'),
    create: checkModulePermission('brands', 'create'),
    update: checkModulePermission('brands', 'update'),
    delete: checkModulePermission('brands', 'delete')
  },
  campaign_types: {
    read: checkModulePermission('campaign_types', 'read'),
    create: checkModulePermission('campaign_types', 'create'),
    update: checkModulePermission('campaign_types', 'update'),
    delete: checkModulePermission('campaign_types', 'delete')
  },
  roles: {
    read: checkModulePermission('roles', 'read'),
    create: checkModulePermission('roles', 'create'),
    update: checkModulePermission('roles', 'update'),
    delete: checkModulePermission('roles', 'delete')
  }
};

/**
 * Middleware to check if user has admin-level access
 * @returns {Function} Express middleware function
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const roleId = req.user.role ? req.user.role.id : req.user.role_id; // Support both structures

    // Check if user has admin role OR SuperAdmin (SuperAdmin can do everything)
    const [roleInfo] = await pool.query(`
      SELECT name, level FROM roles 
      WHERE id = ? AND (name = 'Admin' OR name = 'SuperAdmin' OR name = 'Super Admin' OR level >= 8)
      LIMIT 1
    `, [roleId]);

    if (roleInfo.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required. This action is restricted to administrators only.'
      });
    }

    // If SuperAdmin, log the bypass
    if (roleInfo[0].name === 'SuperAdmin' || roleInfo[0].name === 'Super Admin' || roleInfo[0].level >= 10) {
      console.log(`🔥 SuperAdmin bypassing admin check: ${roleInfo[0].name}`);
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Admin access check failed'
    });
  }
};

/**
 * Middleware to check if user has manager-level access or higher
 * @returns {Function} Express middleware function
 */
const requireManagerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const roleId = req.user.role ? req.user.role.id : req.user.role_id; // Support both structures

    // Check if user has manager or admin role
    const [roleInfo] = await pool.query(`
      SELECT name, level FROM roles 
      WHERE id = ? AND name IN ('Admin', 'Manager') 
      LIMIT 1
    `, [roleId]);

    if (roleInfo.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Manager or Admin access required. This action requires elevated permissions.'
      });
    }

    next();
  } catch (error) {
    console.error('Manager/Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access level check failed'
    });
  }
};

/**
 * Middleware to check if user has SuperAdmin access (for master data modules)
 * @returns {Function} Express middleware function
 */
const requireSuperAdmin = async (req, res, next) => {
  try {
    const ts = new Date().toISOString();
    console.log('\n🟡 ================================================');
    console.log('🔍 [SuperAdmin Check] Starting check at:', ts);
    console.log('🔍 [SuperAdmin Check] Request details:', {
      method: req.method,
      originalUrl: req.originalUrl,
      headers: {
        authorization: req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : 'NONE',
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']?.substring(0, 50)
      },
      body: req.body ? JSON.stringify(req.body).substring(0, 100) : 'No body'
    });
    console.log('🔍 [SuperAdmin Check] Request user:', {
      exists: !!req.user,
      id: req.user?.id,
      username: req.user?.username,
      role_id: req.user?.role_id,
      role: req.user?.role
    });
    
    if (!req.user || !req.user.id) {
      console.log('❌ [SuperAdmin Check] No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get role ID from the correct location
    const roleId = req.user.role ? req.user.role.id : req.user.role_id; // Support both structures
    console.log('🔍 [SuperAdmin Check] Using role ID:', roleId);
    console.log('🔍 [SuperAdmin Check] Role structure:', {
      hasRoleObject: !!req.user.role,
      roleName: req.user.role?.name,
      roleLevel: req.user.role?.level,
      fallbackRoleId: req.user.role_id
    });

    // Check if user has SuperAdmin role (support multiple naming conventions OR high privilege level)
    const [roleInfo] = await pool.query(`
      SELECT name, level FROM roles 
      WHERE id = ?
      LIMIT 1
    `, [roleId]);

    if (roleInfo.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdmin access required. This master data module can only be modified by SuperAdmin users.',
        details: {
          reason: 'Master data access restriction',
          requiredRole: 'SuperAdmin',
          currentAction: 'Master data modification'
        }
      });
    }

    const roleName = roleInfo[0].name || '';
    const roleLevel = Number(roleInfo[0].level) || 0;

    const isSuperAdmin = (
      roleLevel >= 10 ||
      roleName === 'SuperAdmin' ||
      roleName === 'Super Admin' ||
      roleName === 'super_admin' ||
      roleName === 'superadmin' ||
      roleName === 'SUPERADMIN'
    );

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdmin access required. This master data module can only be modified by SuperAdmin users.',
        details: {
          reason: 'Master data access restriction',
          requiredRole: 'SuperAdmin',
          currentAction: 'Master data modification'
        }
      });
    }

    // If SuperAdmin, log the bypass
    console.log(`🔥 SuperAdmin bypassing admin check: ${roleName} (level ${roleLevel})`);

    next();
  } catch (error) {
    console.error('SuperAdmin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'SuperAdmin access check failed'
    });
  }
};

/**
 * Advanced dynamic permission checking middleware
 * These middleware functions provide more sophisticated permission checking
 */

/**
 * Check permissions dynamically based on route parameters or request data
 * @param {Function} moduleResolver - Function that returns module name based on request
 * @param {Function} actionResolver - Function that returns action name based on request
 * @param {object} options - Additional options
 * @returns {Function} Express middleware function
 */
const checkDynamicPermission = (moduleResolver, actionResolver, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Resolve module and action dynamically
      const module = typeof moduleResolver === 'function' ? moduleResolver(req) : moduleResolver;
      const action = typeof actionResolver === 'function' ? actionResolver(req) : actionResolver;

      if (!module || !action) {
        return res.status(400).json({
          success: false,
          message: 'Could not determine required permission from request',
          code: 'PERMISSION_RESOLUTION_ERROR'
        });
      }

      // Use the existing checkModulePermission logic
      const permissionMiddleware = checkModulePermission(module, action, options);
      return permissionMiddleware(req, res, next);

    } catch (error) {
      console.error('Dynamic permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Dynamic permission check failed',
        code: 'DYNAMIC_PERMISSION_ERROR'
      });
    }
  };
};

/**
 * Middleware that checks multiple permissions (user must have ALL)
 * @param {Array<{module: string, action: string}>} permissionList - List of required permissions
 * @returns {Function} Express middleware function
 */
const requireAllPermissions = (permissionList) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const roleId = req.user.role ? req.user.role.id : req.user.role_id; // Support both structures
      
      // 🔥 SUPERADMIN BYPASS: SuperAdmin has access to EVERYTHING
      const [roleInfo] = await pool.query('SELECT name, level FROM roles WHERE id = ? LIMIT 1', [roleId]);
      
      if (roleInfo.length > 0) {
        const roleName = roleInfo[0].name;
        const roleLevel = roleInfo[0].level;
        
        // SuperAdmin bypasses ALL permission checks
        if (roleName === 'SuperAdmin' || roleName === 'Super Admin' || roleName === 'super_admin' || roleLevel >= 10) {
          console.log(`🔥 SuperAdmin bypass for multiple permissions: ${roleName}`);
          req.grantedPermissions = permissionList.map(p => `${p.module}.${p.action}`);
          req.currentPermission = {
            roleLevel: roleLevel,
            isSuperAdmin: true,
            bypassReason: 'SuperAdmin has unrestricted access'
          };
          return next();
        }
      }
      const missingPermissions = [];
      const grantedPermissions = [];

      // Check each permission
      for (const {module, action} of permissionList) {
        const permissionName = `${module}_${action}`;
        const fallbackPermissionName = `${module}.${action}`;

        const [permissions] = await pool.query(`
          SELECT p.name
          FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = ? AND p.name = ?
          AND p.is_active = 1
          LIMIT 1
        `, [roleId, permissionName]);

        if (permissions.length === 0) {
          missingPermissions.push(`${module}.${action}`);
        } else {
          grantedPermissions.push(`${module}.${action}`);
        }
      }

      if (missingPermissions.length > 0) {
        const [roleInfo] = await pool.query('SELECT name FROM roles WHERE id = ? LIMIT 1', [roleId]);
        const roleName = roleInfo.length > 0 ? roleInfo[0].name : 'Unknown';

        return res.status(403).json({
          success: false,
          message: `Access denied. You are missing required permissions: ${missingPermissions.join(', ')}.`,
          code: 'MISSING_MULTIPLE_PERMISSIONS',
          details: {
            userRole: roleName,
            grantedPermissions: grantedPermissions,
            missingPermissions: missingPermissions,
            requiredPermissions: permissionList.map(p => `${p.module}.${p.action}`),
            suggestion: 'Contact your administrator to request the missing permissions'
          }
        });
      }

      // Store all granted permissions info
      req.grantedPermissions = grantedPermissions;
      next();
    } catch (error) {
      console.error('Multiple permissions check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Multiple permissions check failed',
        code: 'MULTIPLE_PERMISSIONS_ERROR'
      });
    }
  };
};

/**
 * Middleware that checks multiple permissions (user must have ANY)
 * @param {Array<{module: string, action: string}>} permissionList - List of permissions (user needs at least one)
 * @returns {Function} Express middleware function
 */
const requireAnyPermissions = (permissionList) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const roleId = req.user.role ? req.user.role.id : req.user.role_id; // Support both structures
      
      // 🔥 SUPERADMIN BYPASS: SuperAdmin has access to EVERYTHING
      const [roleInfo] = await pool.query('SELECT name, level FROM roles WHERE id = ? LIMIT 1', [roleId]);
      
      if (roleInfo.length > 0) {
        const roleName = roleInfo[0].name;
        const roleLevel = roleInfo[0].level;
        
        // SuperAdmin bypasses ALL permission checks
        if (roleName === 'SuperAdmin' || roleName === 'Super Admin' || roleName === 'super_admin' || roleLevel >= 10) {
          console.log(`🔥 SuperAdmin bypass for any permissions: ${roleName}`);
          req.currentPermission = {
            module: permissionList[0].module,
            action: permissionList[0].action,
            permissionName: `${permissionList[0].module}_${permissionList[0].action}`,
            roleLevel: roleLevel,
            isSuperAdmin: true,
            bypassReason: 'SuperAdmin has unrestricted access'
          };
          return next();
        }
      }
      
      let grantedPermission = null;

      // Check each permission until we find one they have
      for (const {module, action} of permissionList) {
        const permissionName = `${module}_${action}`;
        const fallbackPermissionName = `${module}.${action}`;

        const [permissions] = await pool.query(`
          SELECT p.name, r.name as role_name, r.level as role_level
          FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          JOIN roles r ON rp.role_id = r.id
          WHERE rp.role_id = ? AND p.name = ?
          AND p.is_active = 1
          LIMIT 1
        `, [roleId, permissionName]);

        if (permissions.length > 0) {
          grantedPermission = {
            module,
            action,
            permissionName,
            roleLevel: permissions[0].role_level
          };
          break;
        }
      }

      if (!grantedPermission) {
        const [roleInfo] = await pool.query('SELECT name FROM roles WHERE id = ? LIMIT 1', [roleId]);
        const roleName = roleInfo.length > 0 ? roleInfo[0].name : 'Unknown';

        return res.status(403).json({
          success: false,
          message: `Access denied. You need at least one of these permissions: ${permissionList.map(p => `${p.module}.${p.action}`).join(', ')}.`,
          code: 'INSUFFICIENT_ANY_PERMISSIONS',
          details: {
            userRole: roleName,
            requiredAnyOf: permissionList.map(p => `${p.module}.${p.action}`),
            suggestion: 'Contact your administrator to request at least one of these permissions'
          }
        });
      }

      // Store the granted permission info
      req.currentPermission = grantedPermission;
      next();
    } catch (error) {
      console.error('Any permissions check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Any permissions check failed',
        code: 'ANY_PERMISSIONS_ERROR'
      });
    }
  };
};

/**
 * Middleware that checks resource ownership in addition to permissions
 * @param {string} module - Module name
 * @param {string} action - Action name
 * @param {Function} ownershipChecker - Function that checks if user owns the resource
 * @returns {Function} Express middleware function
 */
const checkPermissionWithOwnership = (module, action, ownershipChecker) => {
  return async (req, res, next) => {
    // First check the permission
    const permissionMiddleware = checkModulePermission(module, action);
    
    return permissionMiddleware(req, res, async (permissionError) => {
      if (permissionError) {
        return next(permissionError);
      }

      // If permission check passed, now check ownership
      try {
        const hasOwnership = await ownershipChecker(req);
        
        if (!hasOwnership) {
          return res.status(403).json({
            success: false,
            message: `Access denied. You don't own this resource and cannot ${action} it.`,
            code: 'RESOURCE_OWNERSHIP_REQUIRED',
            details: {
              resource: req.params.id || req.params.resourceId,
              action: action,
              module: module,
              suggestion: 'You can only modify resources that you own, or contact an administrator'
            }
          });
        }

        // Both permission and ownership checks passed
        next();
      } catch (error) {
        console.error('Ownership check error:', error);
        return res.status(500).json({
          success: false,
          message: 'Ownership check failed',
          code: 'OWNERSHIP_CHECK_ERROR'
        });
      }
    });
  };
};

module.exports = {
  checkModulePermission,
  modulePermissions,
  requireAdmin,
  requireManagerOrAdmin,
  requireSuperAdmin,
  checkDynamicPermission,
  requireAllPermissions,
  requireAnyPermissions,
  checkPermissionWithOwnership,
  attachUserPermissions // Re-export from permissionCheck.js for convenience
};
