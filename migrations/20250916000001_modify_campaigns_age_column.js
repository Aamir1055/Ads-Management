const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

async function migrateCampaignsAgeColumn() {
  let connection;
  
  try {
    console.log('🚀 Starting campaigns age column migration...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Step 1: Add backup column
    console.log('📝 Adding backup column...');
    await connection.execute(`
      ALTER TABLE campaigns 
      ADD COLUMN age_backup INT(11) DEFAULT NULL 
      COMMENT 'Temporary backup of old age values'
    `);
    
    // Step 2: Copy existing data to backup
    console.log('💾 Backing up existing age data...');
    await connection.execute(`
      UPDATE campaigns 
      SET age_backup = age 
      WHERE age IS NOT NULL
    `);
    
    // Step 3: Check how many records will be affected
    const [existingData] = await connection.execute(`
      SELECT COUNT(*) as count, MIN(age) as min_age, MAX(age) as max_age 
      FROM campaigns 
      WHERE age IS NOT NULL
    `);
    
    console.log(`📊 Found ${existingData[0].count} campaigns with age data:`);
    if (existingData[0].count > 0) {
      console.log(`   Age range: ${existingData[0].min_age} to ${existingData[0].max_age}`);
    }
    
    // Step 4: Modify age column to VARCHAR
    console.log('🔄 Modifying age column to VARCHAR...');
    await connection.execute(`
      ALTER TABLE campaigns 
      MODIFY COLUMN age VARCHAR(50) DEFAULT NULL 
      COMMENT 'Age range or single age (e.g., "18-25", "30+", "up to 40", "25")'
    `);
    
    // Step 5: Convert existing numeric values back to strings
    console.log('🔢 Converting existing numeric age values to strings...');
    const [updateResult] = await connection.execute(`
      UPDATE campaigns 
      SET age = CAST(age_backup AS CHAR) 
      WHERE age_backup IS NOT NULL
    `);
    
    console.log(`✅ Updated ${updateResult.affectedRows} records`);
    
    // Step 6: Verify the migration
    console.log('🔍 Verifying migration...');
    const [verifyResult] = await connection.execute(`
      SELECT id, name, age, age_backup 
      FROM campaigns 
      WHERE age IS NOT NULL OR age_backup IS NOT NULL 
      LIMIT 5
    `);
    
    if (verifyResult.length > 0) {
      console.log('📋 Sample migrated data:');
      verifyResult.forEach(row => {
        console.log(`   ID: ${row.id}, Name: ${row.name}, Age: "${row.age}" (was: ${row.age_backup})`);
      });
    }
    
    // Step 7: Show updated table structure
    console.log('📝 Updated table structure:');
    const [tableInfo] = await connection.execute('DESCRIBE campaigns');
    const ageColumn = tableInfo.find(col => col.Field === 'age');
    if (ageColumn) {
      console.log(`   age: ${ageColumn.Type} ${ageColumn.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${ageColumn.Default ? `DEFAULT ${ageColumn.Default}` : ''}`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📌 IMPORTANT: The age_backup column has been kept for safety.');
    console.log('   You can remove it later by running:');
    console.log('   ALTER TABLE campaigns DROP COLUMN age_backup;');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // Try to rollback if possible
    if (connection) {
      try {
        console.log('🔄 Attempting rollback...');
        await connection.execute('ALTER TABLE campaigns DROP COLUMN age_backup');
        console.log('✅ Rollback completed');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateCampaignsAgeColumn();
}

module.exports = { migrateCampaignsAgeColumn };
