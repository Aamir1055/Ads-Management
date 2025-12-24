-- Fix missing tables and data for Ads Reporting Software

-- Verify role_permissions exist
SELECT COUNT(*) as role_permission_count FROM role_permissions;

-- Check if roles table has data
SELECT id, name FROM roles;

-- Check permissions table
SELECT COUNT(*) as permission_count FROM permissions;

-- Check modules table
SELECT COUNT(*) as module_count FROM modules;

-- If role_permissions is empty, we need to populate it
-- First, let's see what we have
SELECT 'Roles:' as info;
SELECT * FROM roles LIMIT 10;

SELECT 'Permissions:' as info;
SELECT * FROM permissions LIMIT 10;

SELECT 'Modules:' as info;
SELECT * FROM modules LIMIT 10;

SELECT 'Role Permissions:' as info;
SELECT * FROM role_permissions LIMIT 10;
