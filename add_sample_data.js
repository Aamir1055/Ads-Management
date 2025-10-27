const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your MySQL password if needed
  database: 'ads reporting'
};

async function addSampleData() {
  let connection;
  
  try {
    console.log('🚀 Adding sample data to ensure modules display content...\n');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');
    
    // 1. Ensure we have brands
    console.log('\n🏷️ Checking/Adding brand data...');
    const [existingBrands] = await connection.execute('SELECT COUNT(*) as count FROM brands');
    
    if (existingBrands[0].count < 3) {
      const sampleBrands = [
        ['Sample Brand 1', 'This is a sample brand for testing', '#FF5722', 'https://example.com/logo1.png', 1],
        ['Sample Brand 2', 'Another sample brand', '#2196F3', 'https://example.com/logo2.png', 1],
        ['Test Brand', 'Test brand for development', '#4CAF50', 'https://example.com/logo3.png', 1]
      ];
      
      for (const brand of sampleBrands) {
        try {
          await connection.execute(`
            INSERT IGNORE INTO brands (name, description, brand_color, logo_url, is_active)
            VALUES (?, ?, ?, ?, ?)
          `, brand);
        } catch (error) {
          console.log(`   - Skipping brand due to error:`, error.message);
        }
      }
      console.log('✅ Sample brands added');
    } else {
      console.log('✅ Brands already exist');
    }
    
    // 2. Ensure we have campaigns
    console.log('\n📊 Checking/Adding campaign data...');
    const [existingCampaigns] = await connection.execute('SELECT COUNT(*) as count FROM campaigns');
    
    if (existingCampaigns[0].count < 3) {
      // First get a brand ID and campaign type ID
      const [brands] = await connection.execute('SELECT id FROM brands LIMIT 1');
      const [campaignTypes] = await connection.execute('SELECT id FROM campaign_types LIMIT 1');
      
      if (brands.length > 0 && campaignTypes.length > 0) {
        const sampleCampaigns = [
          ['Sample Campaign 1', 'Marketing Persona A', 'Active campaign for testing', brands[0].id, campaignTypes[0].id, 1000.00, 1],
          ['Sample Campaign 2', 'Marketing Persona B', 'Another test campaign', brands[0].id, campaignTypes[0].id, 1500.00, 1],
          ['Test Campaign', 'Test Persona', 'Development test campaign', brands[0].id, campaignTypes[0].id, 500.00, 1]
        ];
        
        for (const campaign of sampleCampaigns) {
          try {
            await connection.execute(`
              INSERT IGNORE INTO campaigns (name, persona, description, brand_id, campaign_type_id, budget, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, campaign);
          } catch (error) {
            console.log(`   - Skipping campaign due to error:`, error.message);
          }
        }
        console.log('✅ Sample campaigns added');
      } else {
        console.log('❌ Cannot add campaigns - missing brands or campaign types');
      }
    } else {
      console.log('✅ Campaigns already exist');
    }
    
    // 3. Ensure we have cards
    console.log('\n💳 Checking/Adding card data...');
    const [existingCards] = await connection.execute('SELECT COUNT(*) as count FROM cards');
    
    if (existingCards[0].count < 3) {
      const sampleCards = [
        ['Sample Card 1', '1234', 'Visa', 1000.00, null, 1],
        ['Sample Card 2', '5678', 'MasterCard', 2000.00, null, 1],
        ['Test Card', '9999', 'Amex', 1500.00, null, 1]
      ];
      
      for (const card of sampleCards) {
        try {
          await connection.execute(`
            INSERT IGNORE INTO cards (card_name, card_number_last4, card_type, current_balance, credit_limit, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
          `, card);
        } catch (error) {
          console.log(`   - Skipping card due to error:`, error.message);
        }
      }
      console.log('✅ Sample cards added');
    } else {
      console.log('✅ Cards already exist');
    }
    
    // 4. Ensure we have campaign types
    console.log('\n📝 Checking/Adding campaign type data...');
    const [existingCampaignTypes] = await connection.execute('SELECT COUNT(*) as count FROM campaign_types');
    
    if (existingCampaignTypes[0].count < 3) {
      const sampleCampaignTypes = [
        ['Social Media', 'Facebook and Instagram campaigns', 1],
        ['Google Ads', 'Google search and display campaigns', 1],
        ['Email Marketing', 'Email marketing campaigns', 1]
      ];
      
      for (const campaignType of sampleCampaignTypes) {
        try {
          await connection.execute(`
            INSERT IGNORE INTO campaign_types (type_name, description, is_active)
            VALUES (?, ?, ?)
          `, campaignType);
        } catch (error) {
          console.log(`   - Skipping campaign type due to error:`, error.message);
        }
      }
      console.log('✅ Sample campaign types added');
    } else {
      console.log('✅ Campaign types already exist');
    }
    
    // 5. Ensure we have campaign data
    console.log('\n📈 Checking/Adding campaign performance data...');
    const [existingCampaignData] = await connection.execute('SELECT COUNT(*) as count FROM campaign_data');
    
    if (existingCampaignData[0].count < 3) {
      // Get campaign and card IDs
      const [campaigns] = await connection.execute('SELECT id FROM campaigns LIMIT 3');
      const [cards] = await connection.execute('SELECT id FROM cards LIMIT 1');
      
      if (campaigns.length > 0 && cards.length > 0) {
        for (let i = 0; i < Math.min(campaigns.length, 3); i++) {
          try {
            await connection.execute(`
              INSERT IGNORE INTO campaign_data (campaign_id, facebook_result, xoho_result, spent, data_date, card_id)
              VALUES (?, ?, ?, ?, CURDATE() - INTERVAL ? DAY, ?)
            `, [campaigns[i].id, 100 + (i * 50), 50 + (i * 25), 200 + (i * 100), i, cards[0].id]);
          } catch (error) {
            console.log(`   - Skipping campaign data due to error:`, error.message);
          }
        }
        console.log('✅ Sample campaign data added');
      } else {
        console.log('❌ Cannot add campaign data - missing campaigns or cards');
      }
    } else {
      console.log('✅ Campaign data already exists');
    }
    
    // 6. Final verification - count all records
    console.log('\n📊 Final data count verification...');
    
    const tables = ['brands', 'campaigns', 'cards', 'campaign_types', 'campaign_data', 'users'];
    
    for (const table of tables) {
      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${count[0].count} records`);
      } catch (error) {
        console.log(`   ${table}: ERROR - ${error.message}`);
      }
    }
    
    console.log('\n🎉 Sample data addition completed!');
    console.log('💡 If modules are still blank, the issue is likely:');
    console.log('   1. Frontend authentication/token problems');
    console.log('   2. Frontend API calling issues');
    console.log('   3. React component rendering problems');
    console.log('   4. Permission/authorization issues');
    
    console.log('\n🔧 Next steps:');
    console.log('   1. Run the browser debug script in your browser console');
    console.log('   2. Check browser Network tab for failed API requests');
    console.log('   3. Check browser Console tab for JavaScript errors');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

addSampleData();
