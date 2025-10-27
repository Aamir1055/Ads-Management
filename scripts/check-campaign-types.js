const { pool } = require('../config/database');

const checkAndFix = async () => {
  try {
    console.log('🔍 Checking campaign types...');
    
    // Check campaign types
    const [campaignTypes] = await pool.execute('SELECT * FROM campaign_types ORDER BY id');
    console.log(`📋 Available campaign types (${campaignTypes.length}):`, campaignTypes.map(ct => `${ct.id}: ${ct.type_name}`));
    
    // Check campaigns
    const [campaigns] = await pool.execute('SELECT * FROM campaigns ORDER BY id');
    console.log(`📋 Available campaigns (${campaigns.length}):`, campaigns.map(c => `${c.id}: ${c.name}`));
    
    if (campaigns.length === 0) {
      console.log('🔧 Adding campaigns with valid campaign_type_ids...');
      
      // Use existing campaign type IDs
      const validCampaigns = [
        ['Summer Sale 2025', 1, 'Young professionals', 'all', 25, 'USA, Canada', 'image', 1, 'TechCorp'],
        ['Brand Awareness Q1', 2, 'Tech enthusiasts', 'all', 30, 'USA', 'video', 1, 'TechCorp'],
        ['Social Media Boost', 3, 'Gen Z users', 'all', 22, 'Global', 'carousel', 1, 'LifestyleCo']
      ];
      
      for (const [name, type_id, persona, gender, age, location, creatives, is_enabled, brand] of validCampaigns) {
        try {
          const [result] = await pool.execute(`
            INSERT INTO campaigns (name, campaign_type_id, persona, gender, age, location, creatives, is_enabled, brand) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [name, type_id, persona, gender, age, location, creatives, is_enabled, brand]);
          console.log(`✅ Added campaign: ${name} (ID: ${result.insertId})`);
        } catch (error) {
          console.log(`❌ Failed to add campaign ${name}:`, error.message);
        }
      }
    }
    
    // Re-check campaigns
    const [updatedCampaigns] = await pool.execute('SELECT c.id, c.name, ct.type_name FROM campaigns c LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id ORDER BY c.id');
    console.log(`\n📋 Updated campaigns (${updatedCampaigns.length}):`);
    updatedCampaigns.forEach(campaign => {
      console.log(`  - ${campaign.id}: ${campaign.name} (${campaign.type_name})`);
    });
    
    // Check cards
    const [cards] = await pool.execute('SELECT * FROM cards ORDER BY id');
    console.log(`\n📋 Available cards (${cards.length}):`);
    cards.forEach(card => {
      console.log(`  - ${card.id}: ${card.card_name}`);
    });
    
    // Add sample campaign data if we have campaigns
    if (updatedCampaigns.length > 0) {
      console.log('\n🔧 Adding sample campaign data...');
      
      const sampleData = [
        // Campaign 1 data
        [1, 350, 420, 785.50, '2025-09-07', 1, 'Facebook Ads Card'],
        [1, 280, 310, 592.25, '2025-09-06', 1, 'Facebook Ads Card'],
        
        // Campaign 2 data
        [2, 520, 380, 945.00, '2025-09-07', 2, 'Google Ads Card'],
        [2, 480, 420, 890.25, '2025-09-06', 2, 'Google Ads Card'],
        
        // Campaign 3 data
        [3, 150, 200, 325.00, '2025-09-07', 3, 'Instagram Card'],
        [3, 120, 180, 285.75, '2025-09-06', 3, 'Instagram Card']
      ];
      
      for (const data of sampleData) {
        try {
          const [result] = await pool.execute(`
            INSERT INTO campaign_data (campaign_id, facebook_result, xoho_result, spent, data_date, card_id, card_name) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, data);
          console.log(`✅ Added campaign data entry (ID: ${result.insertId})`);
        } catch (error) {
          console.log(`ℹ️  Data might already exist or error:`, error.message);
        }
      }
    }
    
    // Final verification
    const [finalCampaignData] = await pool.execute(`
      SELECT 
        cd.id, 
        c.name as campaign_name, 
        cd.facebook_result, 
        cd.xoho_result, 
        cd.spent, 
        cd.data_date
      FROM campaign_data cd 
      LEFT JOIN campaigns c ON cd.campaign_id = c.id 
      ORDER BY cd.data_date DESC 
      LIMIT 5
    `);
    
    console.log(`\n📊 Final campaign data entries (${finalCampaignData.length}):`);
    finalCampaignData.forEach(entry => {
      console.log(`  - ${entry.campaign_name}: FB: ${entry.facebook_result}, Xoho: ${entry.xoho_result}, Spent: $${entry.spent} (${entry.data_date})`);
    });
    
    console.log('\n🎉 Check and fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
};

checkAndFix();
