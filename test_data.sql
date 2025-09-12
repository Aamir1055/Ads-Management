-- Test data for the integrated UserManagement system

-- Create roles if they don't exist
INSERT IGNORE INTO roles (id, name, description, is_active, created_at, updated_at) VALUES 
(1, 'Admin', 'Full system access with all permissions', 1, NOW(), NOW()),
(2, 'Manager', 'Management level access with most permissions', 1, NOW(), NOW()),
(3, 'User', 'Basic user access with limited permissions', 1, NOW(), NOW()),
(4, 'Viewer', 'Read-only access to view data', 1, NOW(), NOW());

-- Create a sample admin user (password is 'Password123!')
-- Note: This will fail if a user with username 'admin' already exists
INSERT IGNORE INTO users (
    id, username, hashed_password, role_id, 
    auth_token, twofa_enabled, is_2fa_enabled, 
    is_active, created_at, updated_at
) VALUES (
    1, 'admin', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.Nxl.oy', -- Password123!
    1, NULL, 0, 0, 1, NOW(), NOW()
);

-- Create a sample regular user (password is 'Password123!')
INSERT IGNORE INTO users (
    id, username, hashed_password, role_id, 
    auth_token, twofa_enabled, is_2fa_enabled, 
    is_active, created_at, updated_at
) VALUES (
    2, 'testuser', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.Nxl.oy', -- Password123!
    3, NULL, 0, 0, 1, NOW(), NOW()
);

-- Verify the data
SELECT 'Roles created:' as message;
SELECT id, name, description, is_active FROM roles;

SELECT 'Users created:' as message;
SELECT u.id, u.username, u.is_active, u.is_2fa_enabled, r.name as role_name 
FROM users u 
JOIN roles r ON u.role_id = r.id;
