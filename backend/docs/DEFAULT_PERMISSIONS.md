# Default Permissions System

## Overview

The role management system now automatically includes **default permissions** from specific modules whenever a new role is created or permissions are assigned to a role. This ensures that all roles have access to essential functionality without manual intervention.

## Default Modules

The following modules are considered "default" and their permissions are automatically granted to **all roles**:

1. **`ads`** - Advertisement management permissions
2. **`modules`** - Module management permissions  
3. **`two-factor-auth`** - Two-factor authentication permissions

These modules are hidden from the role creation interface on the frontend but their permissions are granted by default.

## Automatic Permission Assignment

### When Creating a New Role

When creating a role using `POST /api/permissions/role`, the system:

1. Creates the role record in the database
2. Automatically retrieves all active permissions from the default modules
3. Assigns these permissions to the newly created role
4. Returns a response indicating how many default permissions were added

**Example Response:**
```json
{
  "success": true,
  "message": "Role created with 14 default permissions",
  "data": {
    "id": 24,
    "name": "New Role",
    "default_permissions_added": 14
  }
}
```

### When Assigning Permissions to a Role

When assigning permissions using `POST /api/permissions/role/assign`, the system:

1. Processes the explicitly requested permissions
2. Automatically includes all default module permissions
3. Combines both sets (removing duplicates)
4. Assigns the complete set to the role
5. Returns detailed counts of explicit vs default permissions

**Example Response:**
```json
{
  "success": true,
  "message": "Successfully assigned 17 permissions to role (3 explicit + 14 default)",
  "data": {
    "roleId": 25,
    "assignedPermissions": 17,
    "explicitPermissions": 3,
    "defaultPermissions": 14
  }
}
```

## Current Default Permissions

As of the latest update, the default modules include these permissions:

### ads module (5 permissions)
- `ads.create`
- `ads.read` 
- `ads.update`
- `ads.delete`
- `ads.stats`

### modules module (3 permissions)
- `modules.create`
- `modules.read`
- `modules.update`

### two-factor-auth module (6 permissions)
- `2fa.setup`
- `2fa.verify-setup`
- `2fa.verify-login`
- `2fa.disable`
- `2fa.status`
- `2fa.backup-codes`

**Total: 14 default permissions**

## Technical Implementation

### Key Functions

1. **`getDefaultModulePermissions()`** - Retrieves all permission IDs from default modules
2. **`assignDefaultPermissionsToRole(roleId, grantedBy)`** - Assigns default permissions to a specific role
3. **Modified `createRole()`** - Automatically includes default permissions during role creation
4. **Modified `assignPermissionsToRole()`** - Merges explicit and default permissions

### Configuration

The default modules are configured in the controller:

```javascript
const DEFAULT_MODULES = ['ads', 'modules', 'two-factor-auth'];
```

To modify which modules are considered "default", update this array in `permissionsController.js`.

### Database Impact

- Default permissions are stored in the `role_permissions` table like any other permission
- They are logged in the `permission_audit_log` for auditing purposes
- No special flags or markers are used - they are treated as regular permissions once assigned

## Benefits

1. **Consistency** - All roles automatically have access to essential functionality
2. **Reduced Manual Work** - No need to manually assign common permissions to every role
3. **Security** - Ensures important modules like 2FA are always accessible
4. **User Experience** - Cleaner role creation interface without cluttered essential permissions
5. **Maintainability** - Easy to modify default permissions by updating the module list

## Backward Compatibility

This feature is fully backward compatible:

- Existing roles are not affected until permissions are reassigned
- The previous script (`assign_default_permissions_to_roles.js`) can be used to update existing roles
- All existing API endpoints continue to work as before
- No database schema changes were required

## Future Enhancements

Potential improvements could include:

- Configuration-based default modules (instead of hard-coded)
- Role-specific default permissions (different defaults for different role types)
- UI indicators showing which permissions are defaults vs explicitly assigned
- Bulk operations to add/remove default permissions from existing roles
