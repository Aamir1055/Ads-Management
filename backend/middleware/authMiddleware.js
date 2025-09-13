const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const crypto = require('crypto');

// JWT Configuration
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'access_token_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_token_secret';
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Long-lived refresh token

// Generate tokens
const generateTokens = (userId) => {
  const payload = { userId, type: 'access' };
  const refreshPayload = { userId, type: 'refresh', tokenId: crypto.randomUUID() };
  
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
  const refreshToken = jwt.sign(refreshPayload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  
  return { accessToken, refreshToken, tokenId: refreshPayload.tokenId };
};

// Store refresh token in database
const storeRefreshToken = async (userId, tokenId, expiresAt) => {
  await pool.execute(
    'INSERT INTO refresh_tokens (user_id, token_id, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token_id = VALUES(token_id), expires_at = VALUES(expires_at), created_at = NOW()',
    [userId, tokenId, expiresAt]
  );
};

// Verify and get refresh token from database
const getRefreshToken = async (userId, tokenId) => {
  const [tokens] = await pool.execute(
    'SELECT * FROM refresh_tokens WHERE user_id = ? AND token_id = ? AND expires_at > NOW() AND is_active = 1',
    [userId, tokenId]
  );
  return tokens[0] || null;
};

// Revoke refresh token
const revokeRefreshToken = async (userId, tokenId) => {
  await pool.execute(
    'UPDATE refresh_tokens SET is_active = 0 WHERE user_id = ? AND token_id = ?',
    [userId, tokenId]
  );
};

// Main authentication middleware - verifies access token
const authenticateToken = async (req, res, next) => {
  let decoded = null;
  let token = null;
  
  try {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No access token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Verify the access token
    try {
      decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
      
      // Ensure it's an access token
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Access token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED'
        });
      }
      throw jwtError;
    }
    
    // Get user with role information from database
    const [users] = await pool.execute(`
      SELECT 
        u.id, u.username, u.is_active, u.last_login,
        r.id as role_id, r.name as role_name, r.display_name as role_display_name, 
        r.level as role_level, r.is_active as role_active
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.is_active = 1 AND r.is_active = 1
    `, [decoded.userId]);

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found, inactive, or role is inactive.',
        code: 'INVALID_USER'
      });
    }

    const user = users[0];

    // Get user permissions
    const [permissions] = await pool.execute(`
      SELECT 
        p.name,
        p.display_name,
        p.category
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.is_active = 1
      ORDER BY p.category, p.display_name
    `, [user.id]);

    // Attach comprehensive user info to request object
    req.user = {
      id: user.id,
      username: user.username,
      lastLogin: user.last_login,
      role: {
        id: user.role_id,
        name: user.role_name,
        displayName: user.role_display_name,
        level: user.role_level
      },
      permissions: permissions.map(p => p.name),
      permissionsDetailed: permissions.reduce((acc, perm) => {
        if (!acc[perm.category]) {
          acc[perm.category] = [];
        }
        acc[perm.category].push({
          name: perm.name,
          displayName: perm.display_name
        });
        return acc;
      }, {})
    };

    next();
  } catch (error) {
    console.error('Authentication error:', {
      error: error.message,
      stack: error.stack,
      userId: decoded?.userId,
      tokenPresent: !!token
    });
    
    // Provide more specific error messages
    let errorMessage = 'Invalid or malformed access token.';
    let errorCode = 'INVALID_TOKEN';
    
    if (error.message.includes('jwt malformed')) {
      errorMessage = 'Token is malformed. Please login again.';
      errorCode = 'MALFORMED_TOKEN';
    } else if (error.message.includes('invalid signature')) {
      errorMessage = 'Token signature is invalid. Please login again.';
      errorCode = 'INVALID_SIGNATURE';
    } else if (error.message.includes('Invalid token type')) {
      errorMessage = 'Wrong token type provided. Please use access token.';
      errorCode = 'WRONG_TOKEN_TYPE';
    }
    
    return res.status(403).json({ 
      success: false, 
      message: errorMessage,
      code: errorCode
    });
  }
};

// Refresh token endpoint middleware
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required.',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired. Please login again.',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }
      throw jwtError;
    }

    // Verify refresh token exists in database and is active
    const storedToken = await getRefreshToken(decoded.userId, decoded.tokenId);
    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token. Please login again.',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check if user still exists and is active
    const [users] = await pool.execute(
      'SELECT id, username FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      // Revoke the refresh token
      await revokeRefreshToken(decoded.userId, decoded.tokenId);
      return res.status(401).json({
        success: false,
        message: 'User account is inactive. Please contact administrator.',
        code: 'USER_INACTIVE'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(decoded.userId);
    
    // Store new refresh token and revoke old one
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await revokeRefreshToken(decoded.userId, decoded.tokenId);
    await storeRefreshToken(decoded.userId, tokens.tokenId, refreshExpiresAt);

    // Send new tokens
    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: users[0].id,
          username: users[0].username
        }
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Token refresh failed.',
      code: 'REFRESH_FAILED'
    });
  }
};

// Legacy authentication support (for backward compatibility)
const authenticate = authenticateToken;

// Permission middleware - checks if user has required permission
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Check if user has the required permission
    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${requiredPermission}`
      });
    }

    next();
  };
};

// Permission middleware - checks if user has any of the required permissions
const requireAnyPermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`
      });
    }

    next();
  };
};

// Role middleware - checks if user has required role
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role.name !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${requiredRole}`
      });
    }

    next();
  };
};

// Role level checking middleware (for hierarchical permissions)
const requireRoleLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role.level < minLevel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Insufficient role level. Required: ${minLevel}, Current: ${req.user.role.level}`
      });
    }

    next();
  };
};

// Admin middleware - checks if user is admin or super admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const adminRoles = ['admin', 'super_admin'];
  if (!adminRoles.includes(req.user.role.name)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

// Super admin middleware
const requireSuperAdmin = requireRole('super_admin');

// Logout middleware - revokes refresh token
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Decode to get tokenId and userId
      try {
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        await revokeRefreshToken(decoded.userId, decoded.tokenId);
      } catch (error) {
        // Token might be invalid, but we'll still proceed with logout
        console.warn('Error revoking refresh token during logout:', error.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

module.exports = {
  // Authentication functions
  authenticate,
  authenticateToken,
  
  // Token management
  generateTokens,
  refreshAccessToken,
  logout,
  
  // Permission checking
  requirePermission,
  requireAnyPermission,
  
  // Role checking
  requireRole,
  requireRoleLevel,
  requireAdmin,
  requireSuperAdmin,
  
  // Token utilities
  storeRefreshToken,
  revokeRefreshToken
};
