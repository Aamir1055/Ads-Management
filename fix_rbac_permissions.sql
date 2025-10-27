-- Fix RBAC Permissions and Enable Brand + Role Management Modules
-- This script addresses missing permissions, modules, and role assignments

-- 1. Create role_permissions junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `granted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `granted_by` int(11) DEFAULT NULL COMMENT 'User who granted this permission',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_id`, `permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_3` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add Brands module to modules table
INSERT IGNORE INTO `modules` (`id`, `name`, `display_name`, `description`, `icon`, `route`, `order_index`, `is_active`) VALUES
(10, 'brands', 'Brand Management', 'Manage brands and brand information', 'tag', '/brands', 10, 1);

-- 3. Add Brand permissions to permissions table
INSERT IGNORE INTO `permissions` (`name`, `display_name`, `description`, `category`, `is_active`, `module_id`) VALUES
('brands_create', 'Create Brands', 'Create new brand entries', 'brands', 1, 10),
('brands_read', 'View Brands', 'View brand information', 'brands', 1, 10),
('brands_update', 'Update Brands', 'Edit brand information', 'brands', 1, 10),
('brands_delete', 'Delete Brands', 'Delete brand entries', 'brands', 1, 10);

-- 4. Add Role Management permissions 
INSERT IGNORE INTO `permissions` (`name`, `display_name`, `description`, `category`, `is_active`, `module_id`) VALUES
('roles_create', 'Create Roles', 'Create new roles', 'roles', 1, 2),
('roles_read', 'View Roles', 'View roles and role information', 'roles', 1, 2),
('roles_update', 'Update Roles', 'Edit role information', 'roles', 1, 2),
('roles_delete', 'Delete Roles', 'Delete roles', 'roles', 1, 2),
('permissions_manage', 'Manage Permissions', 'Assign and revoke permissions to/from roles', 'roles', 1, 2);

-- 5. Create Super Admin role
INSERT IGNORE INTO `roles` (`id`, `name`, `display_name`, `description`, `level`, `is_active`, `is_system_role`) VALUES
(1, 'super_admin', 'Super Administrator', 'Full system access with all permissions', 10, 1, 1);

-- 6. Update admin user to use super_admin role correctly
UPDATE `users` SET 
  `role_name` = 'super_admin',
  `role_id` = 1
WHERE `id` = 35;

-- 7. Grant ALL permissions to Super Admin role (role_id = 1)
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`, `granted_by`)
SELECT 1, p.id, 35
FROM `permissions` p
WHERE p.is_active = 1;

-- 8. Grant basic permissions to Admin role (role_id = 2) 
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`, `granted_by`)
SELECT 2, p.id, 35
FROM `permissions` p
WHERE p.name IN (
  'users_read', 'users_create', 'users_update',
  'campaigns_read', 'campaigns_create', 'campaigns_update',
  'campaign_data_read', 'campaign_data_create', 'campaign_data_update',
  'campaign_types_read', 'campaign_types_create', 'campaign_types_update',
  'cards_read', 'cards_create', 'cards_update',
  'card_users_read', 'card_users_create', 'card_users_update',
  'reports_read', 'reports_create',
  'brands_read', 'brands_create', 'brands_update'
) AND p.is_active = 1;

-- 9. Update Aamir user to have proper admin permissions
UPDATE `users` SET 
  `role_name` = 'admin',
  `role_id` = 2
WHERE `id` = 54;

-- 10. Verify the setup with some diagnostic queries
SELECT 'Modules Count' as Type, COUNT(*) as Count FROM modules WHERE is_active = 1
UNION ALL
SELECT 'Permissions Count', COUNT(*) FROM permissions WHERE is_active = 1  
UNION ALL
SELECT 'Roles Count', COUNT(*) FROM roles WHERE is_active = 1
UNION ALL
SELECT 'Role Permissions Count', COUNT(*) FROM role_permissions;

-- Show super admin permissions
SELECT 'Super Admin Permissions' as Info, COUNT(*) as Count
FROM role_permissions rp
INNER JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'super_admin';

-- Show brands module and permissions
SELECT 'Brands Setup' as Info, 
  CONCAT('Module: ', m.display_name, ', Permissions: ', COUNT(p.id)) as Details
FROM modules m
LEFT JOIN permissions p ON m.id = p.module_id
WHERE m.name = 'brands'
GROUP BY m.id, m.display_name;

SELECT 'Setup completed successfully!' as Status;
