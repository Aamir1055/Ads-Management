-- Migration: Add individual cost per lead columns to reports table
-- This adds computed columns for Facebook and Zoho cost per lead calculations

USE ads_reporting;

-- Add Facebook cost per lead computed column
ALTER TABLE reports ADD COLUMN facebook_cost_per_lead DECIMAL(10,2) 
GENERATED ALWAYS AS (
    CASE 
        WHEN facebook_result > 0 THEN spent / facebook_result 
        ELSE NULL 
    END
) STORED;

-- Add Zoho cost per lead computed column  
ALTER TABLE reports ADD COLUMN zoho_cost_per_lead DECIMAL(10,2)
GENERATED ALWAYS AS (
    CASE 
        WHEN zoho_result > 0 THEN spent / zoho_result 
        ELSE NULL 
    END
) STORED;

-- Add index for performance if needed
-- CREATE INDEX idx_reports_facebook_cost_per_lead ON reports(facebook_cost_per_lead);
-- CREATE INDEX idx_reports_zoho_cost_per_lead ON reports(zoho_cost_per_lead);

-- Verify the columns were added
DESCRIBE reports;
