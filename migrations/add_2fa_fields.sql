-- Migration: Add 2FA fields to users table
-- Created: 2025-09-09
-- Description: Adds Two-Factor Authentication support to the users table

-- Rename existing 2FA field to match our naming convention
ALTER TABLE users CHANGE COLUMN is_2fa_enabled twofa_enabled BOOLEAN DEFAULT FALSE;

-- Add missing 2FA fields
ALTER TABLE users 
ADD COLUMN twofa_secret VARCHAR(255) NULL AFTER twofa_enabled,
ADD COLUMN twofa_verified_at TIMESTAMP NULL AFTER twofa_secret;

-- Add index for better performance on 2FA queries
CREATE INDEX idx_users_twofa_enabled ON users(twofa_enabled);

-- Update the table comment to reflect 2FA support
ALTER TABLE users COMMENT = 'User accounts with Two-Factor Authentication support';
