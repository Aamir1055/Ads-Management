-- Add Reports Module and Permissions
-- This script adds the Reports module to the navigation and permissions system

-- Insert the Reports module
INSERT INTO modules (name, display_name, description, icon, href, is_active, created_at, updated_at) 
VALUES ('Reports', 'Reports', 'Advertising campaign reports and analytics', 'BarChart3', '/reports', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    display_name = VALUES(display_name),
    description = VALUES(description),
    icon = VALUES(icon),
    href = VALUES(href),
    is_active = VALUES(is_active),
    updated_at = NOW();

-- Get the module ID for reports
SET @reports_module_id = (SELECT id FROM modules WHERE name = 'Reports' LIMIT 1);

-- Insert Reports permissions
INSERT INTO permissions (name, display_name, description, category, module_id, is_active, created_at, updated_at) VALUES
('reports.view', 'View Reports', 'View advertising campaign reports', 'Reports', @reports_module_id, 1, NOW(), NOW()),
('reports.create', 'Create Reports', 'Create new reports', 'Reports', @reports_module_id, 1, NOW(), NOW()),
('reports.generate', 'Generate Reports', 'Generate reports from campaign data', 'Reports', @reports_module_id, 1, NOW(), NOW()),
('reports.sync', 'Sync Reports', 'Sync reports to database', 'Reports', @reports_module_id, 1, NOW(), NOW()),
('reports.edit', 'Edit Reports', 'Edit existing reports', 'Reports', @reports_module_id, 1, NOW(), NOW()),
('reports.delete', 'Delete Reports', 'Delete reports', 'Reports', @reports_module_id, 1, NOW(), NOW()),
('reports.analytics', 'View Analytics', 'View report analytics and statistics', 'Reports', @reports_module_id, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    display_name = VALUES(display_name),
    description = VALUES(description),
    category = VALUES(category),
    module_id = VALUES(module_id),
    is_active = VALUES(is_active),
    updated_at = NOW();

-- Grant Reports permissions to Admin and Super Admin roles
-- Get role IDs
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);
SET @super_admin_role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1);

-- Grant all reports permissions to super_admin
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT @super_admin_role_id, p.id, NOW(), NOW()
FROM permissions p
WHERE p.category = 'Reports' AND @super_admin_role_id IS NOT NULL;

-- Grant all reports permissions to admin (if exists)
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT @admin_role_id, p.id, NOW(), NOW()
FROM permissions p
WHERE p.category = 'Reports' AND @admin_role_id IS NOT NULL;

-- Alternative: Grant to all existing roles (uncomment if needed)
-- INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
-- SELECT r.id, p.id, NOW(), NOW()
-- FROM roles r
-- CROSS JOIN permissions p
-- WHERE p.category = 'Reports' AND r.is_active = 1;

-- Show the results
SELECT 'Reports Module Added Successfully' as Status;
SELECT * FROM modules WHERE name = 'Reports';
SELECT * FROM permissions WHERE category = 'Reports';

-- Show role permissions for reports
SELECT 
    r.name as role_name,
    r.display_name as role_display_name,
    p.name as permission_name,
    p.display_name as permission_display_name
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.category = 'Reports'
ORDER BY r.name, p.name;