/**
 * Data Privacy Middleware
 * Implements user-based data isolation using token information
 * Users can only see their own data, admins can see everything
 */

const { pool } = require('../config/database');

/**
 * Check if user is admin (can see all data)
 * @param {Object} user - User object from token
 * @returns {boolean} - True if user is admin
 */
const isAdmin = (user) => {
  // Admin users have role level >= 8
  return user && user.role && user.role.level >= 8;
};

/**
 * Check if user is super admin (highest level access)
 * @param {Object} user - User object from token
 * @returns {boolean} - True if user is super admin
 */
const isSuperAdmin = (user) => {
  return user && user.role && user.role.level >= 10;
};

/**
 * Add user-based filtering to SQL queries
 * @param {string} baseQuery - The original SQL query
 * @param {string} tableAlias - Table alias (e.g., 'cd' for campaign_data)
 * @param {string} userColumn - Column name for user ownership (e.g., 'created_by')
 * @param {number} userId - Current user ID
 * @param {boolean} isAdminUser - Whether user is admin
 * @returns {string} - Modified query with user filtering
 */
const addUserFilter = (baseQuery, tableAlias, userColumn, userId, isAdminUser = false) => {
  if (isAdminUser) {
    // Admins see all data
    return baseQuery;
  }

  // Add user filtering for regular users
  const filterClause = `${tableAlias}.${userColumn} = ${userId}`;
  
  if (baseQuery.toLowerCase().includes('where')) {
    // Query already has WHERE clause, add AND condition
    return baseQuery.replace(/where/i, `WHERE ${filterClause} AND (`).replace(/$/,')');;
  } else {
    // No WHERE clause, add one
    const orderByMatch = baseQuery.match(/(ORDER BY.*?)$/i);
    const limitMatch = baseQuery.match(/(LIMIT.*?)$/i);
    
    let insertPoint = baseQuery.length;
    let suffix = '';
    
    if (limitMatch) {
      insertPoint = baseQuery.lastIndexOf(limitMatch[1]);
      suffix = limitMatch[1];
      baseQuery = baseQuery.substring(0, insertPoint);
    }
    
    if (orderByMatch && !limitMatch) {
      insertPoint = baseQuery.lastIndexOf(orderByMatch[1]);
      suffix = orderByMatch[1];
      baseQuery = baseQuery.substring(0, insertPoint);
    }
    
    return `${baseQuery} WHERE ${filterClause} ${suffix}`;
  }
};

/**
 * Middleware to add user context for data privacy
 * Attaches helper methods to req object
 */
const dataPrivacyMiddleware = (req, res, next) => {
  // Add user context helpers to request
  req.userContext = {
    // Current user info
    userId: req.user?.id,
    isAdmin: isAdmin(req.user),
    isSuperAdmin: isSuperAdmin(req.user),
    user: req.user,

    // Helper method to filter queries
    addUserFilter: (query, tableAlias, userColumn = 'created_by') => {
      return addUserFilter(query, tableAlias, userColumn, req.user?.id, isAdmin(req.user));
    },

    // Helper method to check if user can access specific record
    canAccessRecord: (record, userColumn = 'created_by') => {
      if (isAdmin(req.user)) return true;
      return record[userColumn] === req.user?.id;
    },

    // Helper method to add user ownership to new records
    addOwnership: (data) => {
      return {
        ...data,
        created_by: req.user?.id
      };
    },

    // Get filtered data based on user permissions
    getFilteredData: async (tableName, userColumn = 'created_by', conditions = '', params = []) => {
      try {
        let query = `SELECT * FROM ${tableName}`;
        
        if (conditions) {
          query += ` WHERE ${conditions}`;
        }
        
        // Add user filtering for non-admins
        if (!isAdmin(req.user)) {
          const userFilter = `${userColumn} = ?`;
          if (conditions) {
            query += ` AND ${userFilter}`;
          } else {
            query += ` WHERE ${userFilter}`;
          }
          params.push(req.user?.id);
        }
        
        const [results] = await pool.query(query, params);
        return results;
      } catch (error) {
        console.error('Error in getFilteredData:', error);
        throw error;
      }
    }
  };

  next();
};

/**
 * Middleware specifically for campaign data privacy
 */
const campaignDataPrivacy = (req, res, next) => {
  req.campaignDataContext = {
    // Get campaign data with user filtering
    getCampaignData: async (conditions = '', params = []) => {
      return req.userContext.getFilteredData('campaign_data', 'created_by', conditions, params);
    },

    // Filter campaign data query
    filterCampaignDataQuery: (query) => {
      return req.userContext.addUserFilter(query, 'cd', 'created_by');
    }
  };

  next();
};

/**
 * Middleware specifically for campaigns privacy
 */
const campaignPrivacy = (req, res, next) => {
  req.campaignContext = {
    // Get campaigns with user filtering
    getCampaigns: async (conditions = '', params = []) => {
      return req.userContext.getFilteredData('campaigns', 'created_by', conditions, params);
    },

    // Filter campaigns query
    filterCampaignQuery: (query) => {
      return req.userContext.addUserFilter(query, 'c', 'created_by');
    }
  };

  next();
};

/**
 * Middleware to ensure created_by is set on data creation
 */
const ensureOwnership = (req, res, next) => {
  // For POST requests, ensure created_by is set
  if (req.method === 'POST' && req.user?.id) {
    if (req.body && typeof req.body === 'object') {
      req.body.created_by = req.user.id;
    }
  }

  next();
};

/**
 * Validation middleware to check record ownership before modification
 */
const validateOwnership = (tableName, userColumn = 'created_by', idParam = 'id') => {
  return async (req, res, next) => {
    try {
      // Admins can modify any record
      if (isAdmin(req.user)) {
        return next();
      }

      const recordId = req.params[idParam];
      if (!recordId) {
        return res.status(400).json({
          success: false,
          message: 'Record ID is required'
        });
      }

      // Check if record exists and belongs to user
      const [records] = await pool.query(
        `SELECT ${userColumn} FROM ${tableName} WHERE id = ?`,
        [recordId]
      );

      if (records.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Record not found'
        });
      }

      if (records[0][userColumn] !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only modify your own data.'
        });
      }

      next();
    } catch (error) {
      console.error('Error in validateOwnership middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error validating record ownership'
      });
    }
  };
};

module.exports = {
  dataPrivacyMiddleware,
  campaignDataPrivacy,
  campaignPrivacy,
  ensureOwnership,
  validateOwnership,
  isAdmin,
  isSuperAdmin,
  addUserFilter
};
