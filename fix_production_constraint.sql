-- Fix BM and Ads Manager Relationship Issue on Production Server
-- Remove unique constraint that prevents multiple ads managers per business manager

USE ads_management;

-- Check current constraint
SELECT 'Checking existing constraint...' as STATUS;
SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'ads_managers' 
AND CONSTRAINT_NAME = 'unique_ads_manager_per_bm';

-- Remove the unique constraint
SELECT 'Removing unique constraint...' as STATUS;
ALTER TABLE ads_managers DROP INDEX unique_ads_manager_per_bm;

-- Verify constraint removed
SELECT 'Verifying constraint removal...' as STATUS;
SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'ads_managers' 
AND CONSTRAINT_NAME = 'unique_ads_manager_per_bm';

-- Show remaining indexes
SELECT 'Remaining indexes on ads_managers:' as STATUS;
SHOW INDEX FROM ads_managers;

SELECT 'SUCCESS: One Business Manager can now contain multiple Ads Managers!' as STATUS;