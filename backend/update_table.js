const mysql = require('mysql2/promise');

async function updateTableStructure() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ads reporting'
  });

  try {
    console.log('Updating campaigns table structure...');
    
    // Add new columns if they don't exist
    try {
      await conn.execute(`
        ALTER TABLE campaigns 
        ADD COLUMN min_age INT(11) NULL COMMENT 'Minimum age for targeting'
      `);
      console.log('✅ Added min_age column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  min_age column already exists');
      } else {
        console.error('Error adding min_age:', error.message);
      }
    }

    try {
      await conn.execute(`
        ALTER TABLE campaigns 
        ADD COLUMN max_age INT(11) NULL COMMENT 'Maximum age for targeting'
      `);
      console.log('✅ Added max_age column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  max_age column already exists');
      } else {
        console.error('Error adding max_age:', error.message);
      }
    }

    // Show current table structure
    const [columns] = await conn.execute('DESCRIBE campaigns');
    console.log('\n📋 Current table structure:');
    console.table(columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

    // Show current data
    const [campaigns] = await conn.execute(
      'SELECT id, name, age, min_age, max_age FROM campaigns ORDER BY id DESC LIMIT 5'
    );
    console.log('\n📊 Current campaign data:');
    console.table(campaigns);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await conn.end();
  }
}

updateTableStructure();
