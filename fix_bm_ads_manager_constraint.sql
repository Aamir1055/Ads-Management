-- Fix BM and Ads Manager Relationship Issue
-- Remove unique constraint that prevents multiple ads managers per business manager
-- This will allow one business manager to contain multiple ads managers

USE ads_management;

-- First, check if the constraint exists
SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'ads_managers' 
AND CONSTRAINT_NAME = 'unique_ads_manager_per_bm';

-- Drop the unique constraint that prevents multiple ads managers per BM
ALTER TABLE ads_managers DROP INDEX unique_ads_manager_per_bm;

-- Verify the constraint has been removed
SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'ads_managers' 
AND CONSTRAINT_NAME = 'unique_ads_manager_per_bm';

-- Show remaining indexes on ads_managers table
SHOW INDEX FROM ads_managers;

-- The table should now allow multiple ads managers with the same or different names under the same BM
-- This enables the one-to-many relationship: One BM -> Multiple Ads Managers

SELECT 'Unique constraint removed. One Business Manager can now contain multiple Ads Managers.' as STATUS;