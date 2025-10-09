-- Create reports table for aggregated campaign data
CREATE TABLE IF NOT EXISTS `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_date` date NOT NULL,
  `report_month` varchar(7) DEFAULT NULL COMMENT 'Format: YYYY-MM',
  `campaign_id` int(11) NOT NULL,
  `campaign_name` varchar(255) DEFAULT NULL COMMENT 'Denormalized for performance',
  `campaign_type` varchar(100) DEFAULT NULL COMMENT 'Denormalized for performance',
  `brand` int(11) DEFAULT NULL COMMENT 'FK to brands table',
  `brand_name` varchar(255) DEFAULT NULL COMMENT 'Denormalized brand name for reporting',
  `leads` int(11) DEFAULT 0,
  `facebook_result` int(11) DEFAULT 0,
  `zoho_result` int(11) DEFAULT 0,
  `spent` decimal(15,2) DEFAULT 0.00,
  `facebook_cost_per_lead` decimal(10,2) GENERATED ALWAYS AS (case when `facebook_result` > 0 then `spent` / `facebook_result` else NULL end) STORED,
  `zoho_cost_per_lead` decimal(10,2) GENERATED ALWAYS AS (case when `zoho_result` > 0 then `spent` / `zoho_result` else NULL end) STORED,
  `cost_per_lead` decimal(10,2) GENERATED ALWAYS AS (case when `leads` > 0 then `spent` / `leads` else NULL end) STORED,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL COMMENT 'User who created this record',
  
  PRIMARY KEY (`id`),
  KEY `idx_report_date` (`report_date`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_brand` (`brand`),
  KEY `idx_report_month` (`report_month`),
  UNIQUE KEY `unique_campaign_date` (`campaign_id`, `report_date`),
  
  CONSTRAINT `fk_reports_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reports_brand` FOREIGN KEY (`brand`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_reports_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS `idx_reports_date_campaign` ON `reports` (`report_date`, `campaign_id`);
CREATE INDEX IF NOT EXISTS `idx_reports_brand_date` ON `reports` (`brand`, `report_date`);
CREATE INDEX IF NOT EXISTS `idx_reports_created_at` ON `reports` (`created_at`);

-- Insert sample data if tables are empty (for testing)
INSERT IGNORE INTO `reports` (
  `report_date`, 
  `report_month`, 
  `campaign_id`, 
  `campaign_name`, 
  `campaign_type`, 
  `brand`, 
  `brand_name`,
  `leads`,
  `facebook_result`,
  `zoho_result`,
  `spent`,
  `created_by`
) VALUES 
  ('2024-10-01', '2024-10', 1, 'Test Campaign 1', 'Lead Generation', 1, 'Test Brand', 100, 80, 20, 5000.00, 1),
  ('2024-10-02', '2024-10', 1, 'Test Campaign 1', 'Lead Generation', 1, 'Test Brand', 120, 90, 30, 6000.00, 1),
  ('2024-10-01', '2024-10', 2, 'Test Campaign 2', 'Brand Awareness', 2, 'Brand Two', 50, 40, 10, 2500.00, 1);