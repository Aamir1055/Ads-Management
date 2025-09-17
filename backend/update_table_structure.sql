-- Update campaigns table to use proper min_age and max_age columns

-- First, add the new columns if they don't exist
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS min_age INT(11) NULL COMMENT 'Minimum age for targeting',
ADD COLUMN IF NOT EXISTS max_age INT(11) NULL COMMENT 'Maximum age for targeting';

-- Migrate existing age data to the new columns
UPDATE campaigns 
SET 
  min_age = CASE 
    WHEN age REGEXP '^[0-9]+-[0-9]+$' THEN CAST(SUBSTRING_INDEX(age, '-', 1) AS UNSIGNED)
    WHEN age REGEXP '^[0-9]+\\+$' THEN CAST(REPLACE(age, '+', '') AS UNSIGNED)
    WHEN age REGEXP '^up to [0-9]+$' THEN NULL
    WHEN age REGEXP '^[0-9]+$' THEN CAST(age AS UNSIGNED)
    ELSE NULL
  END,
  max_age = CASE 
    WHEN age REGEXP '^[0-9]+-[0-9]+$' THEN CAST(SUBSTRING_INDEX(age, '-', -1) AS UNSIGNED)
    WHEN age REGEXP '^[0-9]+\\+$' THEN NULL
    WHEN age REGEXP '^up to [0-9]+$' THEN CAST(REPLACE(REPLACE(age, 'up to ', ''), ' ', '') AS UNSIGNED)
    WHEN age REGEXP '^[0-9]+$' THEN CAST(age AS UNSIGNED)
    ELSE NULL
  END
WHERE age IS NOT NULL AND age != '';

-- Show the updated structure
DESCRIBE campaigns;
