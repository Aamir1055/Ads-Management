-- Add Cards/Accounts module and permissions to the system

-- Step 1: Insert the Cards module if it doesn't exist
INSERT IGNORE INTO modules (name, display_name, description, icon, is_active, created_at, updated_at) 
VALUES ('cards', 'Cards', 'Manage Facebook ad account cards', 'CreditCard', 1, NOW(), NOW());

-- Step 2: Insert permissions for the Cards module (simplified - no module_id)
INSERT IGNORE INTO permissions (name, display_name, description, category)
VALUES 
('cards.create', 'Create Cards', 'Create new cards/accounts', 'Cards'),
('cards.view', 'View Cards', 'View cards/accounts', 'Cards'),
('cards.edit', 'Edit Cards', 'Update cards/accounts', 'Cards'),
('cards.delete', 'Delete Cards', 'Delete cards/accounts', 'Cards');

-- Step 3: Grant all cards permissions to super_admin role
SET @super_admin_role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @super_admin_role_id, p.id
FROM permissions p
WHERE p.category = 'Cards' AND @super_admin_role_id IS NOT NULL;

-- Verify the insertions
SELECT 'Cards Module:' as Info;
SELECT * FROM modules WHERE name = 'cards';

SELECT 'Cards Permissions:' as Info;
SELECT * FROM permissions WHERE category = 'Cards';

SELECT 'Super Admin Cards Permissions:' as Info;
SELECT rp.*, p.name as permission_name FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE p.category = 'Cards' AND rp.role_id = @super_admin_role_id;
