const { pool } = require('./config/database');

async function fixCampaignDataConstraints() {
  try {
    console.log('🔧 FIXING CAMPAIGN DATA FOREIGN KEY CONSTRAINTS');
    console.log('==============================================\n');

    // First, let's understand the current constraint structure
    console.log('1. Checking current foreign key constraints...');
    
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
    
    console.log('Current constraints:');
    constraints.forEach(c => {
      console.log(`   ${c.CONSTRAINT_NAME}: ${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`);
    });

    // Identify the problematic constraint
    const problemConstraint = constraints.find(c => 
      c.COLUMN_NAME === 'campaign_id' && 
      c.REFERENCED_TABLE_NAME === 'campaign_types'
    );

    if (problemConstraint) {
      console.log(`\n2. Found problematic constraint: ${problemConstraint.CONSTRAINT_NAME}`);
      console.log('   This constraint links campaign_id to campaign_types.id which is incorrect');
      console.log('   The campaign_id should reference campaigns.id, not campaign_types.id\n');

      console.log('3. Dropping incorrect foreign key constraint...');
      
      try {
        await pool.query(`ALTER TABLE campaign_data DROP FOREIGN KEY ${problemConstraint.CONSTRAINT_NAME}`);
        console.log(`✅ Successfully dropped constraint: ${problemConstraint.CONSTRAINT_NAME}`);
      } catch (error) {
        console.log(`❌ Failed to drop constraint: ${error.message}`);
        
        // If direct drop fails, let's check if constraint exists
        const [checkConstraint] = await pool.query(`
          SELECT CONSTRAINT_NAME 
          FROM information_schema.TABLE_CONSTRAINTS 
          WHERE TABLE_SCHEMA = 'ads reporting' 
          AND TABLE_NAME = 'campaign_data' 
          AND CONSTRAINT_NAME = '${problemConstraint.CONSTRAINT_NAME}'
        `);
        
        if (checkConstraint.length === 0) {
          console.log('   Constraint may have already been removed or named differently');
        }
      }

    } else {
      console.log('\n2. No problematic campaign_id -> campaign_types.id constraint found');
    }

    // Verify the remaining constraints are correct
    console.log('\n4. Checking remaining constraints...');
    const [remainingConstraints] = await pool.query(`
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
    
    console.log('Remaining constraints:');
    remainingConstraints.forEach(c => {
      console.log(`   ✅ ${c.CONSTRAINT_NAME}: ${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`);
    });

    // Check if we have the correct campaign_id -> campaigns.id constraint
    const correctCampaignConstraint = remainingConstraints.find(c => 
      c.COLUMN_NAME === 'campaign_id' && 
      c.REFERENCED_TABLE_NAME === 'campaigns'
    );

    if (correctCampaignConstraint) {
      console.log('\n✅ Good! campaign_id correctly references campaigns.id');
    } else {
      console.log('\n⚠️  Missing correct constraint: campaign_id -> campaigns.id');
      console.log('   This should be added if it doesn\'t exist');
    }

    // Test the fix by attempting a sample insert
    console.log('\n5. Testing campaign data creation with campaign_id 28...');
    
    try {
      // First check if campaign 28 and card 17 exist
      const [campaign] = await pool.query('SELECT id, name FROM campaigns WHERE id = ?', [28]);
      const [card] = await pool.query('SELECT id, name FROM cards WHERE id = ?', [17]);
      
      if (campaign.length === 0) {
        console.log('❌ Campaign 28 does not exist in campaigns table');
        return;
      }
      
      if (card.length === 0) {
        console.log('❌ Card 17 does not exist in cards table');
        return;
      }

      console.log(`✅ Campaign 28 exists: ${campaign[0].name}`);
      console.log(`✅ Card 17 exists: ${card[0].name || 'Card 17'}`);

      // Try a test insert (we'll rollback immediately)
      await pool.query('START TRANSACTION');
      
      try {
        await pool.query(`
          INSERT INTO campaign_data (campaign_id, facebook_result, xoho_result, spent, data_date, card_id, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [28, 90, 98, 90, '2025-09-13', 17, 35]);
        
        console.log('✅ SUCCESS! Campaign data can now be created with campaign_id 28');
        
        // Rollback the test insert
        await pool.query('ROLLBACK');
        console.log('   (Test insert rolled back)');
        
      } catch (insertError) {
        await pool.query('ROLLBACK');
        console.log('❌ Insert still fails:', insertError.message);
        
        if (insertError.message.includes('foreign key constraint fails')) {
          console.log('   There may be additional constraint issues to resolve');
        }
      }
      
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }

    console.log('\n🎉 CONSTRAINT FIX COMPLETE!');
    console.log('The campaign_data table should now accept campaign_id 28');
    console.log('Try creating campaign data again in the frontend.');

  } catch (error) {
    console.error('❌ Error fixing constraints:', error);
  } finally {
    await pool.end();
  }
}

fixCampaignDataConstraints();
