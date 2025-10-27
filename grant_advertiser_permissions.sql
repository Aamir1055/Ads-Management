-- Grant all permissions to Advertiser role (ID 26)

-- Get the role ID
SET @advertiser_role_id = 26;

-- Insert all active permissions for the Advertiser role
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT @advertiser_role_id, p.id, NOW(), NOW()
FROM permissions p
WHERE p.is_active = 1;

-- Verify the permissions were added
SELECT 'Advertiser Role Permissions Count:' as Info;
SELECT COUNT(*) as total_permissions
FROM role_permissions
WHERE role_id = @advertiser_role_id;

SELECT 'Advertiser Permissions by Category:' as Info;
SELECT p.category, COUNT(*) as count
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = @advertiser_role_id AND p.is_active = 1
GROUP BY p.category
ORDER BY p.category;
