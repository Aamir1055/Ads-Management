-- Migration: Remove unique constraint on campaign_data to allow multiple entries per date
-- Created: 2025-09-12
-- Description: Allow users to create multiple campaign data entries for the same campaign and date

USE `ads reporting`;

-- Drop the unique constraint that prevents multiple entries per campaign per date
ALTER TABLE campaign_data DROP INDEX unique_campaign_date;

-- Add a comment to document the change
ALTER TABLE campaign_data COMMENT = 'Campaign data table - allows multiple entries per campaign per date since 2025-09-12';

-- Verify the constraint has been removed
SHOW CREATE TABLE campaign_data;
