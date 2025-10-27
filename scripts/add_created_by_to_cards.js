const { pool } = require('../config/database');

/**
 * Script to add created_by column to cards table for data privacy support
 */

const addCreatedByToCards = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('🚀 Adding created_by column to cards table...');
    
    // Check if created_by column already exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'cards' 
        AND COLUMN_NAME = 'created_by'
    `);
    
    if (columns.length > 0) {
      console.log('✅ created_by column already exists in cards table');
      return;
    }
    
    await connection.beginTransaction();
    
    // Add created_by column as nullable initially
    await connection.query(`
      ALTER TABLE cards 
      ADD COLUMN created_by INT NULL 
      AFTER is_active
    `);
    console.log('✅ Added created_by column to cards table');
    
    // Add foreign key constraint to users table
    await connection.query(`
      ALTER TABLE cards 
      ADD CONSTRAINT fk_cards_created_by 
      FOREIGN KEY (created_by) REFERENCES users(id) 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ Added foreign key constraint for created_by');
    
    // Get the first admin/super admin user to assign existing cards
    const [adminUsers] = await connection.query(`
      SELECT u.id, u.username, r.display_name, r.name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.display_name IN ('Super Admin', 'Admin') OR r.name IN ('super_admin', 'admin') 
      ORDER BY u.id ASC 
      LIMIT 1
    `);
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found. All existing cards will remain unassigned.');
    } else {
      const adminUser = adminUsers[0];
      console.log(`📋 Found admin user: ${adminUser.username} (${adminUser.display_name})`);
      
      // Update existing cards to be owned by the admin
      const [updateResult] = await connection.query(`
        UPDATE cards 
        SET created_by = ? 
        WHERE created_by IS NULL
      `, [adminUser.id]);
      
      console.log(`✅ Assigned ${updateResult.affectedRows} existing cards to admin user ${adminUser.username}`);
    }
    
    await connection.commit();
    console.log('✅ Successfully added created_by support to cards table');
    
    // Show summary
    const [cardCounts] = await connection.query(`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(created_by) as assigned_cards,
        COUNT(*) - COUNT(created_by) as unassigned_cards
      FROM cards
    `);
    
    const stats = cardCounts[0];
    console.log('\n📊 Cards ownership summary:');
    console.log(`   Total cards: ${stats.total_cards}`);
    console.log(`   Assigned cards: ${stats.assigned_cards}`);
    console.log(`   Unassigned cards: ${stats.unassigned_cards}`);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error adding created_by to cards table:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Run if called directly
if (require.main === module) {
  addCreatedByToCards()
    .then(() => {
      console.log('\n🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = addCreatedByToCards;
