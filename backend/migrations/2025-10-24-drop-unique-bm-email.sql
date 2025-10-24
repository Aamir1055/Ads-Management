-- Migration: drop unique index on bm.email to allow multiple BMs with same email
-- Run this in your MySQL client against the application's database
-- 1) Verify current indexes:
--    SHOW INDEX FROM bm;
-- 2) If index 'unique_bm_email' exists, run:
--    ALTER TABLE bm DROP INDEX unique_bm_email;

-- Idempotent: attempt to drop index only if it exists
SET @idx_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bm'
    AND INDEX_NAME = 'unique_bm_email'
);

-- Prepare and execute drop if present
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE bm DROP INDEX unique_bm_email;', 'SELECT "unique_bm_email not present";');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
