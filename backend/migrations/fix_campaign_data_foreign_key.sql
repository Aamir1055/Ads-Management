-- Migration: Fix campaign_data foreign key to reference campaign_types
-- Created: 2025-09-10
-- Description: Update campaign_data table to reference campaign_types directly instead of campaigns

-- Drop the existing foreign key constraint
ALTER TABLE campaign_data DROP FOREIGN KEY campaign_data_ibfk_1;

-- Add the new foreign key constraint to reference campaign_types
ALTER TABLE campaign_data 
ADD CONSTRAINT campaign_data_ibfk_1 
FOREIGN KEY (campaign_id) REFERENCES campaign_types(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Verify the constraint
SHOW CREATE TABLE campaign_data;
