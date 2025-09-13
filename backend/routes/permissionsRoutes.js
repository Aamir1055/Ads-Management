const express = require('express');
const router = express.Router();

const { permissionsController } = require('../controllers/permissionsController');
const { protect } = require('../middleware/auth');
const { attachUserPermissions } = require('../middleware/frontendPermissionCheck');

// Request logger (sanitized)
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Permissions API`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
};
router.use(requestLogger);

// Simple in-memory rate limiter (single instances)
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 200) => {
  const requests = new Map();
  const cleanup = () => {
    const now = Date.now();
    for (const [k, v] of requests.entries()) if (now > v.resetTime) requests.delete(k);
  };
  const interval = setInterval(cleanup, Math.min(windowMs, 5 * 60 * 1000));
  interval.unref?.();
  return (req, res, next) => {
    // If behind proxies, configure app.set('trust proxy', 1)
    const id = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let e = requests.get(id);
    if (!e || now > e.resetTime) { e = { count: 0, resetTime: now + windowMs }; requests.set(id, e); }
    if (e.count >= max) {
      const retry = Math.ceil((e.resetTime - now) / 1000);
      res.set('Retry-After', String(retry));
      return res.status(429).json({ success: false, message: 'Rate limit exceeded', retryAfter: retry });
    }
    e.count++; next();
  };
};

const rlRead = createRateLimit(5 * 60 * 1000, 300);
const rlWrite = createRateLimit(15 * 60 * 1000, 100);

// router.use(protect); // enable auth globally for this module if needed

// -------------------------------
// Roles
// -------------------------------
router.post('/roles', rlWrite, permissionsController.createRole);
router.get('/roles', rlRead, permissionsController.listRoles);
router.put('/roles/:id', rlWrite, permissionsController.updateRole);

// -------------------------------
// Modules
// -------------------------------
router.post('/modules', rlWrite, permissionsController.createModule);
router.get('/modules', rlRead, permissionsController.listModules);
router.put('/modules/:id', rlWrite, permissionsController.updateModule);

// -------------------------------
// Permissions
// -------------------------------
// body: { role_id/role_name, module_id/module_name, can_get, can_post, can_put, can_delete }
router.post('/grant', rlWrite, permissionsController.grantPermission);

// query filters: role_id/role_name, module_id/module_name
router.get('/', rlRead, permissionsController.listPermissions);

// revoke by role and module (query params)
router.delete('/', rlWrite, permissionsController.revokePermission);

// -------------------------------
// NEW ENHANCED PERMISSIONS ROUTES
// -------------------------------

// User Permissions
router.get('/user/:userId', rlRead, permissionsController.getUserPermissions);
router.get('/user/:userId/grouped', rlRead, permissionsController.getUserPermissionsGrouped);
router.get('/user/:userId/roles', rlRead, permissionsController.getUserRoles);

// Permission Checking
router.post('/check', rlRead, permissionsController.checkPermission);

// My Permissions endpoint (for frontend compatibility)
router.get('/my-permissions', protect, attachUserPermissions, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    res.json({
      success: true,
      message: 'User permissions retrieved successfully',
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          role_id: req.user.role_id
        },
        role: req.userRole,
        permissions: req.userPermissions || [],
        permissionsByCategory: req.userPermissionsByCategory || {},
        hasModuleAccess: {
          users: req.hasModuleAccess ? req.hasModuleAccess('users') : false,
          campaign_data: req.hasModuleAccess ? req.hasModuleAccess('campaign_data') : false,
          // Add other modules as needed
        }
      }
    });
  } catch (error) {
    console.error('Error getting user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user permissions'
    });
  }
});

// My Roles endpoint (for frontend compatibility)
router.get('/my-roles', protect, attachUserPermissions, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const role = req.userRole || { name: 'Unknown', description: '', level: 0 };
    
    res.json({
      success: true,
      message: 'User roles retrieved successfully',
      data: [role] // Return as array to match expected format
    });
  } catch (error) {
    console.error('Error getting user roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user roles'
    });
  }
});

// Role Assignment
router.post('/assign-role', rlWrite, permissionsController.assignRoleToUser);
router.delete('/revoke-role', rlWrite, permissionsController.revokeRoleFromUser);

// Role Management
router.post('/role', rlWrite, permissionsController.createRole); // Frontend-compatible endpoint
router.delete('/role/:id', rlWrite, permissionsController.deleteRole); // Add delete endpoint
router.get('/roles-list', rlRead, permissionsController.getAllRoles);
router.get('/permissions-list', rlRead, permissionsController.getAllPermissions);
router.get('/modules-with-permissions', rlRead, permissionsController.getModulesWithPermissions);
router.get('/role/:roleId/permissions', rlRead, permissionsController.getRolePermissions);

// Role-Permission Assignment
router.post('/grant-role-permission', rlWrite, permissionsController.grantRolePermission);
router.delete('/revoke-role-permission', rlWrite, permissionsController.revokeRolePermission);
router.post('/role/assign', rlWrite, permissionsController.assignPermissionsToRole); // Frontend-compatible endpoint

// Audit Log
router.get('/audit', rlRead, permissionsController.getAuditLog);

// -------------------------------
// 404 and error handling (bottom)
// -------------------------------
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      // Legacy Routes
      'POST /api/permissions/roles': 'Create role',
      'GET /api/permissions/roles': 'List roles',
      'PUT /api/permissions/roles/:id': 'Update role',
      'POST /api/permissions/modules': 'Create module',
      'GET /api/permissions/modules': 'List modules',
      'PUT /api/permissions/modules/:id': 'Update module',
      'POST /api/permissions/grant': 'Grant/Update permission',
      'GET /api/permissions': 'List permissions (filters: role_id/role_name, module_id/module_name)',
      'DELETE /api/permissions': 'Revoke permission (by role and module)',
      
      // New Enhanced Routes
      'GET /api/permissions/user/:userId': 'Get user permissions',
      'GET /api/permissions/user/:userId/grouped': 'Get user permissions grouped by module',
      'GET /api/permissions/user/:userId/roles': 'Get user roles',
      'POST /api/permissions/check': 'Check if user has permission',
      'POST /api/permissions/assign-role': 'Assign role to user',
      'DELETE /api/permissions/revoke-role': 'Revoke role from user',
      'GET /api/permissions/roles-list': 'Get all available roles',
      'GET /api/permissions/permissions-list': 'Get all available permissions',
      'GET /api/permissions/role/:roleId/permissions': 'Get role permissions',
      'POST /api/permissions/grant-role-permission': 'Grant permission to role',
      'DELETE /api/permissions/revoke-role-permission': 'Revoke permission from role',
      'GET /api/permissions/audit': 'Get permission audit log'
    }
  });
});

// Final error handler
router.use((err, req, res, next) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] Permissions routes error:`, err);
  res.status(500).json({
    success: false,
    message: 'Internal server error in permissions',
    timestamp: ts,
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  });
});

module.exports = router;
