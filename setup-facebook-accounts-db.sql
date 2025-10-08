-- Facebook Accounts Module Database Setup
-- Run this script to set up the complete Facebook accounts module in your database

USE ads_reporting;

-- Create Facebook Accounts table
CREATE TABLE IF NOT EXISTS facebook_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    authenticator TEXT NULL,
    phone_number VARCHAR(20) NULL,
    id_image_path VARCHAR(500) NULL,
    status ENUM('enabled', 'disabled') DEFAULT 'enabled',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_facebook_accounts_email (email),
    INDEX idx_facebook_accounts_status (status),
    INDEX idx_facebook_accounts_created_by (created_by)
);

-- Add permissions for Facebook Accounts module
INSERT IGNORE INTO permissions (name, display_name, category, description, is_active) VALUES 
('facebook_accounts_read', 'View Facebook Accounts', 'Facebook Accounts', 'Permission to view and list Facebook accounts', 1),
('facebook_accounts_create', 'Create Facebook Accounts', 'Facebook Accounts', 'Permission to create new Facebook accounts', 1),
('facebook_accounts_update', 'Update Facebook Accounts', 'Facebook Accounts', 'Permission to update existing Facebook accounts', 1),
('facebook_accounts_delete', 'Delete Facebook Accounts', 'Facebook Accounts', 'Permission to delete Facebook accounts', 1);

-- Assign permissions to admin role (assuming role_id = 1 is admin)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE name LIKE 'facebook_accounts_%';

-- Assign permissions to manager role (assuming role_id = 2 is manager) - except delete
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name IN ('facebook_accounts_read', 'facebook_accounts_create', 'facebook_accounts_update');

-- Add module entry if modules table exists
INSERT IGNORE INTO modules (name, display_name, description, route_path, icon, is_active, sort_order) VALUES 
('facebook_accounts', 'Facebook Accounts', 'Manage Facebook account credentials and status', '/facebook-accounts', 'facebook', 1, 8);

-- Create sample data (optional - comment out if not needed)
-- INSERT INTO facebook_accounts (email, password, phone_number, status, created_by) VALUES 
-- ('sample@facebook.com', '$2a$12$example.encrypted.password.hash', '+1234567890', 'enabled', 1),
-- ('test@facebook.com', '$2a$12$example.encrypted.password.hash', '+0987654321', 'disabled', 1);

-- Verify the setup
SELECT 'Facebook Accounts table created successfully' as status;
SELECT name, display_name FROM permissions WHERE name LIKE 'facebook_accounts_%';
SELECT COUNT(*) as facebook_accounts_count FROM facebook_accounts;

COMMIT;