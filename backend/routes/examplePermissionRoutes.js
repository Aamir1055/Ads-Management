const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkModulePermission, modulePermissions, requireAdmin, requireSuperAdmin } = require('../middleware/rbacMiddleware');
const { requirePermissionInController, getUserPermissionsByModule } = require('../utils/permissionUtils');

// Apply authentication middleware to all routes
router.use(protect);

console.log('📋 Example Permission Routes initialized - demonstrating comprehensive RBAC');

/**
 * EXAMPLE 1: Basic Module Permission Checking
 * 
 * These routes show how different users with different permissions
 * will get different responses when trying to access resources.
 */

// Example: User trying to view campaigns
router.get('/campaigns', checkModulePermission('campaigns', 'read'), (req, res) => {
  res.json({
    success: true,
    message: `✅ Access granted! You have permission to read campaigns.`,
    data: {
      campaigns: [
        { id: 1, name: 'Summer Campaign', status: 'active' },
        { id: 2, name: 'Winter Campaign', status: 'paused' }
      ]
    },
    userPermission: req.currentPermission
  });
});

// Example: User trying to create campaigns
router.post('/campaigns', checkModulePermission('campaigns', 'create'), (req, res) => {
  res.json({
    success: true,
    message: `✅ Access granted! You have permission to create campaigns.`,
    data: {
      created: {
        id: 3,
        name: req.body.name || 'New Campaign',
        status: 'draft',
        created_by: req.user.id
      }
    },
    userPermission: req.currentPermission
  });
});

// Example: User trying to update campaigns
router.put('/campaigns/:id', checkModulePermission('campaigns', 'update'), (req, res) => {
  res.json({
    success: true,
    message: `✅ Access granted! You have permission to update campaigns.`,
    data: {
      updated: {
        id: req.params.id,
        name: req.body.name || 'Updated Campaign',
        status: req.body.status || 'active',
        updated_by: req.user.id
      }
    },
    userPermission: req.currentPermission
  });
});

// Example: User trying to delete campaigns
router.delete('/campaigns/:id', checkModulePermission('campaigns', 'delete'), (req, res) => {
  res.json({
    success: true,
    message: `✅ Access granted! You have permission to delete campaigns.`,
    data: {
      deleted: {
        id: req.params.id,
        deleted_by: req.user.id,
        deleted_at: new Date().toISOString()
      }
    },
    userPermission: req.currentPermission
  });
});

/**
 * EXAMPLE 2: Using Pre-built Module Permissions
 * 
 * Shows how to use the pre-built modulePermissions object
 */

// Using pre-built module permissions for users
router.get('/users', modulePermissions.users.read, (req, res) => {
  res.json({
    success: true,
    message: `✅ You can view users!`,
    data: {
      users: [
        { id: 1, name: 'John Doe', role: 'Manager' },
        { id: 2, name: 'Jane Smith', role: 'User' }
      ]
    }
  });
});

router.post('/users', modulePermissions.users.create, (req, res) => {
  res.json({
    success: true,
    message: `✅ You can create users!`,
    data: { created: { id: 3, name: req.body.name || 'New User' } }
  });
});

/**
 * EXAMPLE 3: Permission Checking in Controllers
 * 
 * Shows how to check permissions inside controller functions
 * instead of using middleware
 */

router.get('/reports/advanced', async (req, res) => {
  // Check permission inside the route handler
  const hasPermission = await requirePermissionInController(req, res, 'reports', 'read');
  if (!hasPermission) {
    return; // Error response already sent by requirePermissionInController
  }

  // Additional business logic can go here
  if (req.currentPermission.roleLevel < 5) {
    return res.status(403).json({
      success: false,
      message: 'This advanced report requires manager-level access or higher.',
      code: 'INSUFFICIENT_ROLE_LEVEL',
      details: {
        requiredLevel: 5,
        currentLevel: req.currentPermission.roleLevel,
        suggestion: 'Contact your administrator for role upgrade'
      }
    });
  }

  res.json({
    success: true,
    message: 'Advanced report access granted!',
    data: {
      report_type: 'advanced_analytics',
      data: 'Sensitive report data here...'
    }
  });
});

/**
 * EXAMPLE 4: Role-based Access (Admin, SuperAdmin)
 */

// Admin-only route
router.get('/admin/dashboard', requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard access granted!',
    data: {
      admin_stats: {
        total_users: 150,
        active_campaigns: 45,
        monthly_revenue: 50000
      }
    }
  });
});

// SuperAdmin-only route
router.get('/superadmin/system', requireSuperAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'SuperAdmin system access granted!',
    data: {
      system_health: 'excellent',
      database_status: 'connected',
      server_uptime: '30 days'
    }
  });
});

/**
 * EXAMPLE 5: Get User's Current Permissions
 * 
 * This route shows what permissions the current user has
 */

router.get('/my-permissions', async (req, res) => {
  try {
    const permissions = await getUserPermissionsByModule(req.user.role_id);
    
    res.json({
      success: true,
      message: 'Your current permissions',
      data: {
        user: {
          id: req.user.id,
          role_id: req.user.role_id
        },
        permissions: permissions,
        summary: {
          totalModules: permissions.moduleList.length,
          totalPermissions: permissions.allPermissions.length,
          modules: permissions.moduleList
        }
      }
    });
  } catch (error) {
    console.error('Error getting user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve permissions',
      code: 'PERMISSION_RETRIEVAL_ERROR'
    });
  }
});

/**
 * EXAMPLE 6: Demonstration of Permission Denied Scenarios
 * 
 * These routes will show different error messages based on user permissions
 */

// Route that requires multiple actions - will show available actions if user doesn't have all
router.post('/campaigns/:id/publish', checkModulePermission('campaigns', 'update'), (req, res) => {
  // Additional check for publish permission (if you have such granular permissions)
  res.json({
    success: true,
    message: 'Campaign published successfully!',
    data: {
      campaign_id: req.params.id,
      status: 'published',
      published_by: req.user.id,
      published_at: new Date().toISOString()
    }
  });
});

// Route that demonstrates checking for any of multiple permissions
router.get('/content/manage', async (req, res) => {
  try {
    // Check if user has permission to manage either campaigns or ads
    const campaignCheck = await requirePermissionInController(req, res, 'campaigns', 'update');
    if (campaignCheck) {
      return res.json({
        success: true,
        message: 'Content management access granted via campaigns permission!',
        access_type: 'campaigns'
      });
    }

    // If campaigns didn't work, try ads
    const adsCheck = await requirePermissionInController(req, res, 'ads', 'update');
    if (adsCheck) {
      return res.json({
        success: true,
        message: 'Content management access granted via ads permission!',
        access_type: 'ads'
      });
    }

    // If we get here, neither permission check passed (they already sent error responses)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Permission check failed',
      code: 'PERMISSION_CHECK_ERROR'
    });
  }
});

/**
 * EXAMPLE 7: Testing Different Permission Scenarios
 * 
 * Routes specifically for testing how the system responds to different permission scenarios
 */

// Test route that shows what happens when a user tries each action
router.get('/test/permissions/:module', async (req, res) => {
  const module = req.params.module;
  const actions = ['read', 'create', 'update', 'delete'];
  const results = {};

  for (const action of actions) {
    try {
      const mockReq = { ...req };
      const mockRes = {
        status: () => mockRes,
        json: (data) => data
      };

      const hasPermission = await requirePermissionInController(mockReq, mockRes, module, action);
      results[action] = {
        hasPermission,
        permission: hasPermission ? mockReq.currentPermission : null
      };
    } catch (error) {
      results[action] = {
        hasPermission: false,
        error: error.message
      };
    }
  }

  res.json({
    success: true,
    message: `Permission test results for ${module} module`,
    data: {
      module: module,
      user: {
        id: req.user.id,
        role_id: req.user.role_id
      },
      results: results,
      summary: {
        allowedActions: Object.keys(results).filter(action => results[action].hasPermission),
        deniedActions: Object.keys(results).filter(action => !results[action].hasPermission)
      }
    }
  });
});

console.log('📋 Example Permission Routes configuration complete');
console.log('💡 Available test routes:');
console.log('   GET /test/campaigns - Test campaign read permission');
console.log('   POST /test/campaigns - Test campaign create permission');
console.log('   PUT /test/campaigns/:id - Test campaign update permission');
console.log('   DELETE /test/campaigns/:id - Test campaign delete permission');
console.log('   GET /test/my-permissions - View your current permissions');
console.log('   GET /test/permissions/:module - Test all permissions for a module');

module.exports = router;
