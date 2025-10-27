#!/usr/bin/env node

/**
 * Age Column Migration Runner
 * 
 * This script migrates the campaigns.age column from INT to VARCHAR
 * to support age ranges like "18-25", "30+", "up to 40", etc.
 * 
 * Usage:
 *   node run-age-migration.js
 */

const { migrateCampaignsAgeColumn } = require('./migrations/20250916000001_modify_campaigns_age_column');

console.log('🎯 Campaign Age Column Migration');
console.log('================================');
console.log('');
console.log('This migration will:');
console.log('• Change campaigns.age from INT(11) to VARCHAR(50)');
console.log('• Preserve any existing age data');
console.log('• Enable storing age ranges like "18-25", "30+", etc.');
console.log('');

// Run the migration
migrateCampaignsAgeColumn();
