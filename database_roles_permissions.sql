-- =====================================================
-- ROLES AND PERMISSIONS SYSTEM DATABASE SCHEMA
-- =====================================================

USE ads_reporting;

-- =====================================================
-- 1. MODULES TABLE
-- Store all application modules that can have permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS modules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    module_name VARCHAR(100) NOT NULL UNIQUE,
    module_path VARCHAR(255) NULL,
    description TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_module_name (module_name),
    INDEX idx_module_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. UPDATED ROLES TABLE
-- Enhanced roles table with better structure
-- =====================================================
DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    level INT DEFAULT 1 COMMENT 'Role hierarchy level (1=lowest, 10=highest)',
    is_system_role TINYINT(1) DEFAULT 0 COMMENT '1 if system role (cannot be deleted)',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_role_name (name),
    INDEX idx_role_active (is_active),
    INDEX idx_role_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. PERMISSIONS TABLE
-- Store specific permissions for each module
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    module_id INT NOT NULL,
    permission_name VARCHAR(100) NOT NULL COMMENT 'e.g., create, read, update, delete, export, import',
    permission_key VARCHAR(150) NOT NULL UNIQUE COMMENT 'e.g., users.create, campaigns.update',
    description TEXT NULL,
    http_method ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE', '*') DEFAULT '*',
    api_endpoint VARCHAR(255) NULL COMMENT 'Specific API endpoint if applicable',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX idx_permission_module (module_id),
    INDEX idx_permission_key (permission_key),
    INDEX idx_permission_active (is_active),
    INDEX idx_permission_method (http_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. ROLE_PERMISSIONS TABLE
-- Many-to-many relationship between roles and permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted_by INT NULL COMMENT 'User ID who granted this permission',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    INDEX idx_role_permissions_role (role_id),
    INDEX idx_role_permissions_permission (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. USER_ROLES TABLE
-- Assign roles to users (users can have multiple roles)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_by INT NULL COMMENT 'User ID who assigned this role',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT 'Optional expiration date for temporary roles',
    is_active TINYINT(1) DEFAULT 1,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_user_role (user_id, role_id),
    INDEX idx_user_roles_user (user_id),
    INDEX idx_user_roles_role (role_id),
    INDEX idx_user_roles_active (is_active),
    INDEX idx_user_roles_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. PERMISSION_AUDIT_LOG TABLE
-- Track permission changes for auditing
-- =====================================================
CREATE TABLE IF NOT EXISTS permission_audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    role_id INT NULL,
    permission_id INT NULL,
    action ENUM('GRANT', 'REVOKE', 'ROLE_ASSIGN', 'ROLE_REVOKE') NOT NULL,
    details JSON NULL,
    performed_by INT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_role (role_id),
    INDEX idx_audit_permission (permission_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT BASIC MODULES DATA
-- =====================================================
INSERT IGNORE INTO modules (module_name, module_path, description) VALUES
('auth', '/api/auth', 'Authentication and authorization'),
('users', '/api/users', 'User management'),
('campaigns', '/api/campaigns', 'Campaign management'),
('ads', '/api/ads', 'Advertisement management'),
('reports', '/api/reports', 'Report generation and management'),
('cards', '/api/cards', 'Card management'),
('campaign-data', '/api/campaign-data', 'Campaign data management'),
('campaign-types', '/api/campaign-types', 'Campaign type management'),
('two-factor-auth', '/api/2fa', 'Two-factor authentication'),
('permissions', '/api/permissions', 'Roles and permissions management'),
('modules', '/api/modules', 'Module management'),
('dashboard', '/api/dashboard', 'Dashboard and analytics');

-- =====================================================
-- INSERT BASIC ROLES DATA
-- =====================================================
INSERT IGNORE INTO roles (name, description, level, is_system_role) VALUES
('Super Admin', 'Full system access with all permissions', 10, 1),
('Admin', 'Administrative access with most permissions', 8, 1),
('Manager', 'Management level access to campaigns and reports', 6, 1),
('Campaign Manager', 'Access to campaign and ad management', 5, 0),
('Analyst', 'Read-only access to reports and analytics', 3, 0),
('User', 'Basic user access', 1, 1),
('Viewer', 'View-only access to assigned modules', 1, 0);

-- =====================================================
-- INSERT DETAILED PERMISSIONS DATA
-- =====================================================

-- Auth module permissions
INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'login', 'auth.login', 'Login to system', 'POST', '/api/auth/login'
FROM modules m WHERE m.module_name = 'auth';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'logout', 'auth.logout', 'Logout from system', 'POST', '/api/auth/logout'
FROM modules m WHERE m.module_name = 'auth';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'validate', 'auth.validate', 'Validate credentials', 'POST', '/api/auth/validate-credentials'
FROM modules m WHERE m.module_name = 'auth';

-- User module permissions
INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'create', 'users.create', 'Create new users', 'POST', '/api/users'
FROM modules m WHERE m.module_name = 'users';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'read', 'users.read', 'View users', 'GET', '/api/users'
FROM modules m WHERE m.module_name = 'users';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'update', 'users.update', 'Update users', 'PUT', '/api/users/:id'
FROM modules m WHERE m.module_name = 'users';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'delete', 'users.delete', 'Delete users', 'DELETE', '/api/users/:id'
FROM modules m WHERE m.module_name = 'users';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'toggle_status', 'users.toggle_status', 'Toggle user status', 'PATCH', '/api/users/:id/toggle-status'
FROM modules m WHERE m.module_name = 'users';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'manage_2fa', 'users.manage_2fa', 'Manage 2FA for users', 'POST', '/api/users/:id/enable-2fa'
FROM modules m WHERE m.module_name = 'users';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'view_stats', 'users.view_stats', 'View user statistics', 'GET', '/api/users/stats'
FROM modules m WHERE m.module_name = 'users';

-- Campaign module permissions
INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'create', 'campaigns.create', 'Create campaigns', 'POST', '/api/campaigns'
FROM modules m WHERE m.module_name = 'campaigns';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'read', 'campaigns.read', 'View campaigns', 'GET', '/api/campaigns'
FROM modules m WHERE m.module_name = 'campaigns';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'update', 'campaigns.update', 'Update campaigns', 'PUT', '/api/campaigns/:id'
FROM modules m WHERE m.module_name = 'campaigns';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'delete', 'campaigns.delete', 'Delete campaigns', 'DELETE', '/api/campaigns/:id'
FROM modules m WHERE m.module_name = 'campaigns';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'toggle_status', 'campaigns.toggle_status', 'Toggle campaign status', 'PATCH', '/api/campaigns/:id/toggle-status'
FROM modules m WHERE m.module_name = 'campaigns';

-- Ads module permissions
INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'create', 'ads.create', 'Create ads', 'POST', '/api/ads'
FROM modules m WHERE m.module_name = 'ads';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'read', 'ads.read', 'View ads', 'GET', '/api/ads'
FROM modules m WHERE m.module_name = 'ads';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'update', 'ads.update', 'Update ads', 'PUT', '/api/ads/:id'
FROM modules m WHERE m.module_name = 'ads';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'delete', 'ads.delete', 'Delete ads', 'DELETE', '/api/ads/:id'
FROM modules m WHERE m.module_name = 'ads';

-- Reports module permissions
INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'create', 'reports.create', 'Generate reports', 'POST', '/api/reports'
FROM modules m WHERE m.module_name = 'reports';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'read', 'reports.read', 'View reports', 'GET', '/api/reports'
FROM modules m WHERE m.module_name = 'reports';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'export', 'reports.export', 'Export reports', 'GET', '/api/reports/:id/export'
FROM modules m WHERE m.module_name = 'reports';

-- Cards module permissions
INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'create', 'cards.create', 'Create cards', 'POST', '/api/cards'
FROM modules m WHERE m.module_name = 'cards';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'read', 'cards.read', 'View cards', 'GET', '/api/cards'
FROM modules m WHERE m.module_name = 'cards';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'update', 'cards.update', 'Update cards', 'PUT', '/api/cards/:id'
FROM modules m WHERE m.module_name = 'cards';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'delete', 'cards.delete', 'Delete cards', 'DELETE', '/api/cards/:id'
FROM modules m WHERE m.module_name = 'cards';

-- Permissions module permissions
INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'manage_roles', 'permissions.manage_roles', 'Manage roles', '*', '/api/permissions/roles'
FROM modules m WHERE m.module_name = 'permissions';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'manage_permissions', 'permissions.manage_permissions', 'Manage permissions', '*', '/api/permissions'
FROM modules m WHERE m.module_name = 'permissions';

INSERT IGNORE INTO permissions (module_id, permission_name, permission_key, description, http_method, api_endpoint) 
SELECT m.id, 'assign_roles', 'permissions.assign_roles', 'Assign roles to users', 'POST', '/api/permissions/assign-role'
FROM modules m WHERE m.module_name = 'permissions';

-- =====================================================
-- ASSIGN DEFAULT PERMISSIONS TO ROLES
-- =====================================================

-- Super Admin gets ALL permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Super Admin';

-- Admin gets most permissions (exclude some system-critical ones)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin' 
AND p.permission_key NOT LIKE '%.delete'
AND p.permission_key != 'permissions.manage_roles';

-- Manager gets campaign, ads, reports permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Manager'
AND (p.permission_key LIKE 'campaigns.%' 
     OR p.permission_key LIKE 'ads.%'
     OR p.permission_key LIKE 'reports.%'
     OR p.permission_key = 'users.read');

-- Campaign Manager gets campaign and ads permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Campaign Manager'
AND (p.permission_key LIKE 'campaigns.%' 
     OR p.permission_key LIKE 'ads.%');

-- Analyst gets read-only access to reports and campaigns
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Analyst'
AND (p.permission_key LIKE '%.read' 
     OR p.permission_key = 'reports.export');

-- Basic User gets minimal permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'User'
AND p.permission_key IN ('auth.login', 'auth.logout', 'campaigns.read', 'ads.read');

-- Viewer gets read-only permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Viewer'
AND p.permission_key LIKE '%.read';

-- =====================================================
-- CREATE USEFUL VIEWS FOR EASY QUERYING
-- =====================================================

-- View to see all user permissions
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    r.id as role_id,
    r.name as role_name,
    m.id as module_id,
    m.module_name,
    p.id as permission_id,
    p.permission_name,
    p.permission_key,
    p.http_method,
    p.api_endpoint
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
JOIN roles r ON ur.role_id = r.id AND r.is_active = 1
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id AND p.is_active = 1
JOIN modules m ON p.module_id = m.id AND m.is_active = 1;

-- View to see role permissions summary
CREATE OR REPLACE VIEW role_permissions_summary AS
SELECT 
    r.id as role_id,
    r.name as role_name,
    m.module_name,
    COUNT(p.id) as permission_count,
    GROUP_CONCAT(p.permission_name ORDER BY p.permission_name) as permissions
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id AND p.is_active = 1
JOIN modules m ON p.module_id = m.id AND m.is_active = 1
WHERE r.is_active = 1
GROUP BY r.id, r.name, m.id, m.module_name
ORDER BY r.level DESC, r.name, m.module_name;

-- =====================================================
-- CREATE STORED PROCEDURES FOR COMMON OPERATIONS
-- =====================================================

DELIMITER //

-- Procedure to check if user has specific permission
CREATE PROCEDURE CheckUserPermission(
    IN p_user_id INT,
    IN p_permission_key VARCHAR(150),
    OUT p_has_permission BOOLEAN
)
BEGIN
    DECLARE permission_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO permission_count
    FROM user_permissions_view
    WHERE user_id = p_user_id 
    AND permission_key = p_permission_key;
    
    SET p_has_permission = permission_count > 0;
END //

-- Procedure to get user's all permissions
CREATE PROCEDURE GetUserPermissions(
    IN p_user_id INT
)
BEGIN
    SELECT DISTINCT
        module_name,
        permission_key,
        permission_name,
        http_method,
        api_endpoint
    FROM user_permissions_view
    WHERE user_id = p_user_id
    ORDER BY module_name, permission_name;
END //

-- Procedure to assign role to user
CREATE PROCEDURE AssignRoleToUser(
    IN p_user_id INT,
    IN p_role_id INT,
    IN p_assigned_by INT
)
BEGIN
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (p_user_id, p_role_id, p_assigned_by)
    ON DUPLICATE KEY UPDATE 
        is_active = 1,
        assigned_by = p_assigned_by,
        assigned_at = CURRENT_TIMESTAMP;
        
    -- Log the action
    INSERT INTO permission_audit_log (user_id, role_id, action, performed_by)
    VALUES (p_user_id, p_role_id, 'ROLE_ASSIGN', p_assigned_by);
END //

DELIMITER ;

-- =====================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================
CREATE INDEX idx_user_permissions_composite ON user_roles (user_id, role_id, is_active);
CREATE INDEX idx_role_permissions_composite ON role_permissions (role_id, permission_id);
CREATE INDEX idx_permissions_composite ON permissions (module_id, permission_key, is_active);
