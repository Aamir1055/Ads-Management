const { pool } = require('../config/database');

const addCampaigns = async () => {
  try {
    console.log('🔄 Adding sample campaigns...');
    
    // Add some sample campaigns with the correct structure
    const campaigns = [
      ['Summer Sale 2025', 1, 'Young professionals', 'all', 25, 'USA, Canada', 'image', 1, 'TechCorp', 1],
      ['Brand Awareness Q1', 2, 'Tech enthusiasts', 'all', 30, 'USA', 'video', 1, 'TechCorp', 1],
      ['Social Media Boost', 3, 'Gen Z users', 'all', 22, 'Global', 'carousel', 1, 'LifestyleCo', 1],
      ['Product Launch Campaign', 4, 'Early adopters', 'all', 35, 'USA, UK', 'video', 1, 'InnovateTech', 1],
      ['Holiday Shopping Drive', 5, 'Families', 'all', 40, 'USA', 'collection', 1, 'RetailPlus', 1]
    ];
    
    for (const campaign of campaigns) {
      try {
        await pool.execute(`
          INSERT IGNORE INTO campaigns (name, campaign_type_id, persona, gender, age, location, creatives, is_enabled, brand, created_by) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, campaign);
        console.log(`✅ Added campaign: ${campaign[0]}`);
      } catch (error) {
        console.log(`ℹ️  Campaign ${campaign[0]} might already exist:`, error.message);
      }
    }
    
    // Verify campaigns were added
    const [addedCampaigns] = await pool.execute(`
      SELECT c.id, c.name, ct.type_name 
      FROM campaigns c 
      LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id 
      ORDER BY c.id
    `);
    
    console.log(`\n📋 Available campaigns (${addedCampaigns.length} total):`);
    addedCampaigns.forEach(campaign => {
      console.log(`  - ${campaign.id}: ${campaign.name} (${campaign.type_name})`);
    });
    
    // Now add sample campaign data
    const sampleData = [
      // Summer Sale 2025 data
      [1, 350, 420, 785.50, '2025-09-07', 1, 'Facebook Ads Card', 1],
      [1, 280, 310, 592.25, '2025-09-06', 1, 'Facebook Ads Card', 1],
      [1, 190, 250, 445.75, '2025-09-05', 1, 'Facebook Ads Card', 1],
      
      // Brand Awareness Q1 data
      [2, 520, 380, 945.00, '2025-09-07', 2, 'Google Ads Card', 1],
      [2, 480, 420, 890.25, '2025-09-06', 2, 'Google Ads Card', 1],
      [2, 445, 395, 825.50, '2025-09-05', 2, 'Google Ads Card', 1],
      
      // Social Media Boost data
      [3, 150, 200, 325.00, '2025-09-07', 5, 'Social Media Card', 1],
      [3, 120, 180, 285.75, '2025-09-06', 5, 'Social Media Card', 1],
      
      // Product Launch Campaign data
      [4, 680, 520, 1250.00, '2025-09-07', 3, 'Marketing Budget Card', 1],
      [4, 620, 485, 1150.75, '2025-09-06', 3, 'Marketing Budget Card', 1],
      
      // Holiday Shopping Drive data
      [5, 890, 750, 1875.50, '2025-09-07', 4, 'Campaign Expenses Card', 1],
      [5, 820, 695, 1645.25, '2025-09-06', 4, 'Campaign Expenses Card', 1]
    ];
    
    console.log('\n🔄 Adding sample campaign data...');
    
    for (const data of sampleData) {
      try {
        await pool.execute(`
          INSERT IGNORE INTO campaign_data (campaign_id, facebook_result, xoho_result, spent, data_date, card_id, card_name, created_by) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, data);
      } catch (error) {
        console.log(`Warning: Could not insert data for campaign ${data[0]}:`, error.message);
      }
    }
    
    // Verify campaign data
    const [campaignDataCount] = await pool.execute('SELECT COUNT(*) as count FROM campaign_data');
    console.log(`✅ Campaign data entries: ${campaignDataCount[0].count}`);
    
    // Show sample data
    const [sampleEntries] = await pool.execute(`
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
      ORDER BY cd.data_date DESC 
      LIMIT 5
    `);
    
    console.log(`\n📋 Sample campaign data entries:`);
    sampleEntries.forEach(entry => {
      console.log(`  - ${entry.campaign_name}: FB: ${entry.facebook_result}, Xoho: ${entry.xoho_result}, Spent: $${entry.spent} (${entry.data_date}) [${entry.card_name}]`);
    });
    
    console.log('\n🎉 Sample campaigns and data added successfully!');
    
  } catch (error) {
    console.error('❌ Failed to add campaigns:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Run the script
addCampaigns();
