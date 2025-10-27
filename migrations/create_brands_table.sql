-- Create brands table
-- This script ensures the brands table exists with the correct structure

USE `ads reporting`;

-- Drop existing brands table if it exists (for clean start)
DROP TABLE IF EXISTS `brands`;

-- Create brands table
CREATE TABLE `brands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL UNIQUE,
  `description` text NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) NULL,
  `updated_by` int(11) NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `is_active` (`is_active`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample brands
INSERT INTO `brands` (`name`, `description`, `is_active`, `created_by`) VALUES
('Nike', 'Sportswear and athletic footwear brand', 1, 1),
('Adidas', 'German multinational corporation that designs and manufactures shoes', 1, 1),
('Apple', 'Technology company known for innovative products', 1, 1),
('Samsung', 'South Korean multinational electronics company', 1, 1),
('Coca-Cola', 'American multinational beverage corporation', 1, 1);

-- Add foreign key constraints if users table exists
SET @exist := (SELECT COUNT(*) FROM information_schema.tables 
               WHERE table_schema = 'ads reporting' 
               AND table_name = 'users');

SET @sql = IF(@exist > 0,
  'ALTER TABLE `brands` ADD CONSTRAINT `fk_brands_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT "Users table not found, skipping foreign key constraint" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@exist > 0,
  'ALTER TABLE `brands` ADD CONSTRAINT `fk_brands_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT "Users table not found, skipping foreign key constraint" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Brands table created successfully!' as result;
