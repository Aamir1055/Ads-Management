const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllerNew');

// Helper function for consistent error responses
const createResponse = (success, message, data = null, errors = null) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  ...(data && { data }),
  ...(errors && { errors })
});

// Input validation middleware
const validateUserId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json(
      createResponse(false, 'Invalid user ID - must be a positive integer')
    );
  }
  req.params.id = id;
  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    
    // Hide sensitive fields in logs
    const sensitiveFields = ['password', 'confirm_password', 'twofa_secret', 'two_factor_secret'];
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[HIDDEN]';
      }
    });
    
    console.log('Request Body:', JSON.stringify(sanitizedBody, null, 2));
  }
  
  next();
};

// Apply logging to all routes
router.use(requestLogger);

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * @route   GET /api/users/roles
 * @desc    Get all available roles for dropdowns
 * @access  Public
 */
router.get('/roles', userController.getRoles);

/**
 * @route   GET /api/users/check-username/:username
 * @desc    Check if username is available
 * @access  Public
 */
router.get('/check-username/:username', userController.checkUsernameAvailability);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Public (should be protected in production)
 */
router.get('/stats', userController.getUserStats);

// =============================================================================
// USER CRUD ROUTES
// =============================================================================

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Public (should be protected in production)
 * @body    { username, password, confirm_password, role_id, enable_2fa }
 */
router.post('/', userController.createUser);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Public (should be protected in production)
 * @query   page, limit, search, role_id, is_active
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get specific user by ID
 * @access  Public (should be protected in production)
 */
router.get('/:id', validateUserId, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user information
 * @access  Public (should be protected in production)
 * @body    { username, role_id, is_active, password }
 */
router.put('/:id', validateUserId, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Public (should be protected in production)
 */
router.delete('/:id', validateUserId, userController.deleteUser);

// =============================================================================
// 2FA MANAGEMENT ROUTES
// =============================================================================

/**
 * @route   POST /api/users/:id/enable-2fa
 * @desc    Enable 2FA for user
 * @access  Public (should be protected in production)
 */
router.post('/:id/enable-2fa', validateUserId, userController.enable2FA);

/**
 * @route   POST /api/users/:id/disable-2fa
 * @desc    Disable 2FA for user
 * @access  Public (should be protected in production)
 */
router.post('/:id/disable-2fa', validateUserId, userController.disable2FA);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Handle invalid routes
router.use((req, res) => {
  res.status(404).json(
    createResponse(false, `Route ${req.method} ${req.originalUrl} not found`, {
      availableRoutes: {
        'POST /users': 'Create new user',
        'GET /users': 'Get all users (with pagination, search, filtering)',
        'GET /users/:id': 'Get user by ID',
        'PUT /users/:id': 'Update user',
        'DELETE /users/:id': 'Delete user (soft delete)',
        'GET /users/roles': 'Get all available roles',
        'GET /users/check-username/:username': 'Check username availability',
        'GET /users/stats': 'Get user statistics',
        'POST /users/:id/enable-2fa': 'Enable 2FA for user',
        'POST /users/:id/disable-2fa': 'Disable 2FA for user'
      }
    })
  );
});

// Global error handler
router.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] User routes error:`, {
    url: req.originalUrl,
    method: req.method,
    error: error.message,
    stack: error.stack
  });

  if (error.name === 'ValidationError') {
    return res.status(400).json(
      createResponse(false, 'Validation error', null, [error.message])
    );
  }

  if (error.code === 'ETIMEDOUT') {
    return res.status(408).json(
      createResponse(false, 'Request timeout')
    );
  }

  res.status(500).json(
    createResponse(false, 'Internal server error', null, ['An unexpected error occurred'])
  );
});

module.exports = router;
