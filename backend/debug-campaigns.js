const { pool } = require('./config/database');

async function debugCampaigns() {
  try {
    console.log('🔍 Debugging Campaigns Database...');
    
    // Test database connection
    console.log('\n1. Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Check if campaigns table exists
    console.log('\n2. Checking if campaigns table exists...');
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'campaigns'
    `, [process.env.DB_NAME]);
    
    if (tables.length === 0) {
      console.log('❌ Campaigns table does not exist!');
      
      // Show all tables
      console.log('\n3. Available tables in database:');
      const [allTables] = await pool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ?
      `, [process.env.DB_NAME]);
      
      allTables.forEach(table => {
        console.log(`   - ${table.TABLE_NAME}`);
      });
      return;
    }
    
    console.log('✅ Campaigns table exists');
    
    // Get table structure
    console.log('\n3. Campaigns table structure:');
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'campaigns'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    columns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.EXTRA || ''}`);
    });
    
    // Count records
    console.log('\n4. Campaign count:');
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM campaigns');
    console.log(`   Total campaigns: ${count[0].total}`);
    
    // Show sample campaigns if any exist
    if (count[0].total > 0) {
      console.log('\n5. Sample campaigns (first 3):');
      const [campaigns] = await pool.execute(`
        SELECT c.*, ct.type_name as campaign_type_name
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        LIMIT 3
      `);
      
      campaigns.forEach(campaign => {
        console.log(`   ID: ${campaign.id}, Name: ${campaign.name}, Type: ${campaign.campaign_type_name || 'N/A'}, Enabled: ${campaign.is_enabled}`);
      });
    }
    
    // Check campaign_types table
    console.log('\n6. Checking campaign_types table...');
    const [ctCount] = await pool.execute('SELECT COUNT(*) as total FROM campaign_types WHERE is_active = 1');
    console.log(`   Active campaign types: ${ctCount[0].total}`);
    
    if (ctCount[0].total > 0) {
      const [types] = await pool.execute('SELECT * FROM campaign_types WHERE is_active = 1 LIMIT 5');
      types.forEach(type => {
        console.log(`   ID: ${type.id}, Name: ${type.type_name}`);
      });
    }
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

debugCampaigns();
