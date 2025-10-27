const { pool } = require('../config/database');

async function checkDataConsistency() {
  let connection;
  
  try {
    console.log('🔄 Checking data consistency...');
    connection = await pool.getConnection();
    
    // Check campaign_ids in campaign_data table
    const [campaignDataIds] = await connection.execute(`
      SELECT DISTINCT campaign_id, COUNT(*) as count
      FROM campaign_data 
      GROUP BY campaign_id
      ORDER BY campaign_id
    `);
    
    console.log('Campaign IDs in campaign_data:', campaignDataIds);
    
    // Check campaign_types IDs
    const [campaignTypes] = await connection.execute(`
      SELECT id, type_name, is_active
      FROM campaign_types 
      ORDER BY id
    `);
    
    console.log('Campaign types available:', campaignTypes);
    
    // Check campaigns IDs
    const [campaigns] = await connection.execute(`
      SELECT id, name, campaign_type_id
      FROM campaigns 
      ORDER BY id
    `);
    
    console.log('Campaigns available:', campaigns);
    
    // Find orphaned campaign_data records
    const [orphanedData] = await connection.execute(`
      SELECT cd.id, cd.campaign_id, COUNT(*) as count
      FROM campaign_data cd
      LEFT JOIN campaign_types ct ON cd.campaign_id = ct.id
      WHERE ct.id IS NULL
      GROUP BY cd.campaign_id
      ORDER BY cd.campaign_id
    `);
    
    console.log('Orphaned campaign_data records (campaign_id not in campaign_types):', orphanedData);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

checkDataConsistency();
