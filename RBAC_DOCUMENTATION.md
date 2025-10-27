# Enhanced Role-Based Access Control (RBAC) System

## Overview

Your role management system now provides comprehensive module-specific permission checking with enhanced error messages and multiple ways to validate user access. When a user tries to perform an action they don't have permission for, they'll receive clear, helpful error messages that tell them exactly what they can do instead.

## Key Features

✅ **Module-specific permissions** (e.g., `campaigns_read`, `campaigns_create`, `brands_update`)  
✅ **Clear error messages** showing available actions when access is denied  
✅ **Multiple permission checking methods** (middleware, controller-based, utility functions)  
✅ **Support for complex permission scenarios** (ALL, ANY, ownership-based)  
✅ **Backwards compatibility** with existing permission formats  
✅ **Comprehensive testing routes** for validation

## How It Works

### Basic Permission Structure

Permissions follow the pattern: `{module}_{action}` or `{module}.{action}`

**Examples:**
- `campaigns_read` or `campaigns.read`
- `users_create` or `users.create`  
- `brands_update` or `brands.update`
- `reports_delete` or `reports.delete`

### Error Messages

When a user lacks permission, they receive helpful feedback:

```json
{
  "success": false,
  "message": "Access denied. You don't have permission to delete campaigns. You can only: read, update.",
  "code": "INSUFFICIENT_PERMISSIONS",
  "details": {
    "userRole": "Manager",
    "requiredPermission": "campaigns_delete",
    "action": "delete",
    "module": "campaigns",
    "availableActions": ["read", "update"],
    "suggestion": "Try using one of these actions: read, update"
  }
}
```

## Usage Methods

### 1. Middleware-Based Permission Checking

#### Basic Module Permission
```javascript
const { checkModulePermission } = require('../middleware/rbacMiddleware');

// Single permission check
router.get('/campaigns', checkModulePermission('campaigns', 'read'), (req, res) => {
  // User has campaigns read permission
  res.json({ campaigns: [...] });
});

router.post('/campaigns', checkModulePermission('campaigns', 'create'), (req, res) => {
  // User has campaigns create permission
});

router.put('/campaigns/:id', checkModulePermission('campaigns', 'update'), (req, res) => {
  // User has campaigns update permission
});

router.delete('/campaigns/:id', checkModulePermission('campaigns', 'delete'), (req, res) => {
  // User has campaigns delete permission
});
```

#### Pre-built Module Permissions
```javascript
const { modulePermissions } = require('../middleware/rbacMiddleware');

// Using pre-built permission middleware
router.get('/users', modulePermissions.users.read, (req, res) => {
  // User has users read permission
});

router.post('/users', modulePermissions.users.create, (req, res) => {
  // User has users create permission
});
```

#### Advanced Permission Checks
```javascript
const { requireAllPermissions, requireAnyPermissions } = require('../middleware/rbacMiddleware');

// User must have ALL these permissions
router.get('/admin/reports', requireAllPermissions([
  { module: 'reports', action: 'read' },
  { module: 'analytics', action: 'read' }
]), (req, res) => {
  // User has both reports.read AND analytics.read
});

// User must have ANY of these permissions
router.get('/content', requireAnyPermissions([
  { module: 'campaigns', action: 'read' },
  { module: 'ads', action: 'read' }
]), (req, res) => {
  // User has either campaigns.read OR ads.read (or both)
});
```

### 2. Controller-Based Permission Checking

```javascript
const { requirePermissionInController } = require('../utils/permissionUtils');

const campaignController = {
  async getCampaigns(req, res) {
    // Check permission inside controller
    const hasPermission = await requirePermissionInController(req, res, 'campaigns', 'read');
    if (!hasPermission) {
      return; // Error response already sent
    }

    // Additional business logic
    if (req.currentPermission.roleLevel < 5) {
      return res.status(403).json({
        success: false,
        message: 'This action requires manager-level access or higher.',
        details: {
          requiredLevel: 5,
          currentLevel: req.currentPermission.roleLevel
        }
      });
    }

    // Permission granted - proceed with logic
    const campaigns = await Campaign.findAll();
    res.json({ success: true, data: campaigns });
  }
};
```

### 3. Dynamic Permission Checking

```javascript
const { checkDynamicPermission } = require('../middleware/rbacMiddleware');

// Permission based on route parameters
router.put('/manage/:module/:id', checkDynamicPermission(
  (req) => req.params.module,  // module from URL
  (req) => 'update'            // always check update permission
), (req, res) => {
  // Permission checked dynamically based on URL
  // /manage/campaigns/123 checks campaigns_update
  // /manage/users/456 checks users_update
});

// Permission based on request body
router.post('/bulk-operation', checkDynamicPermission(
  (req) => req.body.targetModule,
  (req) => req.body.operation
), (req, res) => {
  // Permission based on request data
});
```

### 4. Ownership-Based Permission Checking

```javascript
const { checkPermissionWithOwnership } = require('../middleware/rbacMiddleware');

// Check permission AND ownership
router.put('/campaigns/:id', checkPermissionWithOwnership(
  'campaigns', 
  'update',
  async (req) => {
    // Custom ownership check function
    const campaign = await Campaign.findById(req.params.id);
    return campaign && campaign.created_by === req.user.id;
  }
), (req, res) => {
  // User has permission AND owns the resource
});
```

## Permission Utility Functions

### Check Single Permission
```javascript
const { checkUserPermission } = require('../utils/permissionUtils');

const permissionResult = await checkUserPermission(
  userId, 
  roleId, 
  'campaigns', 
  'delete'
);

if (permissionResult.hasPermission) {
  console.log('User can delete campaigns');
} else {
  console.log('Available actions:', permissionResult.availableActions);
}
```

### Get All User Permissions
```javascript
const { getUserPermissionsByModule } = require('../utils/permissionUtils');

const userPermissions = await getUserPermissionsByModule(roleId);

console.log('Modules user can access:', userPermissions.moduleList);
console.log('All permissions:', userPermissions.allPermissions);
console.log('By module:', userPermissions.byModule);
```

## Testing Your Permissions

The system includes comprehensive test routes at `/api/test/*`:

### Test Individual Permissions
```bash
# Test campaign read permission
GET /api/test/campaigns
Authorization: Bearer <your-token>

# Test campaign create permission  
POST /api/test/campaigns
Authorization: Bearer <your-token>

# Test campaign delete permission (will show error if not allowed)
DELETE /api/test/campaigns/123
Authorization: Bearer <your-token>
```

### View Your Permissions
```bash
# See all your current permissions
GET /api/test/my-permissions
Authorization: Bearer <your-token>
```

### Test All Permissions for a Module
```bash
# Test all actions (read, create, update, delete) for campaigns module
GET /api/test/permissions/campaigns
Authorization: Bearer <your-token>

# Test all actions for users module
GET /api/test/permissions/users
Authorization: Bearer <your-token>
```

## Example Permission Scenarios

### Scenario 1: User with Limited Permissions

**User Role:** Viewer  
**Permissions:** `campaigns_read`, `reports_read`

**Trying to delete a campaign:**
```bash
DELETE /api/campaigns/123
```

**Response:**
```json
{
  "success": false,
  "message": "Access denied. You don't have permission to delete campaigns. You can only: read.",
  "code": "INSUFFICIENT_PERMISSIONS",
  "details": {
    "userRole": "Viewer",
    "requiredPermission": "campaigns_delete",
    "action": "delete",
    "module": "campaigns",
    "availableActions": ["read"],
    "suggestion": "Try using one of these actions: read"
  }
}
```

### Scenario 2: User with Full Module Access

**User Role:** Campaign Manager  
**Permissions:** `campaigns_read`, `campaigns_create`, `campaigns_update`, `campaigns_delete`

**Trying to delete a campaign:**
```bash
DELETE /api/campaigns/123
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Access granted! You have permission to delete campaigns.",
  "data": {
    "deleted": {
      "id": "123",
      "deleted_by": 5,
      "deleted_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Database Setup

Make sure your database has the proper permissions structure. You can use the provided SQL schema in `database_roles_permissions_fixed.sql`.

### Adding Permissions for New Modules

```sql
-- Add module
INSERT INTO modules (module_name, module_path, description) 
VALUES ('brands', '/api/brands', 'Brand management');

-- Add permissions for the module
INSERT INTO permissions (module_id, permission_name, permission_key, description) 
SELECT m.id, 'read', 'brands.read', 'View brands'
FROM modules m WHERE m.module_name = 'brands';

INSERT INTO permissions (module_id, permission_name, permission_key, description) 
SELECT m.id, 'create', 'brands.create', 'Create brands'
FROM modules m WHERE m.module_name = 'brands';

INSERT INTO permissions (module_id, permission_name, permission_key, description) 
SELECT m.id, 'update', 'brands.update', 'Update brands'
FROM modules m WHERE m.module_name = 'brands';

INSERT INTO permissions (module_id, permission_name, permission_key, description) 
SELECT m.id, 'delete', 'brands.delete', 'Delete brands'
FROM modules m WHERE m.module_name = 'brands';

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin' AND p.permission_key LIKE 'brands.%';
```

## Best Practices

### 1. Use Middleware for Route Protection
```javascript
// ✅ Good: Clear and declarative
router.delete('/campaigns/:id', checkModulePermission('campaigns', 'delete'), controller.deleteCampaign);

// ❌ Avoid: Permission checks scattered in controller logic
```

### 2. Provide Clear Error Messages
The system automatically provides clear error messages, but you can add context:

```javascript
// ✅ Good: Additional context for business rules
if (req.currentPermission.roleLevel < 5) {
  return res.status(403).json({
    success: false,
    message: 'This advanced feature requires manager-level access.',
    details: {
      requiredLevel: 5,
      currentLevel: req.currentPermission.roleLevel,
      suggestion: 'Contact your administrator for role upgrade'
    }
  });
}
```

### 3. Test Different Permission Scenarios
Use the test routes to validate your permission setup:

```bash
# Test as different user roles
curl -H "Authorization: Bearer <manager-token>" /api/test/permissions/campaigns
curl -H "Authorization: Bearer <viewer-token>" /api/test/permissions/campaigns
```

## Migration from Old System

If you have existing routes using the old role-checking system:

### Before (Old System)
```javascript
const requireAdminRole = (req, res, next) => {
  if (req.user.role_id !== 1) {
    return res.status(403).json({ message: 'Admin required' });
  }
  next();
};

router.delete('/brands/:id', requireAdminRole, controller.deleteBrand);
```

### After (New System)
```javascript
const { checkModulePermission } = require('../middleware/rbacMiddleware');

router.delete('/brands/:id', checkModulePermission('brands', 'delete'), controller.deleteBrand);
```

## Error Codes Reference

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | User not authenticated |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permission but has other permissions for the module |
| `MISSING_MULTIPLE_PERMISSIONS` | User missing multiple required permissions |
| `INSUFFICIENT_ANY_PERMISSIONS` | User doesn't have any of the required permissions |
| `RESOURCE_OWNERSHIP_REQUIRED` | User has permission but doesn't own the resource |
| `PERMISSION_CHECK_ERROR` | System error during permission validation |

## Summary

Your enhanced RBAC system now provides:

1. **Clear Permission Feedback**: Users know exactly what they can and cannot do
2. **Flexible Implementation**: Multiple ways to check permissions based on your needs
3. **Better User Experience**: Helpful error messages instead of generic "access denied"
4. **Easy Testing**: Comprehensive test routes to validate your setup
5. **Future-Proof**: Supports complex permission scenarios as your app grows

The system works exactly as you requested - users with limited permissions get clear messages about what they can do, making it much easier for them to understand their access level and use the system effectively.
