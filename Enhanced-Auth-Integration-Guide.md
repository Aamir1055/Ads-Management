# Enhanced Authentication & Permissions System Integration Guide

## Overview

You now have a comprehensive authentication and permissions system that integrates seamlessly with your existing Ads Reporting Software. This guide will help you implement and use the new system.

## 🎯 What's Been Built

### 1. Enhanced Authentication Middleware (`middleware/enhancedAuth.js`)
- JWT token validation with 2FA support
- Permission-based route protection
- Role-based authorization
- User hierarchy management
- Rate limiting based on user roles
- Audit logging capabilities
- Request size validation

### 2. Secured User Routes (`routes/securedUserRoutes.js`)
- Permission-controlled user management
- Self-service capabilities for users
- Hierarchical user management
- Fine-grained permission checks

### 3. Comprehensive Testing (`test-enhanced-permissions.js`)
- API endpoint validation
- Middleware functionality testing
- Permission scenario testing
- Rate limiting validation

## 🚀 Quick Start Integration

### Step 1: Update Your Main App.js

Replace your existing user routes with the secured version:

```javascript
// OLD - Remove this line:
// app.use('/api/users', require('./routes/userRoutes'));

// NEW - Add this line:
app.use('/api/users', require('./routes/securedUserRoutes'));
```

### Step 2: Apply Authentication to Other Routes

For any other controllers (campaigns, ads, etc.), add authentication:

```javascript
// Example for campaign routes
const { authenticate, requirePermission } = require('./middleware/enhancedAuth');

// Apply to all campaign routes
router.use(authenticate);

// Specific permission requirements
router.get('/', requirePermission('campaigns.view'), getAllCampaigns);
router.post('/', requirePermission('campaigns.create'), createCampaign);
router.put('/:id', requirePermission('campaigns.update'), updateCampaign);
router.delete('/:id', requirePermission('campaigns.delete'), deleteCampaign);
```

### Step 3: Update Your Auth Controller (if needed)

Ensure your JWT tokens include user ID and 2FA verification status:

```javascript
// In your auth controller
const token = jwt.sign(
  { 
    id: user.id, 
    username: user.username,
    twofa_verified: user.twofa_verified || false
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

## 🔧 Middleware Usage Examples

### Basic Route Protection

```javascript
const { authenticate, requirePermission, auditLogger } = require('./middleware/enhancedAuth');

// Require authentication only
router.get('/profile', authenticate, getProfile);

// Require specific permission
router.get('/admin/users', 
  authenticate, 
  requirePermission('users.view'), 
  auditLogger('View users'),
  getAllUsers
);
```

### Role-Based Protection

```javascript
const { requireRole, requireAdmin, requireSuperAdmin } = require('./middleware/enhancedAuth');

// Require specific role(s)
router.post('/admin/settings', requireRole(['Admin', 'Super Admin']), updateSettings);

// Shorthand for admin roles
router.delete('/admin/user/:id', requireAdmin, deleteUser);

// Super admin only
router.post('/admin/system/reset', requireSuperAdmin, resetSystem);
```

### User Management Protection

```javascript
const { requireUserManagement } = require('./middleware/enhancedAuth');

// Users can only manage lower-level users or themselves
router.put('/users/:id', 
  authenticate,
  requireUserManagement('id'), // Checks hierarchy
  updateUser
);
```

### Module-Based Access Control

```javascript
const { requireModuleAccess } = require('./middleware/enhancedAuth');

// Require access to specific module
router.get('/campaigns', 
  authenticate,
  requireModuleAccess('Campaigns'),
  getCampaigns
);
```

## 🔍 Available Permission Keys

Based on your permissions system, here are the main permission keys:

### User Management
- `users.view` - View user list
- `users.create` - Create new users
- `users.update` - Update user information
- `users.delete` - Delete users
- `users.manage_2fa` - Manage 2FA for users
- `users.change_role` - Change user roles
- `users.view_stats` - View user statistics

### Role & Permission Management
- `roles.view` - View available roles
- `roles.create` - Create new roles
- `roles.update` - Update roles
- `roles.delete` - Delete roles
- `permissions.assign` - Assign permissions to roles
- `permissions.revoke` - Revoke permissions from roles

### Campaign Management (extend as needed)
- `campaigns.view` - View campaigns
- `campaigns.create` - Create campaigns
- `campaigns.update` - Update campaigns
- `campaigns.delete` - Delete campaigns

## 🛡️ Security Features

### 1. JWT Token Security
- Automatic token validation
- 2FA verification check
- Token expiration handling
- Multiple token sources (header, cookie, query)

### 2. Rate Limiting
Role-based rate limiting:
- Super Admin/Admin: 1000 requests/minute
- Manager: 500 requests/minute
- Regular User: 100 requests/minute

### 3. Audit Logging
```javascript
// Automatic audit logging
router.post('/sensitive-action', 
  authenticate,
  auditLogger('Performed sensitive action'),
  sensitiveActionController
);

// Access audit info in controller
const controller = (req, res) => {
  console.log('Audit info:', req.auditLog);
  // ... controller logic
};
```

### 4. Request Validation
- Request size limits (1MB default)
- Parameter validation
- IP address tracking

## 🔧 Customization Options

### Custom Rate Limits
```javascript
const { roleBasedRateLimit } = require('./middleware/enhancedAuth');

// Apply different rate limits
router.use('/api/heavy-operation', roleBasedRateLimit({
  admin: { requests: 100, window: 60000 },
  user: { requests: 10, window: 60000 }
}));
```

### Custom Permission Checks
```javascript
// In your controller
const customPermissionCheck = async (req, res, next) => {
  const canAccess = await req.hasPermission('custom.permission');
  const hasRole = req.hasRole('Manager');
  
  if (!canAccess && !hasRole) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};
```

### Optional Authentication
```javascript
const { optionalAuthenticate } = require('./middleware/enhancedAuth');

// Route that works for both authenticated and anonymous users
router.get('/public-data', 
  optionalAuthenticate, // Attaches user if token provided
  (req, res) => {
    if (req.user) {
      // Provide enhanced data for authenticated users
    } else {
      // Provide basic data for anonymous users
    }
  }
);
```

## 🧪 Testing Your Implementation

### 1. Run the Test Suite
```bash
node test-enhanced-permissions.js
```

### 2. Test Authentication Flow
```bash
# Test without token (should get 401)
curl http://localhost:5000/api/users

# Test with valid token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/users
```

### 3. Test Permission Checks
```bash
# Test permission check API
curl -X POST http://localhost:5000/api/permissions/check \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "permission_key": "users.create"}'
```

## 🔧 Helper Functions Available in Controllers

When using the enhanced middleware, these functions are available in your route handlers:

```javascript
const userController = async (req, res) => {
  // User information
  console.log('Current user:', req.user);
  console.log('User roles:', req.userRoles);
  console.log('User permissions:', req.userPermissions);
  
  // Helper functions
  const canCreateUsers = await req.hasPermission('users.create');
  const isAdmin = req.hasRole('Admin');
  const canManageUser5 = await req.canManageUser(5);
  
  // Client information
  console.log('Client IP:', req.clientIp);
  console.log('User Agent:', req.userAgent);
  
  // Audit information (if auditLogger used)
  console.log('Audit log:', req.auditLog);
};
```

## 📊 Monitoring and Logging

### Development Logging
In development mode, the system logs:
- Authentication attempts
- Permission checks
- Audit actions
- Rate limiting events

### Production Considerations
For production:
1. Disable debug logging
2. Set up proper log aggregation
3. Configure audit log storage
4. Monitor rate limiting metrics
5. Set up alerts for security events

## 🚨 Migration from Old System

### 1. Backup Current Routes
```bash
cp routes/userRoutes.js routes/userRoutes.backup.js
```

### 2. Update Route Imports
```javascript
// Update your main app.js
app.use('/api/users', require('./routes/securedUserRoutes'));
```

### 3. Test Gradually
```javascript
// You can test both systems side by side:
app.use('/api/users-old', require('./routes/userRoutes')); // Old system
app.use('/api/users', require('./routes/securedUserRoutes')); // New system
```

### 4. Update Frontend Code
Update your frontend to:
- Handle 403 permission errors
- Use new permission-based UI controls
- Handle rate limiting responses
- Process new response headers

## 🔍 Troubleshooting

### Common Issues

1. **"Permission check failed" errors**
   - Verify PermissionManager is working
   - Check database connections
   - Ensure user has proper role assignments

2. **"Authentication required" on valid tokens**
   - Check JWT_SECRET environment variable
   - Verify token format and expiration
   - Check user is_active status

3. **Rate limiting too aggressive**
   - Adjust limits in roleBasedRateLimit function
   - Consider different limits for different endpoints

4. **Permission headers not appearing**
   - Ensure authenticate middleware runs before routes
   - Check if req.userPermissions is populated

### Debug Mode
Enable debug logging:
```javascript
// Add to your .env file
NODE_ENV=development

// Or set programmatically
process.env.NODE_ENV = 'development';
```

## 🎉 Next Steps

1. **Test the current implementation**
2. **Apply permissions to other controllers (campaigns, ads, etc.)**
3. **Update your frontend to handle the new permission system**
4. **Configure rate limits for your specific needs**
5. **Set up audit log storage**
6. **Add more granular permissions as needed**

The enhanced authentication system is now ready to secure your Ads Reporting Software with fine-grained permissions, role-based access control, and comprehensive audit logging!
