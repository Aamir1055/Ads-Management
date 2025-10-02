-- Add missing columns used by frontend to reports table
ALTER TABLE reports
  ADD COLUMN brand_name varchar(255) NULL COMMENT 'Denormalized brand name for reporting' AFTER brand,
  ADD COLUMN facebook_cost_per_lead decimal(10,2) GENERATED ALWAYS AS (CASE WHEN facebook_result > 0 THEN spent / facebook_result ELSE NULL END) STORED AFTER spent,
  ADD COLUMN zoho_cost_per_lead decimal(10,2) GENERATED ALWAYS AS (CASE WHEN zoho_result > 0 THEN spent / zoho_result ELSE NULL END) STORED AFTER facebook_cost_per_lead;

-- Optional convenience index for frequent filters
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_report_month ON reports(report_month);
CREATE INDEX IF NOT EXISTS idx_reports_campaign ON reports(campaign_id);

-- Backfill brand_name from brands table
UPDATE reports r
LEFT JOIN brands b ON r.brand = b.id
SET r.brand_name = b.name
WHERE r.brand_name IS NULL;
