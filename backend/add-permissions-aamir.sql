-- SQL to add more permissions for user Aamir (role ID 27)

-- Add campaign_types create/update permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) 
SELECT 27, id FROM permissions WHERE name IN ('campaign_types_create', 'campaign_types_update');

-- Add cards update permission  
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 27, id FROM permissions WHERE name = 'cards_update';

-- Add users update permission
INSERT IGNORE INTO role_permissions (role_id, permission_id) 
SELECT 27, id FROM permissions WHERE name = 'users_update';

-- Add reports update permission
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 27, id FROM permissions WHERE name = 'reports_update';

-- Verify what permissions Aamir now has
SELECT p.name, p.display_name, p.category 
FROM permissions p 
JOIN role_permissions rp ON p.id = rp.permission_id 
WHERE rp.role_id = 27 AND p.is_active = 1 
ORDER BY p.category, p.name;
