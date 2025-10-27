-- Migration: add created_by column to account table and optional foreign key
ALTER TABLE `account`
  ADD COLUMN `created_by` int(11) DEFAULT NULL,
  ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Optional: add foreign key to users table if you have a users table
-- ALTER TABLE `account`
--   ADD CONSTRAINT `fk_account_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL;
