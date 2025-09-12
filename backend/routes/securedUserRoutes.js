const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getRoles,
  enable2FA,
  disable2FA,
  getUserStats,
  checkUsernameAvailability
} = require('../controllers/userController');

// Import the enhanced authentication middleware
const { 
  authenticate, 
  requirePermission, 
  requireRole, 
  requireAdmin, 
  requireSuperAdmin,
  requireUserManagement,
  auditLogger,
  roleBasedRateLimit,
  validateRequestSize
} = require('../middleware/enhancedAuth');

// Input validation middleware
const validateIdParam = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID - must be a positive integer',
      timestamp: new Date().toISOString()
    });
  }
  req.params.id = id;
  next();
};

// Apply global middleware
router.use(validateRequestSize);
router.use(roleBasedRateLimit());

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// =============================================================================

/**
 * @route   GET /users/check/username/:username
 * @desc    Check if username is available
 * @access  Public
 */
router.get(
  '/check/username/:username',
  checkUsernameAvailability
);

// =============================================================================
// PROTECTED ROUTES (Authentication required)
// =============================================================================
router.use(authenticate); // Require valid JWT token

/**
 * @route   GET /users/roles
 * @desc    Get all available roles
 * @access  Protected - Requires view_roles permission
 */
router.get(
  '/roles',
  requirePermission('permissions.manage_roles'),
  auditLogger('View roles'),
  getRoles
);

/**
 * @route   GET /users/stats
 * @desc    Get user statistics
 * @access  Protected (Admin/Manager)
 */
router.get(
  '/stats',
  requirePermission('users.view_stats'),
  auditLogger('View user statistics'),
  getUserStats
);

/**
 * @route   GET /users
 * @desc    Get all users
 * @access  Protected - Requires users.view permission
 */
router.get(
  '/',
  requirePermission('users.read'),
  auditLogger('View all users'),
  getAllUsers
);

/**
 * @route   POST /users
 * @desc    Create a new user
 * @access  Protected - Requires users.create permission
 */
router.post(
  '/',
  requirePermission('users.create'),
  auditLogger('Create user'),
  createUser
);

/**
 * @route   GET /users/:id
 * @desc    Get specific user by ID
 * @access  Protected - Requires users.view permission or self
 */
router.get(
  '/:id',
  validateIdParam,
  async (req, res, next) => {
    // Allow access to own user profile
    if (req.user.id === Number(req.params.id)) {
      return next();
    }
    
    // Otherwise check for permission
    const hasPermission = await req.hasPermission('users.read');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.',
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  auditLogger('View user details'),
  getUserById
);

/**
 * @route   PUT /users/:id
 * @desc    Update user information
 * @access  Protected - Requires users.update permission or self (limited)
 */
router.put(
  '/:id',
  validateIdParam,
  requireUserManagement('id'),
  async (req, res, next) => {
    // Special case: Users can update their own non-role info
    if (req.user.id === Number(req.params.id)) {
      // If trying to update role_id, check for permission
      if (req.body.role_id !== undefined) {
        const canChangeRoles = await req.hasPermission('users.change_role');
        if (!canChangeRoles) {
          // Remove role_id from request to prevent unauthorized role change
          delete req.body.role_id;
        }
      }
      return next();
    }
    
    // For other users, require full update permission
    const hasPermission = await req.hasPermission('users.update');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Required permission: users.update',
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  auditLogger('Update user'),
  updateUser
);

/**
 * @route   DELETE /users/:id
 * @desc    Soft delete user (set is_active = false)
 * @access  Protected - Requires users.delete permission
 */
router.delete(
  '/:id',
  validateIdParam,
  requirePermission('users.delete'),
  requireUserManagement('id'),
  auditLogger('Delete user'),
  deleteUser
);

/**
 * @route   PATCH /users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Protected - Requires users.update permission
 */
router.patch(
  '/:id/toggle-status',
  validateIdParam,
  requirePermission('users.update'),
  requireUserManagement('id'),
  auditLogger('Toggle user status'),
  toggleUserStatus
);

/**
 * @route   POST /users/:id/enable-2fa
 * @desc    Enable 2FA for user
 * @access  Protected - Self or requires users.manage_2fa permission
 */
router.post(
  '/:id/enable-2fa',
  validateIdParam,
  async (req, res, next) => {
    // Users can enable 2FA for themselves
    if (req.user.id === Number(req.params.id)) {
      return next();
    }
    
    // Otherwise check for permission
    const hasPermission = await req.hasPermission('users.manage_2fa');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Required permission: users.manage_2fa',
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  auditLogger('Enable 2FA'),
  enable2FA
);

/**
 * @route   POST /users/:id/disable-2fa
 * @desc    Disable 2FA for user
 * @access  Protected - Self or requires users.manage_2fa permission
 */
router.post(
  '/:id/disable-2fa',
  validateIdParam,
  async (req, res, next) => {
    // Users can disable 2FA for themselves
    if (req.user.id === Number(req.params.id)) {
      return next();
    }
    
    // Otherwise check for permission
    const hasPermission = await req.hasPermission('users.manage_2fa');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Required permission: users.manage_2fa',
        timestamp: new Date().toISOString()
      });
    }
    next();
  },
  auditLogger('Disable 2FA'),
  disable2FA
);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Handle invalid routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'POST /users': 'Create new user',
      'GET /users': 'Get all users (with pagination, search, filtering)',
      'GET /users/:id': 'Get user by ID',
      'PUT /users/:id': 'Update user',
      'DELETE /users/:id': 'Soft delete user',
      'PATCH /users/:id/toggle-status': 'Toggle user active status',
      'GET /users/check/username/:username': 'Check username availability',
      'GET /users/roles': 'Get all available roles',
      'GET /users/stats': 'Get user statistics',
      'POST /users/:id/enable-2fa': 'Enable 2FA for user',
      'POST /users/:id/disable-2fa': 'Disable 2FA for user'
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced global error handler
router.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] User routes error:`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.clientIp || 'unknown',
    error: error.message,
    stack: error.stack
  });

  if (error.name === 'ValidationError' || error.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details || [error.message],
      timestamp
    });
  }
  if (error.code === 'ETIMEDOUT') {
    return res.status(408).json({
      success: false,
      message: 'Request timeout',
      timestamp
    });
  }
  res.status(500).json({
    success: false,
    message: 'Internal server error in user management',
    timestamp,
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack
    })
  });
});

module.exports = router;
