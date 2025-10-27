-- Clean Users Table Migration
-- This script consolidates 2FA fields and removes auth_token as requested
-- Run this carefully in your database

-- 1. First, let's see what we're working with
-- SELECT * FROM users LIMIT 1;

-- 2. Add indexes for better performance if they don't exist
ALTER TABLE `users` 
ADD INDEX `idx_username` (`username`),
ADD INDEX `idx_role_id` (`role_id`),
ADD INDEX `idx_is_active` (`is_active`),
ADD INDEX `idx_is_2fa_enabled` (`is_2fa_enabled`);

-- 3. Clean up the 2FA fields - consolidate into simpler structure
-- We'll keep: is_2fa_enabled, two_factor_secret, two_factor_backup_codes
-- Remove: auth_token, twofa_enabled, twofa_secret, twofa_verified_at

-- First, migrate data if needed (uncomment if you have existing data to preserve)
-- UPDATE users SET 
--   is_2fa_enabled = COALESCE(twofa_enabled, is_2fa_enabled, 0),
--   two_factor_secret = COALESCE(auth_token, twofa_secret, two_factor_secret)
-- WHERE (twofa_enabled = 1 OR is_2fa_enabled = 1) AND two_factor_secret IS NULL;

-- 4. Remove the redundant and unwanted columns
ALTER TABLE `users` 
DROP COLUMN IF EXISTS `auth_token`,
DROP COLUMN IF EXISTS `twofa_enabled`, 
DROP COLUMN IF EXISTS `twofa_secret`,
DROP COLUMN IF EXISTS `twofa_verified_at`;

-- 5. Ensure our remaining columns have proper constraints
ALTER TABLE `users`
MODIFY COLUMN `username` VARCHAR(100) NOT NULL,
MODIFY COLUMN `hashed_password` VARCHAR(255) NOT NULL,
MODIFY COLUMN `role_id` INT(11) NOT NULL,
MODIFY COLUMN `is_2fa_enabled` TINYINT(1) DEFAULT 0 NOT NULL,
MODIFY COLUMN `two_factor_secret` VARCHAR(32) DEFAULT NULL,
MODIFY COLUMN `two_factor_backup_codes` TEXT DEFAULT NULL,
MODIFY COLUMN `is_active` TINYINT(1) DEFAULT 1 NOT NULL,
MODIFY COLUMN `last_login` TIMESTAMP NULL DEFAULT NULL,
MODIFY COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
MODIFY COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP();

-- 6. Add foreign key constraint for roles if it doesn't exist
-- ALTER TABLE `users` 
-- ADD CONSTRAINT `fk_users_role_id` 
-- FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. Final structure verification
DESCRIBE users;

-- Expected final structure:
-- +-------------------------+---------------+------+-----+---------------------+-------------------+
-- | Field                   | Type          | Null | Key | Default             | Extra             |
-- +-------------------------+---------------+------+-----+---------------------+-------------------+
-- | id                      | int(11)       | NO   | PRI | NULL                | auto_increment    |
-- | username                | varchar(100)  | NO   | MUL | NULL                |                   |
-- | hashed_password         | varchar(255)  | NO   |     | NULL                |                   |
-- | role_id                 | int(11)       | NO   | MUL | NULL                |                   |
-- | is_active               | tinyint(1)    | NO   | MUL | 1                   |                   |
-- | last_login              | timestamp     | YES  |     | NULL                |                   |
-- | created_at              | timestamp     | NO   |     | CURRENT_TIMESTAMP   |                   |
-- | updated_at              | timestamp     | NO   |     | CURRENT_TIMESTAMP   | on update         |
-- | is_2fa_enabled          | tinyint(1)    | NO   | MUL | 0                   |                   |
-- | two_factor_secret       | varchar(32)   | YES  |     | NULL                |                   |
-- | two_factor_backup_codes | text          | YES  |     | NULL                |                   |
-- +-------------------------+---------------+------+-----+---------------------+-------------------+
