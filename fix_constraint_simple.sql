-- Simple fix for BM and Ads Manager relationship
-- Remove unique constraint that prevents multiple ads managers per business manager

USE ads_management;

-- Check if constraint exists by showing indexes
SELECT 'Current indexes on ads_managers table:' as STATUS;
SHOW INDEX FROM ads_managers WHERE Key_name = 'unique_ads_manager_per_bm';

-- Drop the unique constraint
SELECT 'Removing unique constraint...' as STATUS;
ALTER TABLE ads_managers DROP INDEX unique_ads_manager_per_bm;

-- Verify constraint removed
SELECT 'Verifying constraint removal...' as STATUS;
SHOW INDEX FROM ads_managers WHERE Key_name = 'unique_ads_manager_per_bm';

SELECT 'SUCCESS: One Business Manager can now contain multiple Ads Managers!' as STATUS;