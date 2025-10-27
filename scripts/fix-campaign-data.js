const { pool } = require('../config/database');

const fixCampaignData = async () => {
  try {
    console.log('🔧 Adding campaign data with correct campaign IDs...');
    
    const sampleData = [
      // Summer Sale 2025 (ID: 11) data
      [11, 350, 420, 785.50, '2025-09-07', 1, 'Facebook Ads Card'],
      [11, 280, 310, 592.25, '2025-09-06', 1, 'Facebook Ads Card'],
      [11, 190, 250, 445.75, '2025-09-05', 1, 'Facebook Ads Card'],
      
      // Brand Awareness Q1 (ID: 12) data
      [12, 520, 380, 945.00, '2025-09-07', 2, 'Google Ads Card'],
      [12, 480, 420, 890.25, '2025-09-06', 2, 'Google Ads Card'],
      [12, 445, 395, 825.50, '2025-09-05', 2, 'Google Ads Card'],
      
      // Social Media Boost (ID: 13) data
      [13, 150, 200, 325.00, '2025-09-07', 5, 'Social Media Card'],
      [13, 120, 180, 285.75, '2025-09-06', 5, 'Social Media Card'],
      [13, 95, 165, 245.50, '2025-09-05', 5, 'Social Media Card']
    ];
    
    for (const data of sampleData) {
      try {
        const [result] = await pool.execute(`
          INSERT INTO campaign_data (campaign_id, facebook_result, xoho_result, spent, data_date, card_id, card_name) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, data);
        console.log(`✅ Added campaign data entry (ID: ${result.insertId}) for campaign ${data[0]}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️  Data already exists for campaign ${data[0]} on ${data[4]}`);
        } else {
          console.log(`❌ Failed to add data for campaign ${data[0]}:`, error.message);
        }
      }
    }
    
    // Verify the data
    const [finalCampaignData] = await pool.execute(`
      SELECT 
        cd.id, 
        c.name as campaign_name, 
        cd.facebook_result, 
        cd.xoho_result, 
        cd.spent, 
        cd.data_date,
        cd.card_name
      FROM campaign_data cd 
      LEFT JOIN campaigns c ON cd.campaign_id = c.id 
      ORDER BY cd.data_date DESC, cd.id DESC
      LIMIT 10
    `);
    
    console.log(`\n📊 Campaign data entries (${finalCampaignData.length}):`);
    finalCampaignData.forEach(entry => {
      console.log(`  - ${entry.campaign_name}: FB: ${entry.facebook_result}, Xoho: ${entry.xoho_result}, Spent: $${entry.spent} (${entry.data_date}) [${entry.card_name}]`);
    });
    
    // Summary statistics
    const [summary] = await pool.execute(`
      SELECT 
        COUNT(*) as total_entries,
        SUM(facebook_result) as total_facebook_results,
        SUM(xoho_result) as total_xoho_results,
        SUM(spent) as total_spent
      FROM campaign_data
    `);
    
    console.log('\n📈 Summary Statistics:');
    console.log(`  - Total entries: ${summary[0].total_entries}`);
    console.log(`  - Total Facebook results: ${summary[0].total_facebook_results}`);
    console.log(`  - Total Xoho results: ${summary[0].total_xoho_results}`);
    console.log(`  - Total spent: $${parseFloat(summary[0].total_spent).toFixed(2)}`);
    
    console.log('\n🎉 Campaign data fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
};

fixCampaignData();
