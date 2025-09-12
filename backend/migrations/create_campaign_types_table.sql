-- Migration: Create campaign_types table
-- Created: 2025-09-08
-- Description: Create table to store campaign type definitions

CREATE TABLE IF NOT EXISTS campaign_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_name (type_name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some default campaign types
INSERT IGNORE INTO campaign_types (type_name, description) VALUES 
('Search', 'Search engine marketing campaigns'),
('Display', 'Display advertising campaigns'),
('Social Media', 'Social media advertising campaigns'),
('Video', 'Video advertising campaigns'),
('Shopping', 'Product shopping campaigns'),
('Email', 'Email marketing campaigns');
