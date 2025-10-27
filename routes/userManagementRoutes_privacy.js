const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagementController_privacy');
const { authenticateToken } = require('../middleware/authMiddleware');

// RBAC middleware
const { createPermissionMiddleware } = require('../config/rbacRouteMapping');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes for user management with privacy filtering

// GET /api/user-management/profile - Get current user's profile (no additional RBAC needed)
// IMPORTANT: This must be defined before /:id route to avoid conflicts
router.get('/profile', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const userId = req.user.userId || req.user.id;

    const [users] = await pool.execute(`
      SELECT 
        u.id,
        u.username,
        u.is_active,
        u.is_2fa_enabled,
        u.created_at,
        u.updated_at,
        r.id as role_id,
        r.name as role_name,
        r.display_name as role_display_name,
        r.level as role_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.is_active = 1
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
        timestamp: new Date().toISOString()
      });
    }

    const user = users[0];
    
    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      timestamp: new Date().toISOString(),
      data: {
        user: {
          id: user.id,
          username: user.username,
          is_active: user.is_active === 1,
          is_2fa_enabled: user.is_2fa_enabled === 1,
          created_at: user.created_at,
          updated_at: user.updated_at,
          role: {
            id: user.role_id,
            name: user.role_name,
            display_name: user.role_display_name,
            level: user.role_level
          }
        }
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

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
