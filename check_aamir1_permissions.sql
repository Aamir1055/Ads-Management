-- Check Aamir1's role and permissions

-- 1. Check user details
SELECT 'User Details:' as Info;
SELECT id, username, role_id, is_active 
FROM users 
WHERE username = 'Aamir1';

-- 2. Check role details  
SELECT 'Role Details:' as Info;
SELECT r.id, r.name, r.display_name, r.level, r.is_active
FROM roles r
JOIN users u ON r.id = u.role_id
WHERE u.username = 'Aamir1';

-- 3. Check role permissions
SELECT 'Role Permissions:' as Info;
SELECT p.id, p.name, p.display_name, p.category, p.is_active
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN users u ON rp.role_id = u.role_id
WHERE u.username = 'Aamir1'
ORDER BY p.category, p.name;

-- 4. Count permissions by category
SELECT 'Permission Count by Category:' as Info;
SELECT p.category, COUNT(*) as permission_count
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN users u ON rp.role_id = u.role_id
WHERE u.username = 'Aamir1' AND p.is_active = 1
GROUP BY p.category
ORDER BY p.category;
