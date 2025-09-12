// =============================================================================
// PERMISSIONS SYSTEM USAGE EXAMPLES
// =============================================================================

const express = require('express');
const PermissionManager = require('../utils/PermissionManager');

// Example of how to use the permission system in your existing routes

// =============================================================================
// 1. MIDDLEWARE USAGE EXAMPLES
// =============================================================================

// Example: Protecting campaign routes with permissions
const campaignRoutes = express.Router();

// Create campaign - requires campaigns.create permission
campaignRoutes.post('/', 
  PermissionManager.requirePermission('campaigns.create'),
  async (req, res) => {
    // Your existing campaign creation logic here
    res.json({ message: 'Campaign created successfully' });
  }
);

// Read campaigns - requires campaigns.read permission
campaignRoutes.get('/', 
  PermissionManager.requirePermission('campaigns.read'),
  async (req, res) => {
    // Your existing campaign retrieval logic here
    res.json({ message: 'Campaigns retrieved successfully' });
  }
);

// Update campaign - requires campaigns.update permission
campaignRoutes.put('/:id', 
  PermissionManager.requirePermission('campaigns.update'),
  async (req, res) => {
    // Your existing campaign update logic here
    res.json({ message: 'Campaign updated successfully' });
  }
);

// Delete campaign - requires campaigns.delete permission
campaignRoutes.delete('/:id', 
  PermissionManager.requirePermission('campaigns.delete'),
  async (req, res) => {
    // Your existing campaign deletion logic here
    res.json({ message: 'Campaign deleted successfully' });
  }
);

// =============================================================================
// 2. ROLE-BASED PROTECTION EXAMPLES
// =============================================================================

// Example: Protecting user management routes with roles
const userManagementRoutes = express.Router();

// Only admins and managers can create users
userManagementRoutes.post('/', 
  PermissionManager.requireRole(['Super Admin', 'Admin', 'Manager']),
  async (req, res) => {
    res.json({ message: 'User created by admin/manager' });
  }
);

// Only super admins can delete users
userManagementRoutes.delete('/:id', 
  PermissionManager.requireRole('Super Admin'),
  async (req, res) => {
    res.json({ message: 'User deleted by super admin' });
  }
);

// =============================================================================
// 3. MANUAL PERMISSION CHECKING EXAMPLES
// =============================================================================

// Example: Manual permission checking in controller
const advancedUserController = {
  updateUser: async (req, res) => {
    const userId = req.user.id;
    const targetUserId = Number(req.params.id);

    try {
      // Check if user can update users in general
      const canUpdateUsers = await PermissionManager.hasPermission(userId, 'users.update');
      
      if (!canUpdateUsers) {
        // If not, check if they can at least update their own profile
        if (userId !== targetUserId) {
          return res.status(403).json({ 
            success: false, 
            message: 'Permission denied: Cannot update other users' 
          });
        }
        
        // Check if they have self-update permission
        const canUpdateSelf = await PermissionManager.hasPermission(userId, 'users.update_self');
        if (!canUpdateSelf) {
          return res.status(403).json({ 
            success: false, 
            message: 'Permission denied: Cannot update profile' 
          });
        }
      }

      // Additional check: Can this user manage the target user?
      const canManageTarget = await PermissionManager.canManageUser(userId, targetUserId);
      if (!canManageTarget && userId !== targetUserId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Permission denied: Cannot manage user with higher privileges' 
        });
      }

      // If all checks pass, proceed with update
      // ... your update logic here
      res.json({ success: true, message: 'User updated successfully' });

    } catch (error) {
      console.error('Error in updateUser:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  getUserDashboard: async (req, res) => {
    const userId = req.user.id;

    try {
      // Get user's permissions to customize dashboard
      const permissions = await PermissionManager.getUserPermissionsByModule(userId);
      
      const dashboardData = {};

      // Show campaigns section only if user has campaign access
      if (permissions.campaigns && permissions.campaigns.length > 0) {
        dashboardData.campaigns = {
          hasAccess: true,
          canCreate: permissions.campaigns.some(p => p.permission_name === 'create'),
          canUpdate: permissions.campaigns.some(p => p.permission_name === 'update'),
          canDelete: permissions.campaigns.some(p => p.permission_name === 'delete')
        };
      }

      // Show users section only if user has user management access
      if (permissions.users && permissions.users.length > 0) {
        dashboardData.users = {
          hasAccess: true,
          canCreate: permissions.users.some(p => p.permission_name === 'create'),
          canViewStats: permissions.users.some(p => p.permission_name === 'view_stats')
        };
      }

      // Show reports section based on permissions
      if (permissions.reports && permissions.reports.length > 0) {
        dashboardData.reports = {
          hasAccess: true,
          canCreate: permissions.reports.some(p => p.permission_name === 'create'),
          canExport: permissions.reports.some(p => p.permission_name === 'export')
        };
      }

      res.json({ 
        success: true, 
        data: dashboardData,
        userPermissions: permissions 
      });

    } catch (error) {
      console.error('Error in getUserDashboard:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

// =============================================================================
// 4. CUSTOM MIDDLEWARE EXAMPLES
// =============================================================================

// Custom middleware for checking module access
const requireModuleAccess = (moduleName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const hasAccess = await PermissionManager.hasModuleAccess(userId, moduleName);
      if (!hasAccess) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied to ${moduleName} module` 
        });
      }

      next();
    } catch (error) {
      console.error('Module access check error:', error);
      res.status(500).json({ success: false, message: 'Access check failed' });
    }
  };
};

// Custom middleware for endpoint-specific permissions
const requireEndpointPermission = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const method = req.method;
    const endpoint = req.route?.path || req.path;

    const hasPermission = await PermissionManager.hasEndpointPermission(userId, method, endpoint);
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: `Permission denied for ${method} ${endpoint}` 
      });
    }

    next();
  } catch (error) {
    console.error('Endpoint permission check error:', error);
    res.status(500).json({ success: false, message: 'Permission check failed' });
  }
};

// =============================================================================
// 5. UTILITY FUNCTIONS FOR FRONTEND
// =============================================================================

// Utility function to get user permissions for frontend
const getUserPermissionsForFrontend = async (userId) => {
  try {
    const [permissions, roles] = await Promise.all([
      PermissionManager.getUserPermissionsByModule(userId),
      PermissionManager.getUserRoles(userId)
    ]);

    return {
      permissions,
      roles,
      // Helper flags for common checks
      isAdmin: roles.some(role => role.name === 'Super Admin' || role.name === 'Admin'),
      isManager: roles.some(role => role.name === 'Manager'),
      canManageUsers: permissions.users?.some(p => ['create', 'update', 'delete'].includes(p.permission_name)) || false,
      canManageCampaigns: permissions.campaigns?.some(p => ['create', 'update', 'delete'].includes(p.permission_name)) || false,
      canViewReports: permissions.reports?.some(p => p.permission_name === 'read') || false,
      canExportReports: permissions.reports?.some(p => p.permission_name === 'export') || false
    };
  } catch (error) {
    console.error('Error getting user permissions for frontend:', error);
    return {
      permissions: {},
      roles: [],
      isAdmin: false,
      isManager: false,
      canManageUsers: false,
      canManageCampaigns: false,
      canViewReports: false,
      canExportReports: false
    };
  }
};

// =============================================================================
// 6. CRON JOB FOR CLEANUP
// =============================================================================

// Example cron job to clean up expired roles (run daily)
const setupPermissionCleanup = () => {
  const cron = require('node-cron');
  
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Starting permission cleanup...');
      const cleanedUp = await PermissionManager.cleanupExpiredRoles();
      console.log(`Cleaned up ${cleanedUp} expired role assignments`);
    } catch (error) {
      console.error('Error during permission cleanup:', error);
    }
  });
};

// =============================================================================
// 7. INTEGRATION WITH EXISTING AUTH MIDDLEWARE
// =============================================================================

// Example of how to integrate with existing auth middleware
const enhancedAuth = async (req, res, next) => {
  try {
    // Your existing auth logic here
    // ... validate JWT token, etc.
    
    // Assuming you have user data available
    const userId = req.user?.id;
    
    if (userId) {
      // Attach user permissions to request for easy access
      req.userPermissions = await PermissionManager.getUserPermissionsByModule(userId);
      req.userRoles = await PermissionManager.getUserRoles(userId);
      
      // Helper functions attached to request
      req.hasPermission = (permissionKey) => PermissionManager.hasPermission(userId, permissionKey);
      req.hasModuleAccess = (moduleName) => PermissionManager.hasModuleAccess(userId, moduleName);
      req.canManageUser = (targetUserId) => PermissionManager.canManageUser(userId, targetUserId);
    }
    
    next();
  } catch (error) {
    console.error('Enhanced auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Authentication check failed' });
  }
};

// =============================================================================
// EXPORT ALL EXAMPLES
// =============================================================================

module.exports = {
  campaignRoutes,
  userManagementRoutes,
  advancedUserController,
  requireModuleAccess,
  requireEndpointPermission,
  getUserPermissionsForFrontend,
  setupPermissionCleanup,
  enhancedAuth
};

// =============================================================================
// USAGE INSTRUCTIONS
// =============================================================================

/*
To use these examples in your application:

1. Import the PermissionManager in your route files:
   const PermissionManager = require('../utils/PermissionManager');

2. Use middleware for simple permission checks:
   router.post('/campaigns', PermissionManager.requirePermission('campaigns.create'), controllerMethod);

3. Use manual checks for complex logic:
   const hasPermission = await PermissionManager.hasPermission(userId, 'campaigns.update');

4. Get user permissions for frontend:
   const userPerms = await getUserPermissionsForFrontend(userId);
   res.json({ permissions: userPerms });

5. Setup cleanup job:
   setupPermissionCleanup();

6. Use enhanced auth middleware:
   app.use(enhancedAuth);
   
Remember to:
- Run the database schema first: `mysql -u username -p database < database_roles_permissions.sql`
- Update your existing routes to use the new permission system
- Test all permission combinations thoroughly
- Create appropriate roles and assign them to users
*/
