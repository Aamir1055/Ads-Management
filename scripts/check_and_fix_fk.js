const { pool } = require('../config/database');

async function checkAndFixForeignKey() {
  let connection;
  
  try {
    console.log('🔄 Checking current foreign key constraints...');
    connection = await pool.getConnection();
    
    // Show current table structure and constraints
    const [tableInfo] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'ads reporting' 
      AND TABLE_NAME = 'campaign_data' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('Current foreign key constraints:', tableInfo);
    
    // Try to drop and recreate the foreign key constraint
    await connection.beginTransaction();
    
    // First, let's try to drop the constraint (if it exists)
    try {
      await connection.execute('ALTER TABLE campaign_data DROP FOREIGN KEY campaign_data_ibfk_1');
      console.log('✅ Dropped existing foreign key constraint');
    } catch (error) {
      console.log('⚠️  Foreign key constraint might not exist:', error.message);
    }
    
    // Add new constraint referencing campaign_types
    await connection.execute(`
      ALTER TABLE campaign_data 
      ADD CONSTRAINT campaign_data_ibfk_1 
      FOREIGN KEY (campaign_id) REFERENCES campaign_types(id) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    
    console.log('✅ Added new foreign key constraint to campaign_types');
    
    // Verify the new constraint
    const [newConstraints] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'ads reporting' 
      AND TABLE_NAME = 'campaign_data' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('New foreign key constraints:', newConstraints);
    
    await connection.commit();
    console.log('✅ Foreign key migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (connection) {
      await connection.rollback();
    }
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

checkAndFixForeignKey();
