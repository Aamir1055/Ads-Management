const { pool } = require('./config/database');

async function checkCampaignTypes() {
  try {
    console.log('🔍 CHECKING CAMPAIGN TYPES TABLE:');
    console.log('================================\n');

    // Get all campaign types
    const [types] = await pool.query('SELECT * FROM campaign_types ORDER BY id');
    console.log('Available campaign types:');
    if (types.length === 0) {
      console.log('❌ NO campaign types found in database!');
    } else {
      types.forEach(t => {
        const name = t.name || t.type_name || t.campaign_name || 'No name';
        const status = t.is_active ? 'Active' : 'Inactive';
        console.log(`  ID ${t.id}: ${name} (${status})`);
      });
    }
    console.log(`\nTotal campaign types: ${types.length}`);

    // Check for campaign_id 28 specifically
    console.log('\n🔍 CHECKING FOR CAMPAIGN_ID 28:');
    const [specific] = await pool.query('SELECT * FROM campaign_types WHERE id = ?', [28]);
    if (specific.length > 0) {
      console.log('✅ Campaign type 28 exists:', specific[0]);
    } else {
      console.log('❌ Campaign type 28 does NOT exist');
    }

    // Check what IDs are actually available
    if (types.length > 0) {
      console.log('\n📋 Available campaign type IDs:');
      const ids = types.map(t => t.id);
      console.log(`   IDs: [${ids.join(', ')}]`);
      console.log(`   Range: ${Math.min(...ids)} - ${Math.max(...ids)}`);
    }

    // Check campaign_data table structure and constraints
    console.log('\n🔍 CHECKING CAMPAIGN_DATA TABLE CONSTRAINTS:');
    try {
      const [constraints] = await pool.query(`
        SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = 'ads reporting' 
        AND TABLE_NAME = 'campaign_data' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      
      console.log('Foreign key constraints:');
      constraints.forEach(c => {
        console.log(`  ${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`);
      });

    } catch (error) {
      console.log('⚠️  Could not check constraints:', error.message);
    }

    // Check recent campaign_data entries to see what campaign_ids are being used
    console.log('\n🔍 CHECKING RECENT CAMPAIGN_DATA ENTRIES:');
    try {
      const [recentData] = await pool.query(`
        SELECT DISTINCT campaign_id, COUNT(*) as count
        FROM campaign_data 
        GROUP BY campaign_id 
        ORDER BY campaign_id DESC 
        LIMIT 10
      `);
      
      console.log('Recent campaign_ids used in campaign_data:');
      if (recentData.length === 0) {
        console.log('   No campaign data entries found');
      } else {
        recentData.forEach(d => {
          console.log(`   Campaign ID ${d.campaign_id}: ${d.count} entries`);
        });
      }
    } catch (error) {
      console.log('⚠️  Could not check campaign data:', error.message);
    }

    // Check campaigns table since there are dual constraints
    console.log('\n🔍 CHECKING CAMPAIGNS TABLE:');
    try {
      const [campaigns] = await pool.query('SELECT * FROM campaigns ORDER BY id LIMIT 10');
      console.log('Available campaigns:');
      if (campaigns.length === 0) {
        console.log('   No campaigns found');
      } else {
        campaigns.forEach(c => {
          const name = c.name || c.campaign_name || c.title || 'No name';
          console.log(`   ID ${c.id}: ${name} (Active: ${c.is_active !== 0})`);
        });
      }
      
      const [camp28] = await pool.query('SELECT * FROM campaigns WHERE id = ?', [28]);
      if (camp28.length > 0) {
        console.log('\n✅ Campaign 28 exists in campaigns table:', camp28[0]);
      } else {
        console.log('\n❌ Campaign 28 does NOT exist in campaigns table either');
      }
    } catch (error) {
      console.log('⚠️  Could not check campaigns:', error.message);
    }

  } catch (error) {
    console.error('❌ Error checking campaign types:', error);
  } finally {
    await pool.end();
  }
}

checkCampaignTypes();
