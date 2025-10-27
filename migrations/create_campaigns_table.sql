-- Campaign table creation/update script
-- Run this to ensure the campaigns table exists with the correct structure

-- Create campaigns table if it doesn't exist or update it
CREATE TABLE IF NOT EXISTS campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  persona JSON NULL,
  gender JSON NULL,
  min_age INT NULL,
  max_age INT NULL,
  location JSON NULL,
  creatives ENUM('video', 'image', 'carousel', 'collection') NOT NULL DEFAULT 'image',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  campaign_type_id INT NULL,
  brand INT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  age_backup VARCHAR(255) NULL COMMENT 'Backup field for legacy age data',
  
  INDEX idx_campaigns_status (status),
  INDEX idx_campaigns_enabled (is_enabled),
  INDEX idx_campaigns_brand (brand),
  INDEX idx_campaigns_type (campaign_type_id),
  INDEX idx_campaigns_created_by (created_by),
  INDEX idx_campaigns_created_at (created_at),
  
  FOREIGN KEY (campaign_type_id) REFERENCES campaign_types(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (brand) REFERENCES brands(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Show table structure
DESCRIBE campaigns;

-- Show some test data if available
SELECT COUNT(*) as campaign_count FROM campaigns;

-- Test query to see if relationships work
SELECT 
  c.id,
  c.name,
  c.status,
  c.is_enabled,
  ct.name as campaign_type_name,
  b.name as brand_name
FROM campaigns c
LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
LEFT JOIN brands b ON c.brand = b.id
LIMIT 5;
