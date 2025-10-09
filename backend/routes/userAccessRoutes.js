const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/user-access/modules - Get which modules current user can access
router.get('/modules', async (req, res) => {
  try {
    if (!req.user || !req.user.id || !req.user.role || !req.user.role.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or invalid user data'
      });
    }

    const userId = req.user.id;
    const roleId = req.user.role.id;
    const roleName = req.user.role.name;

    console.log(`Checking access for user ${userId} with role ${roleName} (${roleId})`);
    console.log(`User has ${req.user.permissions.length} permissions loaded`);

    // Use permissions already loaded by middleware
    const moduleAccess = req.user.permissionsDetailed;
    console.log('Module access:', Object.keys(moduleAccess));

    // Define which frontend routes correspond to which backend modules
    const moduleRouteMap = {
      'users': '/user-management',
      'brands': '/brands',
      'campaign_types': '/campaign-types',
      'campaigns': '/campaigns',
      'campaign_data': '/campaign-data',
      'cards': '/cards',
      'card_users': '/card-users',
      'roles': '/role-management', // Fixed: was 'permissions', should be 'roles'
      'permissions': '/role-management', // Keep both for compatibility
      'facebook_accounts': '/facebook-accounts', // Add Facebook Accounts module
      'facebook_pages': '/facebook-pages',
      'reports': '/reports', // Add Reports module
      'settings': '/settings'
    };

    // Build allowed routes list
    const allowedRoutes = ['/dashboard']; // Dashboard is always allowed
    const allowedModules = Object.keys(moduleAccess);

    // Add routes based on module access
    allowedModules.forEach(module => {
      if (moduleRouteMap[module]) {
        allowedRoutes.push(moduleRouteMap[module]);
      }
    });

    console.log('Allowed modules:', allowedModules);
    console.log('Allowed routes:', allowedRoutes);

    res.json({
      success: true,
      message: 'User access retrieved successfully',
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          role_id: roleId
        },
        role: req.user.role,
        allowedModules: allowedModules,
        allowedRoutes: allowedRoutes,
        moduleAccess: moduleAccess,
        // Navigation items that should be shown
        navigation: [
          { name: 'Dashboard', href: '/dashboard', icon: 'Home', allowed: true },
          { name: 'User Management', href: '/user-management', icon: 'Users', allowed: allowedModules.includes('users') },
          { name: 'Role Management', href: '/role-management', icon: 'Key', allowed: allowedModules.includes('roles') || allowedModules.includes('permissions') },
          { name: 'Brand Management', href: '/brands', icon: 'Tags', allowed: allowedModules.includes('brands') },
          { name: 'Campaign Types', href: '/campaign-types', icon: 'Tags', allowed: allowedModules.includes('campaign_types') },
          { name: 'Campaigns', href: '/campaigns', icon: 'Target', allowed: allowedModules.includes('campaigns') },
          { name: 'Cards', href: '/cards', icon: 'CreditCard', allowed: allowedModules.includes('cards') },
          { name: 'Card Users', href: '/card-users', icon: 'UserCheck', allowed: allowedModules.includes('card_users') },
          { name: 'Facebook Accounts', href: '/facebook-accounts', icon: 'Facebook', allowed: allowedModules.includes('facebook_accounts') },
          { name: 'Facebook Pages', href: '/facebook-pages', icon: 'FileText', allowed: allowedModules.includes('facebook_pages') },
          { name: 'Reports', href: '/reports', icon: 'BarChart3', allowed: allowedModules.includes('reports') },
        ].filter(item => item.allowed) // Only return allowed navigation items
      }
    });

  } catch (error) {
    console.error('Error getting user access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user access information',
      error: error.message
    });
  }
});

module.exports = router;
