-- Migration: Enhanced User Management Table Structure
-- Created: 2025-09-09
-- Description: Modernize users table with additional fields and standardize 2FA

-- First, ensure we have the base 2FA fields from previous migration
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_token VARCHAR(255) NULL AFTER role_id,
ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE AFTER auth_token;

-- Add new enhanced fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE NULL AFTER username,
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) NULL AFTER email,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL AFTER display_name,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL AFTER phone,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP NULL AFTER email_verified_at,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) NULL AFTER is_2fa_enabled,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP NULL AFTER password_reset_token,
ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0 AFTER password_reset_expires,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL AFTER login_attempts,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC' AFTER locked_until;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_is_2fa_enabled ON users(is_2fa_enabled);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);

-- Ensure roles table has consistent naming
ALTER TABLE roles CHANGE COLUMN IF EXISTS name role_name VARCHAR(100) NOT NULL;

-- Update table comments
ALTER TABLE users COMMENT = 'Enhanced user accounts with 2FA, email verification, and security features';
ALTER TABLE roles COMMENT = 'User roles and permissions';

-- Create user audit log table for tracking changes
CREATE TABLE IF NOT EXISTS user_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    performed_by INT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_audit_user_id (user_id),
    INDEX idx_user_audit_action (action),
    INDEX idx_user_audit_performed_at (performed_at),
    INDEX idx_user_audit_performed_by (performed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles if they don't exist
INSERT IGNORE INTO roles (role_name, description) VALUES 
('Admin', 'Full system administrator with all permissions'),
('Manager', 'Manager with limited administrative permissions'),
('User', 'Regular user with basic permissions');

-- Insert default admin user if no users exist
INSERT IGNORE INTO users (username, email, display_name, hashed_password, role_id, is_active) 
SELECT 'admin', 'admin@localhost', 'System Administrator', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeKycLTdCpZJRmp0.', r.id, TRUE
FROM roles r 
WHERE r.role_name = 'Admin' 
AND NOT EXISTS (SELECT 1 FROM users LIMIT 1);
