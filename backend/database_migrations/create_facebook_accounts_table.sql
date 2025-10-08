-- Create Facebook Accounts table
-- Migration: create_facebook_accounts_table.sql

USE ads_reporting;

CREATE TABLE IF NOT EXISTS facebook_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    authenticator TEXT NULL,
    phone_number VARCHAR(20) NULL,
    id_image_path VARCHAR(500) NULL,
    status ENUM('enabled', 'disabled') DEFAULT 'enabled',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_facebook_accounts_email (email),
    INDEX idx_facebook_accounts_status (status),
    INDEX idx_facebook_accounts_created_by (created_by)
);

-- Add sample data for testing (optional)
-- INSERT INTO facebook_accounts (email, password, phone_number, status, created_by) 
-- VALUES 
-- ('test@facebook.com', 'encrypted_password_here', '+1234567890', 'enabled', 1),
-- ('demo@facebook.com', 'encrypted_password_here', '+0987654321', 'disabled', 1);