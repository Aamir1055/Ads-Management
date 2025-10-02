-- ============================================================================
-- MIGRATION: Sync reports table with campaign_data using triggers
-- ============================================================================
-- This migration creates triggers to automatically keep the reports table
-- in sync with campaign_data table (insert/update/delete operations)
-- and rebuilds existing reports data from campaign_data

-- Step 1: Drop existing triggers if they exist (cleanup)
DROP TRIGGER IF EXISTS campaign_data_insert_trigger;
DROP TRIGGER IF EXISTS campaign_data_update_trigger;
DROP TRIGGER IF EXISTS campaign_data_delete_trigger;

-- Step 2: Clear existing reports data to rebuild from scratch
TRUNCATE TABLE reports;

-- Step 3: Create AFTER INSERT trigger for campaign_data
DELIMITER //
CREATE TRIGGER campaign_data_insert_trigger
AFTER INSERT ON campaign_data
FOR EACH ROW
BEGIN
    INSERT INTO reports (
        report_date,
        report_month,
        campaign_id,
        campaign_name,
        campaign_type,
        brand,
        brand_name,
        leads,
        facebook_result,
        zoho_result,
        spent,
        created_by,
        created_at,
        updated_at
    )
    SELECT 
        NEW.data_date,
        DATE_FORMAT(NEW.data_date, '%Y-%m'),
        NEW.campaign_id,
        c.name,
        ct.type_name,
        c.brand,
        b.name,
        (NEW.facebook_result + NEW.xoho_result),
        NEW.facebook_result,
        NEW.xoho_result,
        NEW.spent,
        NEW.created_by,
        NOW(),
        NOW()
    FROM campaigns c
    LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
    LEFT JOIN brands b ON c.brand = b.id
    WHERE c.id = NEW.campaign_id;
END//
DELIMITER ;

-- Step 4: Create AFTER UPDATE trigger for campaign_data
DELIMITER //
CREATE TRIGGER campaign_data_update_trigger
AFTER UPDATE ON campaign_data
FOR EACH ROW
BEGIN
    UPDATE reports r
    SET 
        r.report_date = NEW.data_date,
        r.report_month = DATE_FORMAT(NEW.data_date, '%Y-%m'),
        r.campaign_id = NEW.campaign_id,
        r.campaign_name = (SELECT c.name FROM campaigns c WHERE c.id = NEW.campaign_id),
        r.campaign_type = (SELECT ct.type_name FROM campaigns c 
                          LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id 
                          WHERE c.id = NEW.campaign_id),
        r.brand = (SELECT c.brand FROM campaigns c WHERE c.id = NEW.campaign_id),
        r.brand_name = (SELECT b.name FROM campaigns c 
                       LEFT JOIN brands b ON c.brand = b.id 
                       WHERE c.id = NEW.campaign_id),
        r.leads = (NEW.facebook_result + NEW.xoho_result),
        r.facebook_result = NEW.facebook_result,
        r.zoho_result = NEW.xoho_result,
        r.spent = NEW.spent,
        r.updated_at = NOW()
    WHERE r.campaign_id = OLD.campaign_id 
      AND r.report_date = OLD.data_date;
END//
DELIMITER ;

-- Step 5: Create AFTER DELETE trigger for campaign_data
DELIMITER //
CREATE TRIGGER campaign_data_delete_trigger
AFTER DELETE ON campaign_data
FOR EACH ROW
BEGIN
    DELETE FROM reports 
    WHERE campaign_id = OLD.campaign_id 
      AND report_date = OLD.data_date;
END//
DELIMITER ;

-- Step 6: Rebuild reports table from existing campaign_data
INSERT INTO reports (
    report_date,
    report_month,
    campaign_id,
    campaign_name,
    campaign_type,
    brand,
    brand_name,
    leads,
    facebook_result,
    zoho_result,
    spent,
    created_by,
    created_at,
    updated_at
)
SELECT 
    cd.data_date,
    DATE_FORMAT(cd.data_date, '%Y-%m'),
    cd.campaign_id,
    COALESCE(c.name, 'Unknown Campaign'),
    COALESCE(ct.type_name, 'Unknown Type'),
    c.brand,
    COALESCE(b.name, 'Unknown Brand'),
    (cd.facebook_result + cd.xoho_result),
    cd.facebook_result,
    cd.xoho_result,
    cd.spent,
    cd.created_by,
    cd.created_at,
    cd.updated_at
FROM campaign_data cd
LEFT JOIN campaigns c ON cd.campaign_id = c.id
LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
LEFT JOIN brands b ON c.brand = b.id
ORDER BY cd.data_date DESC, cd.created_at DESC;

-- Step 7: Add index for better performance on reports table
CREATE INDEX IF NOT EXISTS idx_reports_campaign_date ON reports(campaign_id, report_date);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_brand ON reports(brand);

-- Step 8: Show summary of the migration
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_reports_created,
    MIN(report_date) as earliest_report_date,
    MAX(report_date) as latest_report_date
FROM reports;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The reports table is now automatically synchronized with campaign_data
-- All future INSERT/UPDATE/DELETE operations on campaign_data will
-- automatically reflect in the reports table via triggers
-- ============================================================================
