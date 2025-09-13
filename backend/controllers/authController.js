const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateTokens, storeRefreshToken } = require('../middleware/authMiddleware');

// Helper functions
const createResponse = (success, message, data = null, errors = null) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  ...(data && { data }),
  ...(errors && { errors })
});

// Generate JWT Token - Updated to use new token system
const generateAuthTokens = async (userId) => {
  const tokens = generateTokens(userId);
  
  // Store refresh token in database
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await storeRefreshToken(userId, tokens.tokenId, refreshExpiresAt);
  
  return tokens;
};

// @desc    Login user with optional 2FA
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    // No validation - accept any input
    const { username, password } = req.body;

    // Find user by username using the model
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json(
        createResponse(false, 'Invalid credentials')
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isMatch) {
      return res.status(401).json(
        createResponse(false, 'Invalid credentials')
      );
    }

    // Check if 2FA is enabled
    if (user.is_2fa_enabled) {
      // Return partial success - user needs to provide 2FA token
      return res.status(200).json(
        createResponse(true, 'Password verified. 2FA token required.', {
          user: {
            id: user.id,
            username: user.username,
            is_2fa_enabled: true,
            role_id: user.role_id
          },
          requires_2fa: true,
          next_step: 'Please provide your 2FA token to complete login'
        })
      );
    }

    // Generate token for non-2FA users
    const tokens = await generateAuthTokens(user.id);
    await User.updateLastLogin(user.id);
    res.status(200).json(
      createResponse(true, 'Login successful', {
        requires_2fa: false,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          role_id: user.role_id,
          is_2fa_enabled: user.is_2fa_enabled
        }
      })
    );
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(
      createResponse(false, 'Login failed', null, ['Internal server error'])
    );
  }
};

// @desc    Complete login with 2FA token
// @route   POST /api/auth/login-2fa
// @access  Public
exports.loginWith2FA = async (req, res, next) => {
  try {
    const { user_id, token } = req.body;
    
    console.log('🔐 2FA Login attempt:', {
      user_id,
      token: token ? `${token.substring(0, 2)}****` : 'undefined',
      body: req.body
    });

    // Validate input
    if (!user_id || !token) {
      console.log('❌ Missing user_id or token:', { user_id: !!user_id, token: !!token });
      return res.status(400).json(
        createResponse(false, 'User ID and 2FA token are required')
      );
    }

    // Validate token format
    if (!/^\d{6}$/.test(token)) {
      console.log('❌ Invalid token format:', token);
      return res.status(400).json(
        createResponse(false, 'Invalid 2FA token format. Must be 6 digits.')
      );
    }

    // Get user info using the model
    const user = await User.findById(user_id);
    if (!user) {
      console.log('❌ User not found:', user_id);
      return res.status(404).json(
        createResponse(false, 'User not found or inactive')
      );
    }
    
    console.log('👤 Found user:', {
      id: user.id,
      username: user.username,
      is_2fa_enabled: user.is_2fa_enabled
    });

    // Check if 2FA is enabled
    if (!user.is_2fa_enabled) {
      console.log('❌ 2FA not enabled for user:', user.username);
      return res.status(400).json(
        createResponse(false, '2FA is not enabled for this user')
      );
    }

    console.log('🔍 Verifying 2FA token...');
    // Verify 2FA token using the model
    const isValid = await User.verify2FA(user_id, token);
    console.log('🔍 2FA verification result:', isValid);
    
    if (!isValid) {
      console.log('❌ 2FA token verification failed');
      return res.status(401).json(
        createResponse(false, 'Invalid 2FA token')
      );
    }

    // Generate token
    const tokens = await generateAuthTokens(user.id);

    // Update last login
    await User.updateLastLogin(user.id);

    res.status(200).json(
      createResponse(true, 'Login with 2FA successful', {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          role_id: user.role_id,
          is_2fa_enabled: user.is_2fa_enabled,
          two_factor_verified: true
        }
      })
    );

  } catch (error) {
    console.error('2FA Login error:', error);
    res.status(500).json(
      createResponse(false, '2FA login failed', null, ['Internal server error'])
    );
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res, next) => {
  res.status(200).json(
    createResponse(true, 'Logged out successfully')
  );
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // Assuming req.user is populated by auth middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(
        createResponse(false, 'User not authenticated')
      );
    }

    // Get updated user information using the model
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        createResponse(false, 'User not found or inactive')
      );
    }
    res.status(200).json(
      createResponse(true, 'User information retrieved successfully', {
        user: {
          id: user.id,
          username: user.username,
          role_id: user.role_id,
          is_2fa_enabled: user.is_2fa_enabled,
          is_active: user.is_active
        }
      })
    );
    
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json(
      createResponse(false, 'Failed to get user information', null, ['Internal server error'])
    );
  }
};

// @desc    Validate user credentials (used before sensitive operations)
// @route   POST /api/auth/validate-credentials
// @access  Private
exports.validateCredentials = async (req, res, next) => {
  try {
    const { password, twofa_token } = req.body;
    const userId = req.user?.id;

    if (!userId || !password) {
      return res.status(400).json(
        createResponse(false, 'Password is required for verification')
      );
    }

    // Get user info using the model
    const user = await User.findByIdWithSecret(userId);
    if (!user) {
      return res.status(404).json(
        createResponse(false, 'User not found or inactive')
      );
    }

    // Get user with password for verification
    const userWithPassword = await User.findByUsername(user.username);
    if (!userWithPassword) {
      return res.status(404).json(
        createResponse(false, 'User not found')
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userWithPassword.hashed_password);
    if (!isPasswordValid) {
      return res.status(401).json(
        createResponse(false, 'Invalid password')
      );
    }

    // Check 2FA if enabled
    if (user.is_2fa_enabled) {
      if (!twofa_token) {
        return res.status(400).json(
          createResponse(false, '2FA token is required')
        );
      }

      const is2FAValid = await User.verify2FA(userId, twofa_token);
      if (!is2FAValid) {
        return res.status(401).json(
          createResponse(false, 'Invalid 2FA token')
        );
      }
    }

    res.status(200).json(
      createResponse(true, 'Credentials validated successfully', {
        user: {
          id: user.id,
          username: user.username,
          verified_at: new Date().toISOString()
        }
      })
    );

  } catch (error) {
    console.error('Credential validation error:', error);
    res.status(500).json(
      createResponse(false, 'Credential validation failed', null, ['Internal server error'])
    );
  }
};
