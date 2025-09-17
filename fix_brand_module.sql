-- =====================================================
-- FIX BRAND MANAGEMENT MODULE PERMISSIONS ISSUE
-- This script adds the missing brand management module 
-- and ensures proper permissions are set up
-- =====================================================

USE `ads reporting`;

-- =====================================================
-- 1. INSERT MISSING BRAND MANAGEMENT MODULE
-- =====================================================
INSERT IGNORE INTO modules (id, module_name, module_path, description, is_active) VALUES
(10, 'brands', '/api/brands', 'Brand management and branding system', 1);

-- =====================================================
-- 2. VERIFY AND FIX BRAND PERMISSIONS
-- The permissions already exist (IDs 31-34) but let's make sure they're consistent
-- =====================================================

-- Update existing brand permissions to ensure they reference the correct module_id
UPDATE permissions SET 
    module_id = 10,
    category = 'brands',
    is_active = 1
WHERE id IN (31, 32, 33, 34) AND name LIKE 'brands_%';

-- Verify the brand permissions exist, if not create them
INSERT IGNORE INTO permissions (id, name, display_name, description, category, is_active, module_id) VALUES
(31, 'brands_create', 'Create Brands', 'Create new brand entries', 'brands', 1, 10),
(32, 'brands_read', 'View Brands', 'View brand information and details', 'brands', 1, 10),
(33, 'brands_update', 'Update Brands', 'Edit brand information and details', 'brands', 1, 10),
(34, 'brands_delete', 'Delete Brands', 'Delete brand entries', 'brands', 1, 10);

-- =====================================================
-- 3. ENSURE ADMIN ROLES HAVE BRAND PERMISSIONS
-- =====================================================

-- Get role IDs for admin roles
SET @super_admin_role_id = (SELECT id FROM roles WHERE name IN ('SuperAdmin', 'Super Admin', 'super_admin') LIMIT 1);
SET @admin_role_id = (SELECT id FROM roles WHERE name IN ('Admin', 'admin') LIMIT 1);

-- Grant all brand permissions to SuperAdmin if exists
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @super_admin_role_id, p.id
FROM permissions p 
WHERE p.name LIKE 'brands_%' AND p.is_active = 1 AND @super_admin_role_id IS NOT NULL;

-- Grant all brand permissions to Admin if exists  
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @admin_role_id, p.id
FROM permissions p 
WHERE p.name LIKE 'brands_%' AND p.is_active = 1 AND @admin_role_id IS NOT NULL;

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Check if brand module was inserted
SELECT 'Brand Module Check:' as status;
SELECT id, module_name, module_path, description, is_active 
FROM modules 
WHERE id = 10 OR module_name = 'brands';

-- Check brand permissions
SELECT 'Brand Permissions Check:' as status;
SELECT id, name, display_name, category, module_id, is_active 
FROM permissions 
WHERE module_id = 10 OR category = 'brands' OR name LIKE 'brands_%'
ORDER BY id;

-- Check role assignments for brand permissions
SELECT 'Brand Role Permissions Check:' as status;
SELECT 
    r.name as role_name,
    p.name as permission_name,
    p.display_name as permission_display_name,
    rp.id as role_permission_id
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name LIKE 'brands_%' OR p.category = 'brands'
ORDER BY r.name, p.name;

-- Show any users with admin roles who should have brand access
SELECT 'Users with Admin Roles:' as status;
SELECT 
    u.id,
    u.username,
    r.name as role_name,
    r.level,
    u.is_active as user_active
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE r.name IN ('SuperAdmin', 'Super Admin', 'super_admin', 'Admin', 'admin')
AND u.is_active = 1;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT '✅ Brand management module fix completed!' as message;
SELECT '🔑 All brand permissions should now be properly configured.' as message;
SELECT '👤 Admin and SuperAdmin roles should have access to brand management.' as message;
