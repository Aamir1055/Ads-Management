const User = require('../models/UserNew');

// Helper function for consistent API responses
const createResponse = (success, message, data = null, errors = null) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  ...(data && { data }),
  ...(errors && { errors })
});

const userController = {
  /**
   * Create a new user
   * POST /api/users
   */
  createUser: async (req, res) => {
    try {
      const { username, password, confirm_password, role_id, enable_2fa } = req.body;

      // Basic validation
      if (!username || !password || !confirm_password || !role_id) {
        return res.status(400).json(
          createResponse(false, 'Missing required fields: username, password, confirm_password, role_id')
        );
      }

      if (password !== confirm_password) {
        return res.status(400).json(
          createResponse(false, 'Passwords do not match')
        );
      }

      if (password.length < 6) {
        return res.status(400).json(
          createResponse(false, 'Password must be at least 6 characters long')
        );
      }

      // Create user
      const result = await User.create({
        username: username.trim(),
        password,
        role_id: parseInt(role_id),
        enable_2fa: !!enable_2fa
      });

      const responseData = {
        user: result.user,
        message: 'User created successfully'
      };

      // Include 2FA setup data if enabled
      if (enable_2fa && result.qrCode) {
        responseData.twoFA = {
          qrCode: result.qrCode,
          secret: result.secret,
          message: 'Scan this QR code with your authenticator app'
        };
      }

      return res.status(201).json(
        createResponse(true, 'User created successfully', responseData)
      );

    } catch (error) {
      console.error('Create user error:', error);

      if (error.message === 'Username already exists') {
        return res.status(409).json(
          createResponse(false, 'Username already exists')
        );
      }

      if (error.message === 'Invalid role specified') {
        return res.status(400).json(
          createResponse(false, 'Invalid role specified')
        );
      }

      return res.status(500).json(
        createResponse(false, 'Failed to create user', null, ['Internal server error'])
      );
    }
  },

  /**
   * Get all users with pagination and filtering
   * GET /api/users
   */
  getAllUsers: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
      const search = (req.query.search || '').trim();
      const role_id = req.query.role_id ? parseInt(req.query.role_id) : null;
      const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : true;

      const result = await User.findAll({
        page,
        limit,
        search,
        role_id,
        is_active
      });

      return res.status(200).json(
        createResponse(true, 'Users retrieved successfully', result)
      );

    } catch (error) {
      console.error('Get users error:', error);
      return res.status(500).json(
        createResponse(false, 'Failed to retrieve users', null, ['Internal server error'])
      );
    }
  },

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  getUserById: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (!userId || userId <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID')
        );
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json(
          createResponse(false, 'User not found')
        );
      }

      return res.status(200).json(
        createResponse(true, 'User retrieved successfully', { user })
      );

    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json(
        createResponse(false, 'Failed to retrieve user', null, ['Internal server error'])
      );
    }
  },

  /**
   * Update user
   * PUT /api/users/:id
   */
  updateUser: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (!userId || userId <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID')
        );
      }

      const updateData = {};
      const { username, role_id, is_active, password } = req.body;

      // Only include provided fields
      if (username !== undefined) updateData.username = username.trim();
      if (role_id !== undefined) updateData.role_id = parseInt(role_id);
      if (is_active !== undefined) updateData.is_active = !!is_active;
      if (password && password.length >= 6) updateData.password = password;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json(
          createResponse(false, 'No valid fields provided for update')
        );
      }

      const updatedUser = await User.updateById(userId, updateData);

      return res.status(200).json(
        createResponse(true, 'User updated successfully', { user: updatedUser })
      );

    } catch (error) {
      console.error('Update user error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(
          createResponse(false, 'User not found')
        );
      }

      if (error.message === 'Username already exists') {
        return res.status(409).json(
          createResponse(false, 'Username already exists')
        );
      }

      return res.status(500).json(
        createResponse(false, 'Failed to update user', null, ['Internal server error'])
      );
    }
  },

  /**
   * Delete user (soft delete)
   * DELETE /api/users/:id
   */
  deleteUser: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (!userId || userId <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID')
        );
      }

      const result = await User.deleteById(userId);

      return res.status(200).json(
        createResponse(true, result.message)
      );

    } catch (error) {
      console.error('Delete user error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(
          createResponse(false, 'User not found')
        );
      }

      return res.status(500).json(
        createResponse(false, 'Failed to delete user', null, ['Internal server error'])
      );
    }
  },

  /**
   * Enable 2FA for user
   * POST /api/users/:id/enable-2fa
   */
  enable2FA: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (!userId || userId <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID')
        );
      }

      const result = await User.enable2FA(userId);

      return res.status(200).json(
        createResponse(true, '2FA enabled successfully', {
          qrCode: result.qrCode,
          secret: result.secret,
          message: 'Scan the QR code with your authenticator app'
        })
      );

    } catch (error) {
      console.error('Enable 2FA error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(
          createResponse(false, 'User not found')
        );
      }

      if (error.message === '2FA is already enabled for this user') {
        return res.status(409).json(
          createResponse(false, '2FA is already enabled for this user')
        );
      }

      return res.status(500).json(
        createResponse(false, 'Failed to enable 2FA', null, ['Internal server error'])
      );
    }
  },

  /**
   * Disable 2FA for user
   * POST /api/users/:id/disable-2fa
   */
  disable2FA: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (!userId || userId <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID')
        );
      }

      const result = await User.disable2FA(userId);

      return res.status(200).json(
        createResponse(true, result.message)
      );

    } catch (error) {
      console.error('Disable 2FA error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(
          createResponse(false, 'User not found')
        );
      }

      if (error.message === '2FA is not enabled for this user') {
        return res.status(409).json(
          createResponse(false, '2FA is not enabled for this user')
        );
      }

      return res.status(500).json(
        createResponse(false, 'Failed to disable 2FA', null, ['Internal server error'])
      );
    }
  },

  /**
   * Get all roles
   * GET /api/users/roles
   */
  getRoles: async (req, res) => {
    try {
      const roles = await User.getRoles();

      return res.status(200).json(
        createResponse(true, 'Roles retrieved successfully', { roles })
      );

    } catch (error) {
      console.error('Get roles error:', error);
      return res.status(500).json(
        createResponse(false, 'Failed to retrieve roles', null, ['Internal server error'])
      );
    }
  },

  /**
   * Check username availability
   * GET /api/users/check-username/:username
   */
  checkUsernameAvailability: async (req, res) => {
    try {
      const { username } = req.params;

      if (!username || username.trim().length === 0) {
        return res.status(400).json(
          createResponse(false, 'Username is required')
        );
      }

      const isAvailable = await User.isUsernameAvailable(username.trim());

      return res.status(200).json(
        createResponse(true, 'Username availability checked', {
          username: username.trim(),
          available: isAvailable
        })
      );

    } catch (error) {
      console.error('Check username error:', error);
      return res.status(500).json(
        createResponse(false, 'Failed to check username availability', null, ['Internal server error'])
      );
    }
  },

  /**
   * Get user statistics
   * GET /api/users/stats
   */
  getUserStats: async (req, res) => {
    try {
      // Get basic user statistics
      const [stats] = await require('../config/database').pool.query(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
          SUM(CASE WHEN twofa_enabled = 1 OR is_2fa_enabled = 1 THEN 1 ELSE 0 END) as users_with_2fa,
          SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recent_logins
        FROM users
      `);

      // Get role distribution
      const [roleStats] = await require('../config/database').pool.query(`
        SELECT 
          r.id, r.name, r.description,
          COUNT(u.id) as user_count
        FROM roles r
        LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
        WHERE r.is_active = 1
        GROUP BY r.id, r.name, r.description
        ORDER BY user_count DESC
      `);

      return res.status(200).json(
        createResponse(true, 'User statistics retrieved successfully', {
          overview: stats[0],
          roleDistribution: roleStats
        })
      );

    } catch (error) {
      console.error('Get user stats error:', error);
      return res.status(500).json(
        createResponse(false, 'Failed to retrieve user statistics', null, ['Internal server error'])
      );
    }
  }
};

module.exports = userController;
