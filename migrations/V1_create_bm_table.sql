-- Create BM (Business Manager) table
CREATE TABLE IF NOT EXISTS bm (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bm_name VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    facebook_account_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    status ENUM('enabled', 'disabled') DEFAULT 'enabled',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email (email),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (facebook_account_id) REFERENCES facebook_accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_bm_facebook_account (facebook_account_id),
    INDEX idx_bm_created_by (created_by),
    INDEX idx_bm_status (status)
);