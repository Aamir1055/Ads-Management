-- Create database
CREATE DATABASE IF NOT EXISTS ads_reporting;
USE ads_reporting;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    budget DECIMAL(10, 2),
    status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Ad statistics table
CREATE TABLE IF NOT EXISTS ad_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ad_id INT NOT NULL,
    date DATE NOT NULL,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    spend DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE,
    UNIQUE KEY unique_ad_date (ad_id, date)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL,
    data JSON,
    generated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Campaigns table (for grouping ads)
CREATE TABLE IF NOT EXISTS campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    budget DECIMAL(10, 2),
    status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add campaign_id to ads table
ALTER TABLE ads ADD COLUMN campaign_id INT,
ADD FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_dates ON ads(start_date, end_date);
CREATE INDEX idx_ad_stats_date ON ad_stats(date);
CREATE INDEX idx_users_email ON users(email);
