const mysql = require('mysql2/promise');

async function fixConstraint() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'adsuser',
      password: 'AdsPass123!',
      database: 'ads reporting',  // Using the actual database name with space
      port: 3306
    });
    
    console.log('🔗 Connected to database');
    
    // Check if constraint exists
    console.log('🔍 Checking if unique constraint exists...');
    const [existing] = await connection.query(`
      SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, TABLE_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'ads_managers' 
      AND CONSTRAINT_NAME = 'unique_ads_manager_per_bm'
    `);
    
    if (existing.length > 0) {
      console.log('❌ Found unique constraint that prevents multiple ads managers per BM:', existing);
      
      // Remove the constraint
      console.log('🔧 Removing unique constraint...');
      await connection.query('ALTER TABLE ads_managers DROP INDEX unique_ads_manager_per_bm');
      console.log('✅ Unique constraint removed successfully');
    } else {
      console.log('✅ Unique constraint not found - already removed or never existed');
    }
    
    // Show remaining indexes
    console.log('📊 Remaining indexes on ads_managers table:');
    const [indexes] = await connection.query('SHOW INDEX FROM ads_managers');
    indexes.forEach(index => {
      console.log(`  - ${index.Key_name}: ${index.Column_name} (Unique: ${index.Non_unique === 0})`);
    });
    
    await connection.end();
    console.log('🎉 Fix completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixConstraint();