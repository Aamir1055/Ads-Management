# Roles and Permissions System Setup Guide

## Overview
This document provides setup instructions for the comprehensive Roles and Permissions system designed for your Ads Reporting Software.

## Database Schema Features

### 1. **Flexible Permission Management**
- **Module-based**: Permissions are organized by application modules (auth, users, campaigns, etc.)
- **API-specific**: Each permission maps to specific HTTP methods and API endpoints
- **Granular Control**: Individual permissions like create, read, update, delete, export, etc.

### 2. **Role Hierarchy**
- **System Roles**: Cannot be deleted (Super Admin, Admin, Manager, User)
- **Custom Roles**: Can be created and modified as needed
- **Role Levels**: Hierarchical system (1=lowest, 10=highest)

### 3. **User-Role Assignment**
- **Multiple Roles**: Users can have multiple roles
- **Temporary Roles**: Optional expiration dates for roles
- **Assignment Tracking**: Who assigned what and when

### 4. **Audit System**
- **Change Tracking**: All permission changes are logged
- **User Activity**: Track who performed what actions
- **IP and User Agent**: Security tracking

## Installation Steps

### Step 1: Run the Database Schema
```sql
-- Execute the database_roles_permissions.sql file
-- This will create all necessary tables, views, and stored procedures
mysql -u your_username -p ads_reporting < database_roles_permissions.sql
```

### Step 2: Verify Installation
```sql
-- Check if all tables were created
SHOW TABLES LIKE '%roles%';
SHOW TABLES LIKE '%permissions%';
SHOW TABLES LIKE '%modules%';

-- Verify sample data
SELECT COUNT(*) FROM modules;
SELECT COUNT(*) FROM roles;
SELECT COUNT(*) FROM permissions;
```

## Default Roles Created

| Role | Level | Description | Default Permissions |
|------|-------|-------------|-------------------|
| **Super Admin** | 10 | Full system access | ALL permissions |
| **Admin** | 8 | Administrative access | Most permissions (no delete, no role management) |
| **Manager** | 6 | Campaign management | campaigns.*, ads.*, reports.*, users.read |
| **Campaign Manager** | 5 | Campaign operations | campaigns.*, ads.* |
| **Analyst** | 3 | Read-only reports | *.read, reports.export |
| **User** | 1 | Basic user | auth.*, campaigns.read, ads.read |
| **Viewer** | 1 | View-only access | *.read |

## Default Modules and Permissions

### Available Modules:
- **auth**: Authentication operations
- **users**: User management
- **campaigns**: Campaign management
- **ads**: Advertisement management
- **reports**: Report generation and management
- **cards**: Card management
- **campaign-data**: Campaign data operations
- **campaign-types**: Campaign type management
- **two-factor-auth**: 2FA operations
- **permissions**: Role and permission management
- **modules**: Module management
- **dashboard**: Analytics and dashboard

### Permission Types:
- **create**: POST operations
- **read**: GET operations
- **update**: PUT/PATCH operations
- **delete**: DELETE operations
- **export**: Data export operations
- **manage_2fa**: 2FA management
- **toggle_status**: Status changes
- **view_stats**: Statistics viewing

## Useful Database Views

### 1. User Permissions View
```sql
SELECT * FROM user_permissions_view WHERE user_id = 1;
```

### 2. Role Permissions Summary
```sql
SELECT * FROM role_permissions_summary WHERE role_name = 'Manager';
```

## Stored Procedures

### 1. Check User Permission
```sql
CALL CheckUserPermission(1, 'campaigns.create', @has_permission);
SELECT @has_permission;
```

### 2. Get All User Permissions
```sql
CALL GetUserPermissions(1);
```

### 3. Assign Role to User
```sql
CALL AssignRoleToUser(user_id, role_id, assigned_by_user_id);
```

## Usage Examples

### 1. Create a Custom Role
```sql
INSERT INTO roles (name, description, level) 
VALUES ('Content Manager', 'Manages content and campaigns', 4);
```

### 2. Assign Permissions to Role
```sql
-- Get the role and permission IDs
SET @role_id = (SELECT id FROM roles WHERE name = 'Content Manager');
SET @perm_id = (SELECT id FROM permissions WHERE permission_key = 'campaigns.create');

-- Assign permission
INSERT INTO role_permissions (role_id, permission_id, granted_by) 
VALUES (@role_id, @perm_id, 1);
```

### 3. Assign Role to User
```sql
-- Direct assignment
INSERT INTO user_roles (user_id, role_id, assigned_by) 
VALUES (5, @role_id, 1);

-- Or use stored procedure
CALL AssignRoleToUser(5, @role_id, 1);
```

### 4. Check if User Has Permission
```sql
-- Method 1: Using stored procedure
CALL CheckUserPermission(5, 'campaigns.create', @result);
SELECT @result as has_permission;

-- Method 2: Direct query
SELECT COUNT(*) > 0 as has_permission
FROM user_permissions_view 
WHERE user_id = 5 AND permission_key = 'campaigns.create';
```

## Security Considerations

1. **Principle of Least Privilege**: Users should only have minimum required permissions
2. **Role Hierarchy**: Higher-level roles can manage lower-level roles
3. **System Roles**: Cannot be deleted to maintain system integrity
4. **Audit Trail**: All changes are logged for security compliance
5. **Temporary Access**: Use expiration dates for temporary permissions

## Next Steps

After running the database schema:

1. **Update Backend Controllers**: Modify existing controllers to use the new permission system
2. **Create Middleware**: Implement permission checking middleware
3. **Update Frontend**: Create admin interfaces for role and permission management
4. **Testing**: Test all permission combinations thoroughly
5. **Documentation**: Document all custom roles and permissions for your team

## Maintenance

### Regular Tasks:
- Review audit logs for security compliance
- Clean up expired role assignments
- Update permissions when adding new features
- Review and optimize role assignments

### Monitoring Queries:
```sql
-- Find users with multiple roles
SELECT user_id, COUNT(*) as role_count 
FROM user_roles 
WHERE is_active = 1 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Find unused permissions
SELECT p.* FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.permission_id IS NULL;

-- Recent permission changes
SELECT * FROM permission_audit_log 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;
```

This system provides a robust, scalable foundation for managing user permissions in your application!
