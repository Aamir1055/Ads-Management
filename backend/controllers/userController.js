const User = require('../models/User');

// Helper functions
const createResponse = (success, message, data = null, errors = null) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  ...(data && { data }),
  ...(errors && { errors })
});

// Robust client IP helper: prefer req.ip (with trust proxy) then XFF first IP, then socket
const getClientIp = (req) => {
  if (req.ip) return req.ip; // uses trust proxy when configured
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    const first = xff.split(',').trim();
    if (first) return first;
  } else if (Array.isArray(xff) && xff.length) {
    return xff;
  }
  return req.socket?.remoteAddress || 'unknown';
}; // [express behind proxies guidance]

const userController = {
  // Create a new user (POST)
  createUser: async (req, res) => {
    try {
      const clientIp = getClientIp(req);
      const userAgent = req.get('User-Agent') || 'unknown';

      // No validation - accept any input
      const userData = {
        username: req.body.username,
        password: req.body.password,
        confirm_password: req.body.confirm_password,
        role_id: req.body.role_id,
        enable_2fa: !!req.body.enable_2fa,
        timezone: req.body.timezone || 'UTC',
        audit: {
          clientIp,
          userAgent,
          actorUserId: req.user?.id || null
        }
      };

      // Create user via model; model should hash password and enforce unique username
      const result = await User.create(userData);

      const responseData = {
        user: result.user,
        message: 'User created successfully'
      };

      // Only return bootstrap 2FA info if enabled and provided by model
      if (req.body.enable_2fa && result.qrCode) {
        responseData.twoFA = {
          qrCode: result.qrCode,
          // If the model returns a secret for initial setup, include once
          secret: result.secret,
          message: 'Save this QR code and secret securely. Scan with your authenticator app.'
        };
      }

      return res.status(201).json(createResponse(true, 'User created successfully', responseData));
    } catch (error) {
      console.error('Create user error:', error);

      if (error.message === 'Username already exists') {
        return res.status(409).json(
          createResponse(false, 'Username is already taken. Please choose a different username.')
        );
      }
      if (error.message === 'Invalid role specified') {
        return res.status(400).json(
          createResponse(false, 'Invalid role specified. Please select a valid role.')
        );
      }
      // No manual "Passwords do not match" here—Joi handles that before reaching this point

      return res.status(500).json(
        createResponse(false, 'Failed to create user due to an internal error. Please try again later.', null, ['Internal server error'])
      );
    }
  },

  // Get all users (GET)
  getAllUsers: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const search = (req.query.search || '').trim();
      const role_id = req.query.role_id ? parseInt(req.query.role_id, 10) : null;
      const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : true;

      const result = await User.findAll({ page, limit, search, role_id, is_active });

      return res.status(200).json(createResponse(true, 'Users fetched successfully', result));
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json(
        createResponse(false, 'Failed to fetch users', null, ['Internal server error'])
      );
    }
  },

  // Get user by ID (GET)
  getUserById: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID - must be a positive number')
        );
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json(
          createResponse(false, 'User not found or inactive')
        );
      }

      return res.status(200).json(createResponse(true, 'User retrieved successfully', { user }));
    } catch (error) {
      console.error('Get user by ID error:', error);
      return res.status(500).json(
        createResponse(false, 'Failed to fetch user', null, ['Internal server error'])
      );
    }
  },

  // Update user (PUT)
  updateUser: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID - must be a positive integer')
        );
      }

      // No validation - accept any input
      const toUpdate = { ...req.body };
      delete toUpdate.confirm_password;

      const updated = await User.updateById(userId, toUpdate);

      return res.status(200).json(createResponse(true, 'User updated successfully', { user: updated }));
    } catch (error) {
      console.error('Update user error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(createResponse(false, 'User not found or inactive'));
      }
      if (error.message === 'Username already exists') {
        return res.status(409).json(createResponse(false, 'Username already exists'));
      }
      if (error.message === 'Invalid role specified') {
        return res.status(400).json(createResponse(false, 'Invalid role specified'));
      }

      return res.status(500).json(createResponse(false, 'Failed to update user', null, ['Internal server error']));
    }
  },

  // Delete user (DELETE) - soft delete expected (is_active = 0)
  deleteUser: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID - must be a positive number')
        );
      }

      const result = await User.deleteById(userId);

      return res.status(200).json(createResponse(true, result.message));
    } catch (error) {
      console.error('Delete user error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(createResponse(false, 'User not found or already inactive'));
      }
      if (error.message === 'Cannot delete admin users') {
        return res.status(403).json(createResponse(false, 'Cannot delete admin users'));
      }

      return res.status(500).json(createResponse(false, 'Failed to delete user', null, ['Internal server error']));
    }
  },

  // Toggle user status (PATCH)
  toggleUserStatus: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid user ID'));
      }

      const result = await User.toggleStatus(userId);

      return res.status(200).json(
        createResponse(true, result.message, {
          user: {
            id: result.id,
            username: result.username,
            is_active: result.is_active
          }
        })
      );
    } catch (error) {
      console.error('Toggle user status error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(createResponse(false, 'User not found'));
      }

      return res.status(500).json(createResponse(false, 'Failed to toggle user status', null, ['Internal server error']));
    }
  },

  // Get roles
  getRoles: async (req, res) => {
    try {
      const roles = await User.getRoles();
      return res.status(200).json(createResponse(true, 'Roles fetched successfully', { roles }));
    } catch (error) {
      console.error('Get roles error:', error);
      return res.status(500).json(createResponse(false, 'Failed to fetch roles', null, ['Internal server error']));
    }
  },

  // Enable 2FA for user
  enable2FA: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid user ID - must be a positive number'));
      }

      // Model should set twofa_enabled (or is_2fa_enabled) and generate/return QR code
      const result = await User.enable2FA(userId);

      return res.status(200).json(
        createResponse(true, result.message, {
          qrCode: result.qrCode,
          instructions: 'Scan this QR code with your authenticator app'
        })
      );
    } catch (error) {
      console.error('Enable 2FA error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(createResponse(false, 'User not found'));
      }
      if (error.message === '2FA is already enabled for this user') {
        return res.status(400).json(createResponse(false, '2FA is already enabled for this user'));
      }

      return res.status(500).json(createResponse(false, 'Failed to enable 2FA', null, ['Internal server error']));
    }
  },

  // Disable 2FA for user
  disable2FA: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid user ID - must be a positive number'));
      }

      const result = await User.disable2FA(userId);

      return res.status(200).json(createResponse(true, result.message));
    } catch (error) {
      console.error('Disable 2FA error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(createResponse(false, 'User not found'));
      }
      if (error.message === '2FA is not enabled for this user') {
        return res.status(400).json(createResponse(false, '2FA is not enabled for this user'));
      }

      return res.status(500).json(createResponse(false, 'Failed to disable 2FA', null, ['Internal server error']));
    }
  },

  // User statistics
  getUserStats: async (req, res) => {
    try {
      const stats = await User.getStats();
      return res.status(200).json(createResponse(true, 'User statistics retrieved successfully', stats));
    } catch (error) {
      console.error('Get user stats error:', error);
      return res.status(500).json(
        createResponse(false, 'Failed to retrieve user statistics', null, ['Internal server error'])
      );
    }
  },

  // Check username availability
  checkUsernameAvailability: async (req, res) => {
    try {
      const raw = req.params.username || '';
      const username = raw.trim().toLowerCase();

      const isAvailable = await User.isUsernameAvailable(username);

      return res.status(200).json(
        createResponse(true, 'Username availability checked', {
          username,
          available: isAvailable
        })
      );
    } catch (error) {
      console.error('Check username availability error:', error);
      return res.status(500).json(
        createResponse(false, 'Failed to check username availability', null, ['Internal server error'])
      );
    }
  }
};

module.exports = userController;
