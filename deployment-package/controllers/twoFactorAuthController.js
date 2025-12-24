const User = require('../models/User');
const Joi = require('joi');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// In-memory storage for temporary 2FA setups (in production, use Redis or database)
const temporarySecrets = new Map();

// Clean up expired temporary secrets every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of temporarySecrets.entries()) {
    if (now - data.timestamp > 30 * 60 * 1000) { // 30 minutes expiry
      temporarySecrets.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Validation schemas
const setupSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional(),
  username: Joi.string().min(3).max(30).required().messages({
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username cannot exceed 30 characters',
    'any.required': 'Username is required'
  }),
  temporary: Joi.boolean().optional().default(false)
});

const verify2FATokenSchema = Joi.object({
  user_id: Joi.number().integer().positive().required().messages({
    'number.base': 'User ID must be a number',
    'number.positive': 'Invalid user ID',
    'any.required': 'User ID is required'
  }),
  token: Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'Token must be exactly 6 digits',
    'any.required': 'Verification token is required'
  })
});

const disable2FASchema = Joi.object({
  user_id: Joi.number().integer().positive().required().messages({
    'number.base': 'User ID must be a number',
    'number.positive': 'Invalid user ID',
    'any.required': 'User ID is required'
  }),
  token: Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.pattern.base': 'Token must be exactly 6 digits',
    'any.required': 'Current 2FA token is required to disable 2FA'
  })
});

// Helper functions
const createResponse = (success, message, data = null, errors = null) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  ...(data && { data }),
  ...(errors && { errors })
});

const joiOpts = { allowUnknown: false, stripUnknown: true }; // defensive defaults [6][12]

// Controller
const twoFactorAuthController = {
  /**
   * @desc    Generate 2FA setup (QR code and secret)
   * @route   POST /api/2fa/setup
   * @access  Protected
   * @body    { username, user_id?, temporary? }
   */
  setup2FA: async (req, res) => {
    try {
      const { error, value } = setupSchema.validate(req.body, joiOpts);
      if (error) {
        return res.status(422).json(
          createResponse(false, 'Validation failed', null, error.details.map(d => d.message))
        );
      }

      const { username, user_id, temporary = false } = value;
      let existingUser = null;

      // Check if user exists in database
      if (user_id) {
        existingUser = await User.findById(user_id);
      } else if (username) {
        existingUser = await User.findByUsername(username);
      }

      // If temporary is true or user doesn't exist, create a temporary 2FA setup
      if (temporary || !existingUser) {
        // Generate 2FA secret for temporary user
        const secret = speakeasy.generateSecret({
          name: `AdsReporting - ${username}`,
          issuer: 'Ads Reporting System',
          length: 20
        });

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        // Store in temporary storage with username as key
        const tempKey = `temp_${username}_${Date.now()}`;
        temporarySecrets.set(tempKey, {
          username,
          secret: secret.base32,
          timestamp: Date.now()
        });

        return res.status(200).json(
          createResponse(true, '2FA setup generated for new user', {
            temp_key: tempKey,
            username,
            qr_code: qrCodeUrl,
            secret: secret.base32,
            temporary: true,
            setup_instructions: {
              step1: 'Install Google Authenticator, Authy, or similar TOTP app',
              step2: 'Scan the QR code with your authenticator app',
              step3: 'Enter the 6-digit code from your app to verify setup',
              step4: 'Complete user creation to finalize 2FA setup'
            },
            expiry_note: 'This temporary setup will expire in 30 minutes'
          })
        );
      }

      // For existing users, use the existing User model method
      if (existingUser.is_2fa_enabled) {
        return res.status(409).json(
          createResponse(false, '2FA is already enabled for this user')
        );
      }

      const result = await User.enable2FA(existingUser.id);

      return res.status(200).json(
        createResponse(true, result.message, {
          user_id: existingUser.id,
          username: existingUser.username,
          qr_code: result.qrCode,
          secret: result.secret,
          temporary: false,
          setup_instructions: {
            step1: 'Install Google Authenticator, Authy, or similar TOTP app',
            step2: 'Scan the QR code with your authenticator app',
            step3: 'Enter the 6-digit code from your app to complete setup'
          },
          backup_note: 'Save backup codes or ensure authenticator backup is enabled'
        })
      );
    } catch (error) {
      console.error('Setup 2FA error:', error);
      return res.status(500).json(createResponse(false, 'Failed to setup 2FA', null, ['Internal server error']));
    }
  },

  /**
   * @desc    Verify 2FA token during setup
   * @route   POST /api/2fa/verify-setup
   * @access  Protected
   * @body    { user_id, token }
   */
  verifySetup: async (req, res) => {
    try {
      const { error, value } = verify2FATokenSchema.validate(req.body, joiOpts);
      if (error) {
        return res.status(422).json(
          createResponse(false, 'Validation failed', null, error.details.map(d => d.message))
        );
      } [7][18]

      const { user_id, token } = value;

      // Model should check current time-step and optionally ±1 step to handle skew
      const isValid = await User.verify2FA(user_id, token); [1]
      if (!isValid) {
        return res.status(401).json(createResponse(false, 'Invalid 2FA token')); [16]
      }

      return res.status(200).json(
        createResponse(true, '2FA setup completed successfully', {
          user_id,
          is_2fa_enabled: true,
          message: '2FA has been successfully enabled for the account'
        })
      ); [1]
    } catch (error) {
      console.error('Verify 2FA setup error:', error);
      if (error.message === '2FA is not enabled for this user') {
        return res.status(400).json(
          createResponse(false, '2FA is not enabled for this user. Please complete setup first.')
        ); [18]
      }
      return res.status(500).json(createResponse(false, 'Failed to verify 2FA token', null, ['Internal server error'])); [18]
    }
  },

  /**
   * @desc    Verify 2FA token for login
   * @route   POST /api/2fa/verify-login
   * @access  Public
   * @body    { user_id, token }
   */
  verifyLogin: async (req, res) => {
    try {
      const { error, value } = verify2FATokenSchema.validate(req.body, joiOpts);
      if (error) {
        return res.status(422).json(
          createResponse(false, 'Validation failed', null, error.details.map(d => d.message))
        );
      } [7][18]

      const { user_id, token } = value;

      const isValid = await User.verify2FA(user_id, token); [1]
      if (!isValid) {
        return res.status(401).json(createResponse(false, 'Invalid 2FA token')); [16]
      }

      return res.status(200).json(
        createResponse(true, '2FA token verified successfully', {
          user_id,
          verified: true,
          message: '2FA verification successful. Continue login.'
        })
      ); [16]
    } catch (error) {
      console.error('Verify 2FA login error:', error);
      if (error.message === '2FA is not enabled for this user') {
        return res.status(400).json(createResponse(false, '2FA is not enabled for this user')); [18]
      }
      return res.status(500).json(createResponse(false, 'Failed to verify 2FA token', null, ['Internal server error'])); [18]
    }
  },

  /**
   * @desc    Disable 2FA for user
   * @route   POST /api/2fa/disable
   * @access  Protected
   * @body    { user_id, token }
   */
  disable2FA: async (req, res) => {
    try {
      const { error, value } = disable2FASchema.validate(req.body, joiOpts);
      if (error) {
        return res.status(422).json(
          createResponse(false, 'Validation failed', null, error.details.map(d => d.message))
        );
      } [7][18]

      const { user_id, token } = value;

      // Verify current token before disabling
      const isValid = await User.verify2FA(user_id, token); [1]
      if (!isValid) {
        return res.status(401).json(
          createResponse(false, 'Invalid 2FA token. Cannot disable 2FA without valid token.')
        ); [16]
      }

      const result = await User.disable2FA(user_id); [18]

      return res.status(200).json(
        createResponse(true, result.message, {
          user_id,
          is_2fa_enabled: false,
          warning: 'Account is now less secure. Consider re-enabling 2FA.'
        })
      ); [18]
    } catch (error) {
      console.error('Disable 2FA error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json(createResponse(false, 'User not found')); [18]
      }
      if (error.message === '2FA is not enabled for this user') {
        return res.status(400).json(createResponse(false, '2FA is not enabled for this user')); [18]
      }
      return res.status(500).json(createResponse(false, 'Failed to disable 2FA', null, ['Internal server error'])); [18]
    }
  },

  /**
   * @desc    Get 2FA status for user
   * @route   GET /api/2fa/status/:user_id
   * @access  Protected
   */
  get2FAStatus: async (req, res) => {
    try {
      const user_id = Number(req.params.user_id);
      if (!Number.isInteger(user_id) || user_id <= 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid user ID - must be a positive number')
        );
      } [18]

      const user = await User.findById(user_id); [18]
      if (!user) {
        return res.status(404).json(createResponse(false, 'User not found')); [18]
      }

      return res.status(200).json(
        createResponse(true, '2FA status retrieved successfully', {
          user_id,
          username: user.username,
          is_2fa_enabled: user.is_2fa_enabled,
          status: user.is_2fa_enabled ? 'enabled' : 'disabled',
          recommendation: user.is_2fa_enabled
            ? 'Keep 2FA enabled for better security'
            : 'Enable 2FA to improve your account security'
        })
      ); [1]
    } catch (error) {
      console.error('Get 2FA status error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get 2FA status', null, ['Internal server error'])); [18]
    }
  },

  /**
   * @desc    Verify temporary 2FA token
   * @route   POST /api/2fa/verify-temporary
   * @access  Protected
   * @body    { temp_key, token }
   */
  verifyTemporary: async (req, res) => {
    try {
      const { temp_key, token } = req.body;
      
      if (!temp_key || !token) {
        return res.status(400).json(
          createResponse(false, 'Temporary key and token are required')
        );
      }

      if (!/^\d{6}$/.test(token)) {
        return res.status(400).json(
          createResponse(false, 'Token must be exactly 6 digits')
        );
      }

      const tempData = temporarySecrets.get(temp_key);
      if (!tempData) {
        return res.status(404).json(
          createResponse(false, 'Temporary 2FA setup not found or expired')
        );
      }

      // Verify the token against the temporary secret
      const isValid = speakeasy.totp.verify({
        secret: tempData.secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps tolerance
      });

      if (!isValid) {
        return res.status(401).json(
          createResponse(false, 'Invalid 2FA token')
        );
      }

      return res.status(200).json(
        createResponse(true, 'Temporary 2FA token verified successfully', {
          temp_key,
          username: tempData.username,
          verified: true,
          message: '2FA token verified. You can now complete user creation.'
        })
      );
    } catch (error) {
      console.error('Verify temporary 2FA error:', error);
      return res.status(500).json(createResponse(false, 'Failed to verify temporary 2FA token', null, ['Internal server error']));
    }
  },

  /**
   * @desc    Get temporary 2FA secret for user creation
   * @route   GET /api/2fa/temporary/:temp_key
   * @access  Protected
   */
  getTemporary: async (req, res) => {
    try {
      const { temp_key } = req.params;
      
      if (!temp_key) {
        return res.status(400).json(
          createResponse(false, 'Temporary key is required')
        );
      }

      const tempData = temporarySecrets.get(temp_key);
      if (!tempData) {
        return res.status(404).json(
          createResponse(false, 'Temporary 2FA setup not found or expired')
        );
      }

      return res.status(200).json(
        createResponse(true, 'Temporary 2FA data retrieved', {
          temp_key,
          username: tempData.username,
          secret: tempData.secret,
          created_at: new Date(tempData.timestamp).toISOString()
        })
      );
    } catch (error) {
      console.error('Get temporary 2FA error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get temporary 2FA data', null, ['Internal server error']));
    }
  },

  /**
   * @desc    Generate backup codes (future enhancement)
   * @route   POST /api/2fa/backup-codes
   * @access  Protected
   * @body    { user_id }
   */
  generateBackupCodes: async (req, res) => {
    try {
      return res.status(501).json(
        createResponse(false, 'Backup codes feature not yet implemented', {
          message: 'This feature will be available in a future update',
          alternative: 'Ensure authenticator backups or multiple devices'
        })
      );
    } catch (error) {
      console.error('Generate backup codes error:', error);
      return res.status(500).json(createResponse(false, 'Failed to generate backup codes', null, ['Internal server error']));
    }
  }
};

// Export the temporary secrets map for use in User model if needed
twoFactorAuthController.getTemporarySecrets = () => temporarySecrets;
twoFactorAuthController.removeTemporarySecret = (key) => temporarySecrets.delete(key);

module.exports = twoFactorAuthController;
