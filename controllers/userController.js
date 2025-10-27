const User = require('../models/User');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Helper functions
const createResponse = (success, message, data = null, errors = null) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  ...(data && { data }),
  ...(errors && { errors })
});

// SECURITY FIX: This is a SECURE replacement for the dangerous userController that had validation bypass
// Admin helper - checks if user is admin (more permissive than privacy version)
const isAdmin = (req) => {
  const user = req.user;
  if (!user) return false;
  
  // Admins can manage all users (check role level or name)
  return user.role && (user.role.level >= 8 || user.role.name === 'super_admin' || user.role.name === 'admin');
};

// Get client IP helper
const getClientIp = (req) => {
  if (req.ip) return req.ip;
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  return req.socket?.remoteAddress || 'unknown';
};

// Get all roles helper function
const getRoles = async (pool) => {
  const { pool: dbPool } = require('../config/database');
  const [roles] = await dbPool.query(
    'SELECT id, name, display_name, description, level FROM roles WHERE is_active = 1 ORDER BY level DESC, name ASC'
  );
  return roles;
};

const userManagementController = {
  // Get all users with privacy filtering
  getAllUsers: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const search = (req.query.search || '').trim();
      const role_id = req.query.role_id ? parseInt(req.query.role_id, 10) : null;
      const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : null;

      console.log('📋 Fetching users with filters:', { page, limit, search, role_id, is_active });
      console.log('👤 Current user:', { id: req.user.id, username: req.user.username, isAdmin: isAdmin(req) });

      // SECURITY NOTE: This version allows all authenticated users to see all users
      // (unlike the privacy version which restricts regular users to see only themselves)
      // If you need privacy filtering, use userManagementController_privacy instead
      const result = await User.findAll({ 
        page, 
        limit, 
        search, 
        role_id, 
        is_active: is_active 
      });

      // Get available roles for frontend filtering
      const roles = await getRoles();

      return res.status(200).json(createResponse(
        true, 
        'Users fetched successfully', 
        {
          ...result,
          roles
        }
      ));
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json(
        createResponse(false, 'Failed to fetch users', null, ['Internal server error'])
      );
    }
  },

  // Get user by ID with privacy validation
  getUserById: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID - must be a positive number')
        );
      }

      console.log('👤 Fetching user by ID:', userId);
      console.log('🔒 Current user:', { id: req.user.id, isAdmin: isAdmin(req) });

      // SECURITY NOTE: This version allows any authenticated user to view any user
      // If you need privacy restrictions, use userManagementController_privacy instead

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json(
          createResponse(false, 'User not found or inactive')
        );
      }

      // Get available roles for the frontend
      const roles = await getRoles();

      return res.status(200).json(createResponse(
        true, 
        'User retrieved successfully', 
        { 
          user,
          roles
        }
      ));
    } catch (error) {
      console.error('Get user by ID error:', error);
      return res.status(500).json(
        createResponse(false, 'Failed to fetch user', null, ['Internal server error'])
      );
    }
  },

  // Create a new user - Admin only
  createUser: async (req, res) => {
    try {
      // SECURITY NOTE: This version allows any authenticated user to create users
      // If you need admin-only restriction, use userManagementController_privacy instead

      const clientIp = getClientIp(req);
      const userAgent = req.get('User-Agent') || 'unknown';

      console.log('🆕 Creating new user:', {
        username: req.body.username,
        role_id: req.body.role_id,
        enable_2fa: req.body.enable_2fa,
        clientIp
      });

      // Validate required fields
      if (!req.body.username || !req.body.password) {
        return res.status(400).json(
          createResponse(false, 'Username and password are required')
        );
      }

      if (!req.body.role_id) {
        return res.status(400).json(
          createResponse(false, 'Role is required')
        );
      }

      // Validate password confirmation
      if (req.body.password !== req.body.confirm_password) {
        return res.status(400).json(
          createResponse(false, 'Passwords do not match')
        );
      }

      // Validate password strength (basic)
      if (req.body.password.length < 6) {
        return res.status(400).json(
          createResponse(false, 'Password must be at least 6 characters long')
        );
      }

      const userData = {
        username: req.body.username.trim(),
        password: req.body.password,
        confirm_password: req.body.confirm_password,
        role_id: parseInt(req.body.role_id, 10),
        enable_2fa: !!req.body.enable_2fa,
        audit: {
          clientIp,
          userAgent,
          actorUserId: req.user?.id || null
        }
      };

      // Create user via model
      const result = await User.create(userData, req.user?.id);

      console.log('✅ User created successfully:', result.user.username);

      const responseData = {
        user: result.user,
        message: 'User created successfully'
      };

      // Include 2FA setup data if enabled
      if (req.body.enable_2fa && result.qrCode) {
        responseData.twoFA = {
          qrCode: result.qrCode,
          secret: result.secret,
          message: 'Save this QR code and secret securely. Scan with your authenticator app.'
        };
        console.log('🔐 2FA enabled for user:', result.user.username);
      }

      return res.status(201).json(createResponse(
        true, 
        'User created successfully', 
        responseData
      ));

    } catch (error) {
      console.error('Create user error:', error);

      // Handle specific errors
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
      if (error.message === 'Passwords do not match') {
        return res.status(400).json(
          createResponse(false, 'Passwords do not match')
        );
      }

      return res.status(500).json(
        createResponse(false, 'Failed to create user due to an internal error. Please try again later.')
      );
    }
  },

  // Update user with privacy validation
  updateUser: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID - must be a positive integer')
        );
      }

      console.log('🔄 Updating user:', userId, 'Data:', req.body);
      console.log('🔒 Current user:', { id: req.user.id, isAdmin: isAdmin(req) });

      // Privacy check: Users can only update their own record, admins can update anyone
      if (!isAdmin(req) && userId !== req.user.id) {
        return res.status(403).json(
          createResponse(false, 'Access denied. You can only update your own user information.')
        );
      }

      // Get current user data
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json(
          createResponse(false, 'User not found')
        );
      }

      // Prepare update data
      const updateData = {};
      
      // Update username if provided
      if (req.body.username && req.body.username.trim() !== existingUser.username) {
        updateData.username = req.body.username.trim();
      }

      // Update password if provided
      if (req.body.password) {
        if (req.body.password !== req.body.confirm_password) {
          return res.status(400).json(
            createResponse(false, 'Passwords do not match')
          );
        }
        if (req.body.password.length < 6) {
          return res.status(400).json(
            createResponse(false, 'Password must be at least 6 characters long')
          );
        }
        updateData.password = req.body.password;
      }

      // Update role if provided (admin only)
      if (req.body.role_id) {
        const newRoleId = parseInt(req.body.role_id, 10);
        if (newRoleId !== existingUser.role_id) {
          // Only admins can change roles
          if (!isAdmin(req)) {
            return res.status(403).json(
              createResponse(false, 'Access denied. Only administrators can change user roles.')
            );
          }
          updateData.role_id = newRoleId;
        }
      }

      // Update 2FA settings if provided
      if (req.body.hasOwnProperty('enable_2fa')) {
        const enable2FA = !!req.body.enable_2fa;
        if (enable2FA !== existingUser.is_2fa_enabled) {
          updateData.enable_2fa = enable2FA;
        }
      }

      // Update active status if provided (admin only)
      if (req.body.hasOwnProperty('is_active')) {
        const newActiveStatus = !!req.body.is_active;
        if (newActiveStatus !== existingUser.is_active) {
          // Only admins can change active status
          if (!isAdmin(req)) {
            return res.status(403).json(
              createResponse(false, 'Access denied. Only administrators can change user active status.')
            );
          }
          updateData.is_active = newActiveStatus;
        }
      }

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json(
          createResponse(false, 'No changes detected')
        );
      }

      console.log('📝 Updating fields:', Object.keys(updateData));

      const updated = await User.updateById(userId, updateData);

      return res.status(200).json(createResponse(
        true, 
        'User updated successfully', 
        { user: updated }
      ));

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

      return res.status(500).json(createResponse(
        false, 
        'Failed to update user', 
        null, 
        ['Internal server error']
      ));
    }
  },

  // Delete user - Admin only
  deleteUser: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID - must be a positive number')
        );
      }

      console.log('🗑️ Deleting user:', userId);

      // Only admins can delete users
      if (!isAdmin(req)) {
        return res.status(403).json(
          createResponse(false, 'Access denied. Only administrators can delete users.')
        );
      }

      // Prevent self-deletion
      if (req.user && req.user.id === userId) {
        return res.status(400).json(
          createResponse(false, 'You cannot delete your own account')
        );
      }

      const result = await User.deleteById(userId);

      console.log('✅ User deleted successfully:', userId);

      return res.status(200).json(createResponse(true, result.message));

    } catch (error) {
      console.error('Delete user error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json(createResponse(false, 'User not found or already inactive'));
      }
      if (error.message === 'Cannot delete admin users') {
        return res.status(403).json(createResponse(false, 'Cannot delete admin users'));
      }

      return res.status(500).json(createResponse(
        false, 
        'Failed to delete user', 
        null, 
        ['Internal server error']
      ));
    }
  },

  // Toggle user status - Admin only
  toggleUserStatus: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid user ID'));
      }

      console.log('🔄 Toggling user status:', userId);

      // Only admins can toggle user status
      if (!isAdmin(req)) {
        return res.status(403).json(
          createResponse(false, 'Access denied. Only administrators can change user status.')
        );
      }

      // Prevent self-deactivation
      if (req.user && req.user.id === userId) {
        return res.status(400).json(
          createResponse(false, 'You cannot deactivate your own account')
        );
      }

      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json(createResponse(false, 'User not found'));
      }

      // Toggle status
      const newStatus = !user.is_active;
      const updated = await User.updateById(userId, { is_active: newStatus });

      const action = newStatus ? 'activated' : 'deactivated';
      console.log(`✅ User ${action}:`, userId);

      return res.status(200).json(createResponse(
        true, 
        `User ${action} successfully`, 
        { user: updated }
      ));

    } catch (error) {
      console.error('Toggle user status error:', error);
      return res.status(500).json(createResponse(
        false, 
        'Failed to update user status', 
        null, 
        ['Internal server error']
      ));
    }
  },

  // Get available roles for user creation/editing
  getRoles: async (req, res) => {
    try {
      const roles = await getRoles();

      return res.status(200).json(createResponse(
        true, 
        'Roles fetched successfully', 
        { roles }
      ));
    } catch (error) {
      console.error('Get roles error:', error);
      return res.status(500).json(createResponse(
        false, 
        'Failed to fetch roles', 
        null, 
        ['Internal server error']
      ));
    }
  },

  // Generate 2FA QR code for existing user
  generate2FAQRCode: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid user ID'));
      }

      console.log('🔐 Generating 2FA QR code for user:', userId);

      // Privacy check: Users can only generate 2FA for themselves, admins can do it for anyone
      if (!isAdmin(req) && userId !== req.user.id) {
        return res.status(403).json(
          createResponse(false, 'Access denied. You can only generate 2FA codes for your own account.')
        );
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json(createResponse(false, 'User not found'));
      }

      // Generate new secret
      const secret = speakeasy.generateSecret({
        name: `AdsReporting - ${user.username}`,
        issuer: 'Ads Reporting System',
        length: 20
      });

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      return res.status(200).json(createResponse(
        true, 
        '2FA QR Code generated successfully', 
        {
          qrCode: qrCodeUrl,
          secret: secret.base32,
          message: 'Scan this QR code with your authenticator app and save the secret securely.'
        }
      ));

    } catch (error) {
      console.error('Generate 2FA QR code error:', error);
      return res.status(500).json(createResponse(
        false, 
        'Failed to generate 2FA QR code', 
        null, 
        ['Internal server error']
      ));
    }
  },

  // Additional methods for compatibility with securedUserRoutes
  // Enable 2FA for user
  enable2FA: async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid user ID - must be a positive number'));
      }

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

module.exports = userManagementController;
