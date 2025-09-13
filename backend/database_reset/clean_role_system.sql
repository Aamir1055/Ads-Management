-- Complete Role Management System Reset Script
-- This will create a clean, simple role and permission system

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing role-related tables
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permission_audit_log;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS modules;
DROP VIEW IF EXISTS role_permissions_summary;
DROP VIEW IF EXISTS user_permissions_view;

-- Clean up users table role reference
ALTER TABLE users DROP FOREIGN KEY IF EXISTS users_ibfk_1;
ALTER TABLE users DROP COLUMN IF EXISTS role_id;

-- Recreate clean roles table
DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INT DEFAULT 1 COMMENT '1=lowest, 10=highest permission level',
    is_active BOOLEAN DEFAULT TRUE,
    is_system_role BOOLEAN DEFAULT FALSE COMMENT 'Cannot be deleted if true',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert basic system roles
INSERT INTO roles (name, display_name, description, level, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', 10, TRUE),
('admin', 'Administrator', 'Administrative access to most system functions', 8, TRUE),
('manager', 'Manager', 'Management access to assigned resources', 5, TRUE),
('user', 'User', 'Basic user access to own resources', 1, TRUE);

-- Create simplified permissions table
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Internal permission name',
    display_name VARCHAR(100) NOT NULL COMMENT 'Human readable name',
    description TEXT,
    category VARCHAR(50) DEFAULT 'general' COMMENT 'Group permissions by category',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert basic permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
-- User Management
('users_create', 'Create Users', 'Create new user accounts', 'users'),
('users_read', 'View Users', 'View user accounts and details', 'users'),
('users_update', 'Update Users', 'Edit user account details', 'users'),
('users_delete', 'Delete Users', 'Delete user accounts', 'users'),
('users_manage_roles', 'Manage User Roles', 'Assign/remove roles from users', 'users'),

-- Campaign Management
('campaigns_create', 'Create Campaigns', 'Create new campaigns', 'campaigns'),
('campaigns_read', 'View Campaigns', 'View campaign details', 'campaigns'),
('campaigns_update', 'Update Campaigns', 'Edit campaign details', 'campaigns'),
('campaigns_delete', 'Delete Campaigns', 'Delete campaigns', 'campaigns'),

-- Campaign Data Management
('campaign_data_create', 'Add Campaign Data', 'Add performance data to campaigns', 'campaign_data'),
('campaign_data_read', 'View Campaign Data', 'View campaign performance data', 'campaign_data'),
('campaign_data_update', 'Update Campaign Data', 'Edit campaign performance data', 'campaign_data'),
('campaign_data_delete', 'Delete Campaign Data', 'Delete campaign performance data', 'campaign_data'),

-- Reports
('reports_create', 'Generate Reports', 'Create and generate reports', 'reports'),
('reports_read', 'View Reports', 'View existing reports', 'reports'),
('reports_export', 'Export Reports', 'Export reports to various formats', 'reports'),

-- Cards Management
('cards_create', 'Create Cards', 'Add new payment cards', 'cards'),
('cards_read', 'View Cards', 'View payment card details', 'cards'),
('cards_update', 'Update Cards', 'Edit payment card details', 'cards'),
('cards_delete', 'Delete Cards', 'Delete payment cards', 'cards'),

-- System Administration
('system_settings', 'System Settings', 'Access system configuration', 'system'),
('role_management', 'Role Management', 'Create and manage roles and permissions', 'system');

-- Create role_permissions junction table
CREATE TABLE role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Admin gets most permissions except system settings
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions 
WHERE name NOT IN ('system_settings', 'role_management');

-- Manager gets read/update permissions for campaigns and reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions 
WHERE name IN ('campaigns_read', 'campaigns_update', 'campaign_data_create', 'campaign_data_read', 'campaign_data_update', 'reports_create', 'reports_read', 'reports_export', 'cards_read');

-- User gets basic read permissions and own data management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions 
WHERE name IN ('campaigns_read', 'campaign_data_read', 'reports_read', 'cards_read');

-- Add role_id back to users table with proper foreign key
ALTER TABLE users 
ADD COLUMN role_id INT DEFAULT 4,
ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE;

-- Update existing users to have appropriate roles
UPDATE users SET role_id = 1 WHERE username IN ('admin', 'aamir_test'); -- Super admins
UPDATE users SET role_id = 2 WHERE username IN ('aamir', 'ahmed', 'testuser2fa'); -- Admins
UPDATE users SET role_id = 3 WHERE username IN ('testadmin', 'saad', 'Imran'); -- Managers
-- All other users will have role_id = 4 (User) by default

-- Create audit table for tracking permission changes
CREATE TABLE permission_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL COMMENT 'ROLE_ASSIGNED, ROLE_REMOVED, PERMISSION_GRANTED, etc.',
    target_user_id INT COMMENT 'User affected by the action',
    role_id INT COMMENT 'Role involved in the action',
    permission_id INT COMMENT 'Permission involved in the action',
    details JSON COMMENT 'Additional action details',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create useful views
CREATE VIEW user_role_view AS
SELECT 
    u.id as user_id,
    u.username,
    u.is_active as user_active,
    r.id as role_id,
    r.name as role_name,
    r.display_name as role_display_name,
    r.level as role_level
FROM users u
JOIN roles r ON u.role_id = r.id;

CREATE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.username,
    r.name as role_name,
    p.name as permission_name,
    p.display_name as permission_display_name,
    p.category as permission_category,
    p.description as permission_description
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.is_active = 1 AND r.is_active = 1 AND p.is_active = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Display summary
SELECT 'Roles created:' as Info, COUNT(*) as Count FROM roles;
SELECT 'Permissions created:' as Info, COUNT(*) as Count FROM permissions;
SELECT 'Role-Permission assignments:' as Info, COUNT(*) as Count FROM role_permissions;
SELECT 'Users updated:' as Info, COUNT(*) as Count FROM users WHERE role_id IS NOT NULL;
