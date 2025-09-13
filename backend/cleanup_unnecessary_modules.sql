-- Cleanup unnecessary modules and permissions
-- This script removes auth, dashboard, and test modules that are not needed

-- First, let's see what we're working with
SELECT 
    m.id, 
    m.module_name, 
    m.description,
    COUNT(p.id) as permission_count
FROM modules m 
LEFT JOIN permissions p ON m.id = p.module_id 
GROUP BY m.id, m.module_name, m.description
ORDER BY m.module_name;

-- Remove role permissions for these modules first
DELETE rp FROM role_permissions rp 
INNER JOIN permissions p ON rp.permission_id = p.id 
INNER JOIN modules m ON p.module_id = m.id 
WHERE m.module_name IN (
    'auth', 
    'dashboard', 
    'test_module_1757582394075',
    'test_module_1757582490860'
);

-- Remove permissions for these modules
DELETE p FROM permissions p 
INNER JOIN modules m ON p.module_id = m.id 
WHERE m.module_name IN (
    'auth', 
    'dashboard', 
    'test_module_1757582394075',
    'test_module_1757582490860'
);

-- Remove the modules themselves
DELETE FROM modules 
WHERE module_name IN (
    'auth', 
    'dashboard', 
    'test_module_1757582394075',
    'test_module_1757582490860'
);

-- Verify cleanup
SELECT 
    m.id, 
    m.module_name, 
    m.description,
    COUNT(p.id) as permission_count
FROM modules m 
LEFT JOIN permissions p ON m.id = p.module_id 
GROUP BY m.id, m.module_name, m.description
ORDER BY m.module_name;

-- Show what modules remain
SELECT 'Remaining modules:' as info;
SELECT id, module_name, description, is_active, created_at 
FROM modules 
WHERE is_active = 1 
ORDER BY module_name;
