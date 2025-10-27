const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const PermissionManager = require('../utils/PermissionManager');

/**
 * Enhanced Authentication Middleware
 * Provides user authentication with integrated permission system
 */

const createResponse = (success, message, data = null) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  ...(data && { data })
});

const getClientIp = (req) => {
  if (req.ip) return req.ip;
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  } else if (Array.isArray(xff) && xff.length) {
    return xff[0];
  }
  return req.socket?.remoteAddress || 'unknown';
};

/**
 * Basic authentication middleware - validates JWT and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json(createResponse(false, 'Access denied. No token provided.'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details from database
    const [users] = await pool.execute(`
      SELECT id, username, role_id, is_active, last_login,
             twofa_enabled, is_2fa_enabled
      FROM users 
      WHERE id = ? AND is_active = 1
    `, [decoded.id]);

    if (users.length === 0) {
      return res.status(401).json(createResponse(false, 'Invalid token. User not found or inactive.'));
    }

    const user = users[0];

    // Check if 2FA is required
    const requires2FA = user.twofa_enabled || user.is_2fa_enabled;
    if (requires2FA && !decoded.twofa_verified) {
      return res.status(401).json(createResponse(false, 'Two-factor authentication required.', {
        requires2FA: true,
        userId: user.id
      }));
    }

    // Attach user information to request
    req.user = user;
    req.clientIp = getClientIp(req);
    req.userAgent = req.get('User-Agent') || 'unknown';

    // Get user permissions and roles for easy access
    req.userPermissions = await PermissionManager.getUserPermissionsByModule(user.id);
    req.userRoles = await PermissionManager.getUserRoles(user.id);
    
    // Helper functions
    req.hasPermission = (permissionKey) => PermissionManager.hasPermission(user.id, permissionKey);
    req.hasRole = (roleName) => req.userRoles.some(role => role.name === roleName);
    req.canManageUser = (targetUserId) => PermissionManager.canManageUser(user.id, targetUserId);

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(createResponse(false, 'Invalid token format.'));
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(createResponse(false, 'Token has expired. Please login again.'));
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json(createResponse(false, 'Authentication failed due to server error.'));
  }
};

/**
 * Optional authentication - attaches user if token is provided, but doesn't require it
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      req.user = null;
      return next();
    }

    // Try to authenticate, but don't fail if token is invalid
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [users] = await pool.execute(`
        SELECT id, username, role_id, is_active
        FROM users WHERE id = ? AND is_active = 1
      `, [decoded.id]);

      if (users.length > 0) {
        req.user = users[0];
        req.userPermissions = await PermissionManager.getUserPermissionsByModule(users[0].id);
        req.userRoles = await PermissionManager.getUserRoles(users[0].id);
        req.hasPermission = (permissionKey) => PermissionManager.hasPermission(users[0].id, permissionKey);
        req.hasRole = (roleName) => req.userRoles.some(role => role.name === roleName);
      }
    } catch (tokenError) {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    req.user = null;
    next();
  }
};

/**
 * Permission-based authorization middleware
 */
const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(createResponse(false, 'Authentication required.'));
      }

      const hasPermission = await PermissionManager.hasPermission(req.user.id, permissionKey);
      
      if (!hasPermission) {
        return res.status(403).json(createResponse(false, `Access denied. Required permission: ${permissionKey}`));
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json(createResponse(false, 'Permission check failed.'));
    }
  };
};

/**
 * Role-based authorization middleware
 */
const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(createResponse(false, 'Authentication required.'));
      }

      const userRoles = await PermissionManager.getUserRoles(req.user.id);
      const userRoleNames = userRoles.map(role => role.name);
      
      const hasRequiredRole = roleArray.some(role => userRoleNames.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json(createResponse(false, `Access denied. Required role(s): ${roleArray.join(', ')}`));
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json(createResponse(false, 'Role check failed.'));
    }
  };
};

/**
 * Middleware to check if user can manage another user (hierarchy check)
 */
const requireUserManagement = (targetUserIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(createResponse(false, 'Authentication required.'));
      }

      const targetUserId = Number(req.params[targetUserIdParam]);
      
      if (!targetUserId || targetUserId <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid user ID.'));
      }

      // Allow users to manage themselves
      if (req.user.id === targetUserId) {
        return next();
      }

      const canManage = await PermissionManager.canManageUser(req.user.id, targetUserId);
      
      if (!canManage) {
        return res.status(403).json(createResponse(false, 'Access denied. Cannot manage user with higher privileges.'));
      }

      next();
    } catch (error) {
      console.error('User management check error:', error);
      return res.status(500).json(createResponse(false, 'User management check failed.'));
    }
  };
};

/**
 * Middleware to check module access
 */
const requireModuleAccess = (moduleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(createResponse(false, 'Authentication required.'));
      }

      const hasAccess = await PermissionManager.hasModuleAccess(req.user.id, moduleName);
      
      if (!hasAccess) {
        return res.status(403).json(createResponse(false, `Access denied to ${moduleName} module.`));
      }

      next();
    } catch (error) {
      console.error('Module access check error:', error);
      return res.status(500).json(createResponse(false, 'Module access check failed.'));
    }
  };
};

/**
 * Admin-only middleware (requires Admin or Super Admin role)
 */
const requireAdmin = requireRole(['Super Admin', 'Admin']);

/**
 * Super Admin-only middleware
 */
const requireSuperAdmin = requireRole('Super Admin');

/**
 * Middleware to attach user permissions to response headers (for frontend)
 */
const attachUserPermissions = async (req, res, next) => {
  try {
    if (req.user && req.userPermissions) {
      res.setHeader('X-User-Permissions', JSON.stringify(Object.keys(req.userPermissions)));
      res.setHeader('X-User-Roles', JSON.stringify(req.userRoles.map(r => r.name)));
    }
    next();
  } catch (error) {
    console.error('Error attaching permissions to headers:', error);
    next();
  }
};

/**
 * Utility function to extract token from request
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const tokenFromCookie = req.cookies?.token;
  const tokenFromQuery = req.query?.token;
  
  return tokenFromHeader || tokenFromCookie || tokenFromQuery;
};

/**
 * Middleware to log user actions for audit purposes
 */
const auditLogger = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        // Store audit info in request for potential later use
        req.auditLog = {
          userId: req.user.id,
          action: action,
          resource: req.originalUrl,
          method: req.method,
          ip: getClientIp(req),
          userAgent: req.userAgent,
          timestamp: new Date()
        };

        // You can implement actual audit logging to database here
        if (process.env.NODE_ENV === 'development') {
          console.log('Audit Log:', req.auditLog);
        }
      }
      next();
    } catch (error) {
      console.error('Audit logging error:', error);
      next(); // Don't block the request due to audit logging errors
    }
  };
};

/**
 * Rate limiting based on user roles
 */
const roleBasedRateLimit = () => {
  const limits = new Map();
  
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next();
      }

      const userId = req.user.id;
      const userRoles = req.userRoles || [];
      const now = Date.now();
      
      // Determine rate limit based on highest role level
      const highestRole = userRoles.reduce((highest, role) => 
        (role.level > highest.level) ? role : highest, { level: 0 });
      
      let maxRequests, windowMs;
      
      if (highestRole.level >= 8) { // Admin level
        maxRequests = 1000;
        windowMs = 60 * 1000; // 1 minute
      } else if (highestRole.level >= 5) { // Manager level
        maxRequests = 500;
        windowMs = 60 * 1000;
      } else { // Regular user
        maxRequests = 100;
        windowMs = 60 * 1000;
      }

      const userLimits = limits.get(userId) || { count: 0, resetTime: now + windowMs };
      
      if (now > userLimits.resetTime) {
        userLimits.count = 1;
        userLimits.resetTime = now + windowMs;
      } else {
        userLimits.count++;
      }

      limits.set(userId, userLimits);

      if (userLimits.count > maxRequests) {
        return res.status(429).json(createResponse(false, 'Rate limit exceeded. Please try again later.'));
      }

      next();
    } catch (error) {
      console.error('Role-based rate limiting error:', error);
      next();
    }
  };
};

/**
 * Simple request size validator (1MB default limit)
 */
const validateRequestSize = (req, res, next) => {
  const contentLength = req.get && req.get('content-length');
  if (contentLength && Number(contentLength) > 1024 * 1024) {
    return res.status(413).json(createResponse(false, 'Request body too large'));
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requirePermission,
  requireRole,
  requireUserManagement,
  requireModuleAccess,
  requireAdmin,
  requireSuperAdmin,
  attachUserPermissions,
  auditLogger,
  roleBasedRateLimit,
  validateRequestSize,
  extractToken,
  getClientIp,
  createResponse
};
