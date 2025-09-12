-- =====================================================
-- Database Schema Updates for 2FA Support
-- =====================================================

-- Update users table to include 2FA columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(32) NULL,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT NULL COMMENT 'JSON array of backup codes',
ADD COLUMN IF NOT EXISTS two_factor_last_used TIMESTAMP NULL;

-- Add index for 2FA enabled users
CREATE INDEX IF NOT EXISTS idx_users_2fa ON users(is_2fa_enabled);

-- Update roles table to use 'name' instead of 'role_name' (to match our backend code)
ALTER TABLE roles 
CHANGE COLUMN role_name name VARCHAR(100) NOT NULL UNIQUE;

-- Insert default roles if they don't exist
INSERT IGNORE INTO roles (id, name, description, is_active) VALUES 
(1, 'Admin', 'System Administrator with full access', TRUE),
(2, 'Manager', 'Manager with limited administrative access', TRUE),
(3, 'User', 'Standard user with basic access', TRUE);

-- Insert a default admin user (password: 'admin123' - hashed with bcrypt)
INSERT IGNORE INTO users (id, username, hashed_password, role_id, is_active, is_2fa_enabled) VALUES 
(1, 'admin', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8ZqE5DqLP1PpYJ1VVNvhWqNl3BfKjS', 1, TRUE, FALSE);
