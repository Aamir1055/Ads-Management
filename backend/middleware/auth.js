const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Extract Bearer token robustly
const getBearerToken = (req) => {
  const h = req.headers?.authorization || '';
  const [scheme, token] = h.split(' ');
  if (scheme && /^Bearer$/i.test(scheme) && token) return token.trim();
  return null;
};

// Authentication middleware
const protect = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: missing Bearer token'
      });
    }

    let decoded;
    try {
      // Synchronous verify will throw for invalid/expired tokens
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Fetch minimal user profile; ensure active
    const [rows] = await pool.query(
      'SELECT id, username, role_id FROM users WHERE id = ? AND is_active = 1 LIMIT 1',
      [decoded.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Attach user to request for downstream authorization
    req.user = rows[0];
    return next();
  } catch (error) {
    // Fallback to generic 401 to avoid leaking internals
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Role-based authorization middleware
// Accepts numeric role IDs or strings if mapping is added upstream
const authorize = (...roles) => {
  return (req, res, next) => {
    // Ensure protect ran
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Basic RBAC check against role_id
    if (!roles.includes(req.user.role_id)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role_id} is not authorized to access this route`
      });
    }

    return next();
  };
};

module.exports = { protect, authorize };
