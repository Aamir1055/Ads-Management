-- Migration: Modify campaigns table age column to support age ranges
-- Date: 2025-09-16
-- Description: Change age column from INT to VARCHAR to store age ranges like "18-25", "30+", "up to 40"

USE `ads_reporting`;

-- First, let's backup existing age data in case there are any values
-- Create temporary column to store existing data
ALTER TABLE `campaigns` ADD COLUMN `age_backup` INT(11) DEFAULT NULL COMMENT 'Temporary backup of old age values';

-- Copy existing age data to backup
UPDATE `campaigns` SET `age_backup` = `age` WHERE `age` IS NOT NULL;

-- Now modify the age column to VARCHAR
ALTER TABLE `campaigns` MODIFY COLUMN `age` VARCHAR(50) DEFAULT NULL COMMENT 'Age range or single age (e.g., "18-25", "30+", "up to 40", "25")';

-- Convert any existing numeric age values back to strings
UPDATE `campaigns` SET `age` = CAST(`age_backup` AS CHAR) WHERE `age_backup` IS NOT NULL AND `age` IS NULL;

-- Drop the backup column once migration is verified
-- ALTER TABLE `campaigns` DROP COLUMN `age_backup`;

-- Note: Uncomment the above line after verifying the migration worked correctly

-- Show the updated table structure
DESCRIBE `campaigns`;
