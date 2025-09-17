const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagementController_privacy');
const { authenticateToken } = require('../middleware/authMiddleware');

// RBAC middleware
const { createPermissionMiddleware } = require('../config/rbacRouteMapping');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes for user management with privacy filtering

// GET /api/user-management/roles - Get all available roles (RBAC: users_read required)
router.get('/roles', 
  createPermissionMiddleware.users.read(), // 🔒 RBAC: users_read required
  userManagementController.getRoles
);

// GET /api/user-management - Get all users with privacy filtering
// - Admins see all users
// - Regular users see only themselves
// - RBAC: Requires users_read permission
router.get('/', 
  createPermissionMiddleware.users.read(), // 🔒 RBAC: users_read required
  userManagementController.getAllUsers
);

// GET /api/user-management/:id - Get specific user by ID with privacy validation
// - Admins can view any user
// - Regular users can only view themselves
// - RBAC: Requires users_read permission
router.get('/:id', 
  createPermissionMiddleware.users.read(), // 🔒 RBAC: users_read required
  userManagementController.getUserById
);

// POST /api/user-management - Create a new user (RBAC: users_create required)
router.post('/', 
  createPermissionMiddleware.users.create(), // 🔒 RBAC: users_create required
  userManagementController.createUser
);

// PUT /api/user-management/:id - Update existing user with privacy validation
// - Admins can update any user (including role changes, status changes)
// - Regular users can only update their own basic info (username, password, 2FA)
// - RBAC: Requires users_update permission
router.put('/:id', 
  createPermissionMiddleware.users.update(), // 🔒 RBAC: users_update required
  userManagementController.updateUser
);

// DELETE /api/user-management/:id - Delete user (RBAC: users_delete required)
router.delete('/:id', 
  createPermissionMiddleware.users.delete(), // 🔒 RBAC: users_delete required
  userManagementController.deleteUser
);

// PATCH /api/user-management/:id/toggle-status - Toggle user active status (RBAC: users_update required)
router.patch('/:id/toggle-status', 
  createPermissionMiddleware.users.update(), // 🔒 RBAC: users_update required
  userManagementController.toggleUserStatus
);

// POST /api/user-management/:id/generate-2fa - Generate 2FA QR code for user
// - Admins can generate for any user
// - Regular users can only generate for themselves
// - RBAC: Requires users_create permission (2FA generation treated as creation action)
router.post('/:id/generate-2fa', 
  createPermissionMiddleware.users.create(), // 🔒 RBAC: users_create required
  userManagementController.generate2FAQRCode
);

module.exports = router;
