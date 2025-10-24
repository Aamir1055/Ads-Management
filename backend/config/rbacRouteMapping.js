/**
 * RBAC Route Mapping Configuration
 * 
 * This file defines which permissions are required for each API endpoint.
 * Based on the database permissions that exist in your system:
 * 
 * User "Aamir" (role ID 27) has these permissions:
 * - brands_read
 * - campaign_types_read  
 * - campaigns_create, campaigns_read, campaigns_update
 * - card_users_create, card_users_read
 * - cards_create, cards_read
 * - permissions_read
 * - users_create, users_read
 */

const { checkModulePermission } = require('../middleware/rbacMiddleware');

/**
 * Route permission mappings
 * Each module maps HTTP methods to required permissions
 */
const ROUTE_PERMISSIONS = {
  // Campaign Types Module
  campaign_types: {
    GET: 'campaign_types_read',        // GET /api/campaign-types, GET /api/campaign-types/:id
    POST: 'campaign_types_create',     // POST /api/campaign-types
    PUT: 'campaign_types_update',      // PUT /api/campaign-types/:id
    PATCH: 'campaign_types_update',    // PATCH /api/campaign-types/:id
    DELETE: 'campaign_types_delete'    // DELETE /api/campaign-types/:id
  },

  // Cards Module  
  cards: {
    GET: 'cards_read',                 // GET /api/cards, GET /api/cards/:id
    POST: 'cards_create',              // POST /api/cards, POST /api/cards/:id/add-balance
    PUT: 'cards_update',               // PUT /api/cards/:id
    PATCH: 'cards_update',             // PATCH /api/cards/:id
    DELETE: 'cards_delete'             // DELETE /api/cards/:id
  },

  // Accounts Module
  accounts: {
    GET: 'accounts_read',              // GET /api/accounts
    POST: 'accounts_create',           // POST /api/accounts
    PUT: 'accounts_update',            // Reserved for future
    PATCH: 'accounts_update',          // POST /api/accounts/:id/add-amount (treated as update)
    DELETE: 'accounts_delete'          // Reserved for future
  },

  // Campaigns Module
  campaigns: {
    GET: 'campaigns_read',             // GET /api/campaigns, GET /api/campaigns/:id
    POST: 'campaigns_create',          // POST /api/campaigns
    PUT: 'campaigns_update',           // PUT /api/campaigns/:id
    PATCH: 'campaigns_update',         // PATCH /api/campaigns/:id/toggle-status
    DELETE: 'campaigns_delete'         // DELETE /api/campaigns/:id
  },

  // Campaign Data Module
  campaign_data: {
    GET: 'campaign_data_read',         // GET /api/campaign-data
    POST: 'campaign_data_create',      // POST /api/campaign-data
    PUT: 'campaign_data_update',       // PUT /api/campaign-data/:id
    PATCH: 'campaign_data_update',     // PATCH /api/campaign-data/:id
    DELETE: 'campaign_data_delete'     // DELETE /api/campaign-data/:id
  },


  // User Management Module
  users: {
    GET: 'users_read',                 // GET /api/users, GET /api/users/:id
    POST: 'users_create',              // POST /api/users
    PUT: 'users_update',               // PUT /api/users/:id
    PATCH: 'users_update',             // PATCH /api/users/:id
    DELETE: 'users_delete'             // DELETE /api/users/:id
  },

  // Card Users Module (if exists)
  card_users: {
    GET: 'card_users_read',            // GET /api/card-users
    POST: 'card_users_create',         // POST /api/card-users
    PUT: 'card_users_update',          // PUT /api/card-users/:id
    PATCH: 'card_users_update',        // PATCH /api/card-users/:id
    DELETE: 'card_users_delete'        // DELETE /api/card-users/:id
  },

  // Brands Module
  brands: {
    GET: 'brands_read',                // GET /api/brands, GET /api/brands/:id
    POST: 'brands_create',             // POST /api/brands
    PUT: 'brands_update',              // PUT /api/brands/:id
    PATCH: 'brands_update',            // PATCH /api/brands/:id
    DELETE: 'brands_delete'            // DELETE /api/brands/:id
  },

  // Permissions Module (usually admin-only)
  permissions: {
    GET: 'permissions_read',           // GET /api/permissions
    POST: 'permissions_create',        // POST /api/permissions
    PUT: 'permissions_update',         // PUT /api/permissions/:id
    PATCH: 'permissions_update',       // PATCH /api/permissions/:id
    DELETE: 'permissions_delete'       // DELETE /api/permissions/:id
  },

  // Reports Module
  reports: {
    GET: 'reports_read',               // GET /api/reports
    POST: 'reports_create',            // POST /api/reports
    PUT: 'reports_update',             // PUT /api/reports/:id
    PATCH: 'reports_update',           // PATCH /api/reports/:id
    DELETE: 'reports_delete',          // DELETE /api/reports/:id
    EXPORT: 'reports_export'           // Export functionality
  }
};

/**
 * Helper function to get permission middleware for a specific route
 * @param {string} module - Module name (e.g., 'campaign_types', 'cards')
 * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {string} action - Optional specific action (e.g., 'export' for reports)
 * @returns {Function} Middleware function
 */
const getPermissionMiddleware = (module, method, action = null) => {
  const modulePermissions = ROUTE_PERMISSIONS[module];
  
  if (!modulePermissions) {
    throw new Error(`No permission mapping found for module: ${module}`);
  }

  // Handle special actions first (like export)
  if (action && modulePermissions[action.toUpperCase()]) {
    const permissionName = modulePermissions[action.toUpperCase()];
    const actionName = permissionName.split('_').pop(); // Extract action from permission name
    return checkModulePermission(module, actionName);
  }

  // Handle standard HTTP methods
  const permissionName = modulePermissions[method.toUpperCase()];
  if (!permissionName) {
    throw new Error(`No permission mapping found for ${method.toUpperCase()} ${module}`);
  }

  // Extract action from permission name (e.g., 'cards_read' -> 'read')
  const actionName = permissionName.split('_').pop();
  return checkModulePermission(module, actionName);
};

/**
 * Middleware factory functions for each module
 * These create the specific permission checking middleware for common operations
 */
const createPermissionMiddleware = {
  // Campaign Types
  campaignTypes: {
    read: () => getPermissionMiddleware('campaign_types', 'GET'),
    create: () => getPermissionMiddleware('campaign_types', 'POST'),
    update: () => getPermissionMiddleware('campaign_types', 'PUT'),
    delete: () => getPermissionMiddleware('campaign_types', 'DELETE')
  },

  // Cards  
  cards: {
    read: () => getPermissionMiddleware('cards', 'GET'),
    create: () => getPermissionMiddleware('cards', 'POST'),
    update: () => getPermissionMiddleware('cards', 'PUT'),
    delete: () => getPermissionMiddleware('cards', 'DELETE')
  },

  // Accounts
  accounts: {
    read: () => getPermissionMiddleware('accounts', 'GET'),
    create: () => getPermissionMiddleware('accounts', 'POST'),
    update: () => getPermissionMiddleware('accounts', 'PUT'),
    delete: () => getPermissionMiddleware('accounts', 'DELETE')
  },

  // Campaigns
  campaigns: {
    read: () => getPermissionMiddleware('campaigns', 'GET'),
    create: () => getPermissionMiddleware('campaigns', 'POST'),
    update: () => getPermissionMiddleware('campaigns', 'PUT'),
    delete: () => getPermissionMiddleware('campaigns', 'DELETE')
  },

  // Campaign Data
  campaignData: {
    read: () => getPermissionMiddleware('campaign_data', 'GET'),
    create: () => getPermissionMiddleware('campaign_data', 'POST'),
    update: () => getPermissionMiddleware('campaign_data', 'PUT'),
    delete: () => getPermissionMiddleware('campaign_data', 'DELETE')
  },


  // Users
  users: {
    read: () => getPermissionMiddleware('users', 'GET'),
    create: () => getPermissionMiddleware('users', 'POST'),
    update: () => getPermissionMiddleware('users', 'PUT'),
    delete: () => getPermissionMiddleware('users', 'DELETE')
  },

  // Brands
  brands: {
    read: () => getPermissionMiddleware('brands', 'GET'),
    create: () => getPermissionMiddleware('brands', 'POST'),
    update: () => getPermissionMiddleware('brands', 'PUT'),
    delete: () => getPermissionMiddleware('brands', 'DELETE')
  },

  // Reports
  reports: {
    read: () => getPermissionMiddleware('reports', 'GET'),
    create: () => getPermissionMiddleware('reports', 'POST'),
    update: () => getPermissionMiddleware('reports', 'PUT'),
    delete: () => getPermissionMiddleware('reports', 'DELETE'),
    export: () => getPermissionMiddleware('reports', 'GET', 'export')
  }
};

/**
 * Expected behavior with current permissions:
 * 
 * User "Aamir" should be able to:
 * ✅ GET /api/brands (has brands_read)
 * ✅ GET /api/campaign-types (has campaign_types_read)
 * ✅ GET, POST, PUT /api/campaigns (has campaigns_create, campaigns_read, campaigns_update)
 * ✅ GET, POST /api/cards (has cards_create, cards_read)
 * ✅ GET, POST /api/users (has users_create, users_read)
 * ✅ GET, POST /api/reports (has reports_create, reports_read)
 * ✅ Export reports (has reports_export)
 * 
 * User "Aamir" should be blocked from:
 * ❌ POST, PUT, DELETE /api/brands (missing brands_create, brands_update, brands_delete)
 * ❌ POST, PUT, DELETE /api/campaign-types (missing campaign_types_create, campaign_types_update, campaign_types_delete)
 * ❌ DELETE /api/campaigns (missing campaigns_delete)
 * ❌ PUT, DELETE /api/cards (missing cards_update, cards_delete)
 * ❌ PUT, DELETE /api/users (missing users_update, users_delete)
 * ❌ PUT, DELETE /api/reports (missing reports_update, reports_delete)
 */

module.exports = {
  ROUTE_PERMISSIONS,
  getPermissionMiddleware,
  createPermissionMiddleware
};
