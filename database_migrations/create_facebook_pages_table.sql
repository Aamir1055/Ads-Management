-- Create Facebook Pages table
-- Migration: create_facebook_pages_table.sql

USE ads_reporting;

CREATE TABLE IF NOT EXISTS facebook_pages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    facebook_account_id INT NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    page_description TEXT NULL,
    status ENUM('enabled', 'disabled', 'suspended_temporarily') DEFAULT 'enabled',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (facebook_account_id) REFERENCES facebook_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_facebook_pages_account_id (facebook_account_id),
    INDEX idx_facebook_pages_status (status),
    INDEX idx_facebook_pages_created_by (created_by),
    INDEX idx_facebook_pages_page_name (page_name),
    
    -- Unique constraint to prevent duplicate page names per account
    UNIQUE KEY unique_page_per_account (facebook_account_id, page_name)
);

-- Add sample data for testing (optional, will be commented out)
-- INSERT INTO facebook_pages (facebook_account_id, page_name, page_description, status, created_by) 
-- VALUES 
-- (1, 'My Business Page', 'Main business page for marketing', 'enabled', 1),
-- (1, 'Product Page', 'Page for specific product promotion', 'enabled', 1),
-- (2, 'Local Store Page', 'Local business page', 'disabled', 1);