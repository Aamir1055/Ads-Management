const express = require('express');
const router = express.Router();
const {
  setup2FA,
  verifySetup,
  verifyLogin,
  disable2FA,
  get2FAStatus,
  generateBackupCodes,
  verifyTemporary,
  getTemporary
} = require('../controllers/twoFactorAuthController');

// Import middleware (uncomment when auth is implemented)
// const { authenticate, authorize } = require('../middleware/auth');

// Enhanced request logging middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  
  console.log(`[${timestamp}] 2FA ${req.method} ${req.originalUrl} - IP: ${clientIp}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Hide sensitive fields
    const sensitiveFields = ['token', 'current_token', 'secret', 'qr_code'];
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) sanitizedBody[field] = '[HIDDEN]';
    });
    console.log('Request Body:', JSON.stringify(sanitizedBody, null, 2));
  }
  
  next();
};

// Rate limiting for 2FA operations
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 10, message = 'Too many 2FA requests') => {
  const requests = new Map();
  
  // Cleanup old entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!requests.has(clientId)) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const clientData = requests.get(clientId);
    
    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
      return next();
    }
    
    if (clientData.count >= max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
        timestamp: new Date().toISOString()
      });
    }
    
    clientData.count++;
    next();
  };
};

// Input validation middleware for user_id parameter
const validateUserIdParam = (req, res, next) => {
  const userId = parseInt(req.params.user_id);
  if (!userId || isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID - must be a positive number',
      timestamp: new Date().toISOString()
    });
  }
  req.params.user_id = userId;
  next();
};

// Apply global middleware
router.use(requestLogger);

// =============================================================================
// PUBLIC 2FA ROUTES (Used during authentication flow)
// =============================================================================

/**
 * @route   POST /api/2fa/verify-login
 * @desc    Verify 2FA token during login process
 * @access  Public (called during login flow)
 * @body    { user_id, token }
 */
router.post('/verify-login',
  createRateLimit(5 * 60 * 1000, 15, 'Too many 2FA login verification attempts. Please wait before trying again.'),
  verifyLogin
);

// =============================================================================
// PROTECTED 2FA ROUTES (Require authentication)
// =============================================================================
// Note: Uncomment the middleware below when authentication is implemented
// router.use(authenticate); // Require valid JWT token for routes below

/**
 * @route   POST /api/2fa/setup
 * @desc    Generate 2FA setup with QR code
 * @access  Protected
 * @body    { username }
 */
router.post('/setup',
  createRateLimit(10 * 60 * 1000, 5, 'Too many 2FA setup attempts. Please wait before trying again.'),
  setup2FA
);

/**
 * @route   POST /api/2fa/verify-setup
 * @desc    Verify and complete 2FA setup
 * @access  Protected
 * @body    { user_id, token }
 */
router.post('/verify-setup',
  createRateLimit(10 * 60 * 1000, 10, 'Too many 2FA setup verification attempts.'),
  verifySetup
);

/**
 * @route   GET /api/2fa/status/:user_id
 * @desc    Get 2FA status for user
 * @access  Protected
 * @params  user_id - User ID (positive integer)
 */
router.get('/status/:user_id',
  validateUserIdParam,
  createRateLimit(5 * 60 * 1000, 50, 'Too many 2FA status requests.'),
  get2FAStatus
);

/**
 * @route   POST /api/2fa/disable
 * @desc    Disable 2FA for user (requires current 2FA token)
 * @access  Protected
 * @body    { user_id, current_token }
 */
router.post('/disable',
  createRateLimit(30 * 60 * 1000, 5, 'Too many 2FA disable attempts. Please wait before trying again.'),
  disable2FA
);

/**
 * @route   POST /api/2fa/verify-temporary
 * @desc    Verify temporary 2FA token for new user setup
 * @access  Protected
 * @body    { temp_key, token }
 */
router.post('/verify-temporary',
  createRateLimit(10 * 60 * 1000, 10, 'Too many temporary 2FA verification attempts.'),
  verifyTemporary
);

/**
 * @route   GET /api/2fa/temporary/:temp_key
 * @desc    Get temporary 2FA data
 * @access  Protected
 * @params  temp_key - Temporary key for 2FA setup
 */
router.get('/temporary/:temp_key',
  createRateLimit(5 * 60 * 1000, 20, 'Too many temporary 2FA data requests.'),
  getTemporary
);

/**
 * @route   POST /api/2fa/backup-codes
 * @desc    Generate new backup codes (requires current 2FA token)
 * @access  Protected
 * @body    { user_id, current_token }
 */
router.post('/backup-codes',
  createRateLimit(60 * 60 * 1000, 3, 'Too many backup code generation attempts. Please wait before trying again.'),
  generateBackupCodes
);

// =============================================================================
// UTILITY ROUTES
// =============================================================================

/**
 * @route   GET /api/2fa/info
 * @desc    Get general information about 2FA
 * @access  Public
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    message: '2FA information retrieved successfully',
    data: {
      what_is_2fa: 'Two-Factor Authentication adds an extra layer of security to your account',
      supported_apps: [
        'Google Authenticator',
        'Microsoft Authenticator',
        'Authy',
        'LastPass Authenticator',
        '1Password'
      ],
      setup_process: {
        step1: 'Enable 2FA in your account settings',
        step2: 'Scan the QR code with your authenticator app',
        step3: 'Enter the 6-digit code to complete setup',
        step4: 'Save the backup codes in a secure location'
      },
      security_tips: [
        'Use a reputable authenticator app',
        'Keep your backup codes secure and offline',
        'Don\'t share your 2FA codes with anyone',
        'Enable 2FA on all important accounts'
      ],
      token_info: {
        format: '6 digits',
        refresh_interval: '30 seconds',
        tolerance_window: '±90 seconds for login verification'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Handle invalid routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `2FA Route ${req.method} ${req.originalUrl} not found`,
    available_routes: {
      'POST /2fa/setup': 'Generate 2FA setup with QR code',
      'POST /2fa/verify-setup': 'Verify and complete 2FA setup',
      'POST /2fa/verify-login': 'Verify 2FA token during login',
      'GET /2fa/status/:user_id': 'Get 2FA status for user',
      'POST /2fa/disable': 'Disable 2FA for user',
      'POST /2fa/backup-codes': 'Generate new backup codes',
      'GET /2fa/info': 'Get 2FA information and setup guide'
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced global error handler
router.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] 2FA routes error:`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    error: error.message,
    stack: error.stack
  });
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '2FA validation error',
      errors: error.details || [error.message],
      timestamp
    });
  }

  if (error.message.includes('2FA')) {
    return res.status(400).json({
      success: false,
      message: 'Two-Factor Authentication error',
      error: error.message,
      timestamp
    });
  }

  if (error.code === 'ETIMEDOUT') {
    return res.status(408).json({
      success: false,
      message: '2FA request timeout',
      timestamp
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error in 2FA system',
    timestamp,
    ...(process.env.NODE_ENV === 'development' && { 
      error: error.message,
      stack: error.stack 
    })
  });
});

module.exports = router;
