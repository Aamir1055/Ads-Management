const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
  try {
    console.log('🔄 Starting campaign types table migration...');
    
    // Create the table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS campaign_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type_name (type_name),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await pool.execute(createTableQuery);
    console.log('✅ Campaign types table created successfully');
    
    // Insert default campaign types
    const insertQuery = `
      INSERT IGNORE INTO campaign_types (type_name, description) VALUES 
      ('Search', 'Search engine marketing campaigns'),
      ('Display', 'Display advertising campaigns'),
      ('Social Media', 'Social media advertising campaigns'),
      ('Video', 'Video advertising campaigns'),
      ('Shopping', 'Product shopping campaigns'),
      ('Email', 'Email marketing campaigns');
    `;
    
    const [result] = await pool.execute(insertQuery);
    console.log(`✅ Inserted ${result.affectedRows} default campaign types`);
    
    // Verify the data
    const [campaignTypes] = await pool.execute('SELECT * FROM campaign_types ORDER BY id');
    console.log('📋 Current campaign types in database:');
    campaignTypes.forEach(type => {
      console.log(`  - ${type.id}: ${type.type_name} (${type.is_active ? 'Active' : 'Inactive'})`);
    });
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Run migration
runMigration();
