-- Migration: Create campaign data and related tables
-- Created: 2025-09-08
-- Description: Create tables for campaign data management system

-- Create campaigns table (references campaign_types)
CREATE TABLE IF NOT EXISTS campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type_id INT NOT NULL,
    description TEXT,
    status ENUM('active', 'paused', 'completed') DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2) DEFAULT 0.00,
    target_audience TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_type_id) REFERENCES campaign_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_campaign_name (campaign_name),
    INDEX idx_campaign_type_id (campaign_type_id),
    INDEX idx_status (status),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create cards table 
CREATE TABLE IF NOT EXISTS cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_name VARCHAR(255) NOT NULL,
    card_code VARCHAR(50) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_card_name (card_name),
    INDEX idx_card_code (card_code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create campaign_data table (main table for campaign data)
CREATE TABLE IF NOT EXISTS campaign_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    facebook_result INT DEFAULT 0,
    xoho_result INT DEFAULT 0,
    spent DECIMAL(15,2) DEFAULT 0.00,
    data_date DATE DEFAULT (CURRENT_DATE - INTERVAL 1 DAY) COMMENT 'Default to yesterday',
    card_id INT,
    card_name VARCHAR(255) COMMENT 'Denormalized for quick access',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_data_date (data_date),
    INDEX idx_card_id (card_id),
    UNIQUE KEY unique_campaign_date (campaign_id, data_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample campaigns (referencing existing campaign types)
INSERT IGNORE INTO campaigns (campaign_name, campaign_type_id, description, status, budget, created_by) VALUES 
('Summer Sale Campaign', 1, 'Summer promotional campaign using search ads', 'active', 5000.00, 1),
('Brand Awareness Drive', 2, 'Display advertising for brand awareness', 'active', 8000.00, 1),
('Social Media Boost', 3, 'Social media engagement campaign', 'active', 3000.00, 1),
('Product Launch Video', 4, 'Video campaign for new product launch', 'paused', 12000.00, 1),
('Holiday Shopping', 5, 'Shopping campaign for holiday season', 'active', 15000.00, 1);

-- Insert sample cards
INSERT IGNORE INTO cards (card_name, card_code, description, created_by) VALUES 
('Facebook Ads Card', 'FB_001', 'Facebook advertising platform card', 1),
('Google Ads Card', 'GA_001', 'Google advertising platform card', 1),
('Instagram Card', 'IG_001', 'Instagram advertising platform card', 1),
('YouTube Ads Card', 'YT_001', 'YouTube advertising platform card', 1),
('LinkedIn Ads Card', 'LI_001', 'LinkedIn advertising platform card', 1);

-- Insert sample campaign data
INSERT IGNORE INTO campaign_data (campaign_id, facebook_result, xoho_result, spent, data_date, card_id, card_name, created_by) VALUES 
(1, 150, 200, 250.75, '2025-09-07', 1, 'Facebook Ads Card', 1),
(1, 120, 180, 200.50, '2025-09-06', 1, 'Facebook Ads Card', 1),
(2, 300, 250, 450.25, '2025-09-07', 2, 'Google Ads Card', 1),
(3, 80, 100, 150.00, '2025-09-07', 3, 'Instagram Card', 1),
(4, 500, 400, 800.00, '2025-09-06', 4, 'YouTube Ads Card', 1);
