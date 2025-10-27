const { pool } = require('../config/database');

const addSampleData = async () => {
  try {
    console.log('🔄 Adding sample campaign data...');
    
    // Add some sample campaigns first
    await pool.execute(`
      INSERT IGNORE INTO campaigns (name, campaign_type_id, persona, gender, age, location, creatives, is_enabled, brand, created_by) VALUES 
      ('Summer Sale 2025', 1, 'Young professionals', 'all', 25, 'USA, Canada', 'image', 1, 'TechCorp', 1),
      ('Brand Awareness Q1', 2, 'Tech enthusiasts', 'all', 30, 'USA', 'video', 1, 'TechCorp', 1),
      ('Social Media Boost', 3, 'Gen Z users', 'all', 22, 'Global', 'carousel', 1, 'LifestyleCo', 1),
      ('Product Launch Campaign', 4, 'Early adopters', 'all', 35, 'USA, UK', 'video', 1, 'InnovateTech', 1),
      ('Holiday Shopping Drive', 5, 'Families', 'all', 40, 'USA', 'collection', 1, 'RetailPlus', 1)
    `);
    console.log('✅ Sample campaigns added');
    
    // Add sample cards
    await pool.execute(`
      INSERT IGNORE INTO cards (card_name, card_number_last4, card_type, current_balance, credit_limit, is_active) VALUES 
      ('Facebook Ads Card', '1234', 'Business Credit', 5000.00, 10000.00, 1),
      ('Google Ads Card', '5678', 'Business Credit', 8000.00, 15000.00, 1),
      ('Marketing Budget Card', '9012', 'Business Debit', 12000.00, NULL, 1),
      ('Campaign Expenses Card', '3456', 'Business Credit', 3000.00, 8000.00, 1),
      ('Social Media Card', '7890', 'Business Credit', 2500.00, 5000.00, 1)
    `);
    console.log('✅ Sample cards added');
    
    // Add sample campaign data entries
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
      [3, 95, 165, 245.50, '2025-09-05', 5, 'Social Media Card', 1],
      
      // Product Launch Campaign data
      [4, 680, 520, 1250.00, '2025-09-07', 3, 'Marketing Budget Card', 1],
      [4, 620, 485, 1150.75, '2025-09-06', 3, 'Marketing Budget Card', 1],
      [4, 590, 465, 1095.25, '2025-09-05', 3, 'Marketing Budget Card', 1],
      
      // Holiday Shopping Drive data
      [5, 890, 750, 1875.50, '2025-09-07', 4, 'Campaign Expenses Card', 1],
      [5, 820, 695, 1645.25, '2025-09-06', 4, 'Campaign Expenses Card', 1],
      [5, 765, 640, 1520.75, '2025-09-05', 4, 'Campaign Expenses Card', 1],
    ];
    
    for (const data of sampleData) {
      try {
        await pool.execute(`
          INSERT IGNORE INTO campaign_data (campaign_id, facebook_result, xoho_result, spent, data_date, card_id, card_name, created_by) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, data);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.log('Warning: Could not insert data:', data, error.message);
        }
      }
    }
    
    console.log('✅ Sample campaign data added');
    
    // Verify the data
    console.log('\n📋 Verifying added data...');
    
    // Check campaign data with campaign names
    const [campaignData] = await pool.execute(`
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
    
    console.log(`\n✅ Latest campaign data entries (${campaignData.length} shown):`);
    campaignData.forEach(data => {
      console.log(`  - ${data.campaign_name}: FB: ${data.facebook_result}, Xoho: ${data.xoho_result}, Spent: $${data.spent} (${data.data_date}) [${data.card_name}]`);
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
    
    console.log('\n📊 Summary Statistics:');
    console.log(`  - Total entries: ${summary[0].total_entries}`);
    console.log(`  - Total Facebook results: ${summary[0].total_facebook_results}`);
    console.log(`  - Total Xoho results: ${summary[0].total_xoho_results}`);
    console.log(`  - Total spent: $${parseFloat(summary[0].total_spent).toFixed(2)}`);
    
    console.log('\n🎉 Sample data addition completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to add sample data:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Run the script
addSampleData();
