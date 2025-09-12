const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
  try {
    console.log('🔄 Starting campaign data tables migration...');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../migrations/create_campaign_data_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
      
      try {
        await pool.execute(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️  Statement ${i + 1} skipped (duplicate entry)`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }
    
    // Verify the data
    console.log('\n📋 Verifying created tables and data...');
    
    // Check campaigns
    const [campaigns] = await pool.execute('SELECT c.id, c.campaign_name, ct.type_name FROM campaigns c LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id ORDER BY c.id');
    console.log(`✅ Campaigns table: ${campaigns.length} records`);
    campaigns.forEach(campaign => {
      console.log(`  - ${campaign.id}: ${campaign.campaign_name} (${campaign.type_name})`);
    });
    
    // Check cards
    const [cards] = await pool.execute('SELECT * FROM cards ORDER BY id');
    console.log(`\n✅ Cards table: ${cards.length} records`);
    cards.forEach(card => {
      console.log(`  - ${card.id}: ${card.card_name} (${card.card_code})`);
    });
    
    // Check campaign_data
    const [campaignData] = await pool.execute(`
      SELECT cd.id, c.campaign_name, cd.facebook_result, cd.xoho_result, cd.spent, cd.data_date, cd.card_name 
      FROM campaign_data cd 
      LEFT JOIN campaigns c ON cd.campaign_id = c.id 
      ORDER BY cd.id
    `);
    console.log(`\n✅ Campaign data table: ${campaignData.length} records`);
    campaignData.forEach(data => {
      console.log(`  - ${data.id}: ${data.campaign_name} - FB: ${data.facebook_result}, Xoho: ${data.xoho_result}, Spent: $${data.spent} (${data.data_date})`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Run migration
runMigration();
