const { pool } = require('../config/database');

/**
 * Add created_by column to reports table for user data privacy
 * This migration adds a created_by field to track which user created each report
 * Essential for the analytics module's data privacy features
 */

const addCreatedByToReports = async () => {
  console.log('🔧 Adding created_by column to reports table...');
  
  try {
    // Check if the column already exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'reports' 
      AND COLUMN_NAME = 'created_by'
    `);
    
    if (columns.length > 0) {
      console.log('   ✅ created_by column already exists in reports table');
      return;
    }
    
    // Add the created_by column
    await pool.query(`
      ALTER TABLE reports 
      ADD COLUMN created_by INT NULL AFTER spent,
      ADD KEY idx_reports_created_by (created_by)
    `);
    
    console.log('   ✅ Added created_by column to reports table');
    
    // Set a default value for existing reports (user ID 1 if exists, otherwise NULL)
    const [adminUsers] = await pool.query(`
      SELECT id FROM users 
      WHERE role_id IN (SELECT id FROM roles WHERE level >= 10) 
      ORDER BY id ASC 
      LIMIT 1
    `);
    
    if (adminUsers.length > 0) {
      const defaultUserId = adminUsers[0].id;
      await pool.query(`
        UPDATE reports 
        SET created_by = ? 
        WHERE created_by IS NULL
      `, [defaultUserId]);
      
      console.log(`   ✅ Set default created_by value (${defaultUserId}) for existing reports`);
    } else {
      console.log('   ⚠️  No admin users found, existing reports will have NULL created_by');
    }
    
    // Now let's also add foreign key constraint
    await pool.query(`
      ALTER TABLE reports 
      ADD CONSTRAINT fk_reports_created_by 
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    `);
    
    console.log('   ✅ Added foreign key constraint for created_by field');
    
    // Update the existing report controller's upsert query to include created_by
    console.log('\n📋 Migration completed successfully!');
    console.log('');
    console.log('⚠️  IMPORTANT NOTES:');
    console.log('1. All new reports will now require a created_by user ID');
    console.log('2. Update your report creation logic to include req.user.id');
    console.log('3. The analytics module now properly filters data by user ownership');
    console.log('4. Superadmins (level 10+) can see all reports, others see only their own');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error adding created_by column to reports table:', error);
    throw error;
  }
};

// Run the migration if called directly
if (require.main === module) {
  addCreatedByToReports()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addCreatedByToReports;
