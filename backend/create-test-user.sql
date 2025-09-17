-- Create test user for API testing
-- This script creates a simple test user with admin privileges

USE `ads reporting`;

-- First, check if roles exist, if not create them
INSERT IGNORE INTO roles (id, name, display_name, description, level, is_active, created_at, updated_at)
VALUES 
(1, 'admin', 'Administrator', 'Full access to all system features', 100, 1, NOW(), NOW()),
(2, 'user', 'User', 'Basic user access', 1, 1, NOW(), NOW());

-- Create a test admin user
-- Password: 'admin123' (will be hashed)
INSERT IGNORE INTO users (
  username, 
  email, 
  hashed_password, 
  role_id, 
  is_2fa_enabled, 
  is_active, 
  created_at, 
  updated_at
) VALUES (
  'admin',
  'admin@test.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of 'password'
  1,
  0,
  1,
  NOW(),
  NOW()
);

-- Also create campaign types if they don't exist for testing
INSERT IGNORE INTO campaign_types (id, type_name, description, is_active, created_at, updated_at)
VALUES 
(1, 'Search', 'Search advertising campaigns', 1, NOW(), NOW()),
(2, 'Display', 'Display advertising campaigns', 1, NOW(), NOW()),
(3, 'Social', 'Social media campaigns', 1, NOW(), NOW());

-- Show the created user
SELECT id, username, email, role_id, is_active FROM users WHERE username = 'admin';
