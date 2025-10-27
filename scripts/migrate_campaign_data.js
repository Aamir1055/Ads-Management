const { pool } = require('../config/database');

async function migrateCampaignData() {
  let connection;
  
  try {
    console.log('🔄 Migrating campaign_data to reference campaign_types...');
    connection = await pool.getConnection();
    
    await connection.beginTransaction();
    
    // Update existing campaign_data records to use campaign_type_id instead of campaign_id
    // Based on the mapping from campaigns table
    
    // Campaign 11 -> campaign_type_id 1
    await connection.execute(`
      UPDATE campaign_data cd
      JOIN campaigns c ON cd.campaign_id = c.id
      SET cd.campaign_id = c.campaign_type_id
      WHERE c.id = 11
    `);
    console.log('✅ Updated campaign_data records for campaign 11 to use campaign_type 1');
    
    // Campaign 12 -> campaign_type_id 2  
    await connection.execute(`
      UPDATE campaign_data cd
      JOIN campaigns c ON cd.campaign_id = c.id
      SET cd.campaign_id = c.campaign_type_id
      WHERE c.id = 12
    `);
    console.log('✅ Updated campaign_data records for campaign 12 to use campaign_type 2');
    
    // Campaign 13 -> campaign_type_id 3
    await connection.execute(`
      UPDATE campaign_data cd
      JOIN campaigns c ON cd.campaign_id = c.id
      SET cd.campaign_id = c.campaign_type_id
      WHERE c.id = 13
    `);
    console.log('✅ Updated campaign_data records for campaign 13 to use campaign_type 3');
    
    // Verify the update
    const [updatedData] = await connection.execute(`
      SELECT DISTINCT campaign_id, COUNT(*) as count
      FROM campaign_data 
      GROUP BY campaign_id
      ORDER BY campaign_id
    `);
    
    console.log('Updated campaign_data campaign_ids:', updatedData);
    
    // Now try to update the foreign key constraint
    try {
      await connection.execute('ALTER TABLE campaign_data DROP FOREIGN KEY campaign_data_ibfk_1');
      console.log('✅ Dropped old foreign key constraint');
    } catch (error) {
      console.log('⚠️  Old constraint might already be dropped:', error.message);
    }
    
    // Add new constraint referencing campaign_types
    await connection.execute(`
      ALTER TABLE campaign_data 
      ADD CONSTRAINT campaign_data_ibfk_1 
      FOREIGN KEY (campaign_id) REFERENCES campaign_types(id) 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    
    console.log('✅ Added new foreign key constraint to campaign_types');
    
    await connection.commit();
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
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

migrateCampaignData();
