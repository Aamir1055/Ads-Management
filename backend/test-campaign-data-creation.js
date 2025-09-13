const { pool } = require('./config/database');

async function testCampaignDataCreation() {
  try {
    console.log('🧪 TESTING CAMPAIGN DATA CREATION');
    console.log('==================================\n');

    console.log('1. Checking if required records exist...');
    
    // Check campaign 28
    const [campaigns] = await pool.query('SELECT id, name FROM campaigns WHERE id = ?', [28]);
    if (campaigns.length === 0) {
      console.log('❌ Campaign 28 not found');
      return;
    }
    console.log(`✅ Campaign 28 found: ${campaigns[0].name}`);
    
    // Check card 17 (check different possible column names)
    const [cards] = await pool.query('SELECT * FROM cards WHERE id = ?', [17]);
    if (cards.length === 0) {
      console.log('❌ Card 17 not found');
      return;
    }
    const cardName = cards[0].name || cards[0].card_name || cards[0].title || 'Card 17';
    console.log(`✅ Card 17 found: ${cardName}`);
    
    // Check user 35 (admin)
    const [users] = await pool.query('SELECT id, username FROM users WHERE id = ?', [35]);
    if (users.length === 0) {
      console.log('❌ User 35 not found');
      return;
    }
    console.log(`✅ User 35 found: ${users[0].username}`);

    console.log('\n2. Testing campaign data insertion...');
    
    // Start transaction for test
    await pool.query('START TRANSACTION');
    
    try {
      const insertResult = await pool.query(`
        INSERT INTO campaign_data (
          campaign_id, 
          facebook_result, 
          xoho_result, 
          spent, 
          data_date, 
          card_id, 
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [28, 90, 98, 90, '2025-09-13', 17, 35]);
      
      console.log('✅ SUCCESS! Campaign data inserted successfully');
      console.log(`   New record ID: ${insertResult[0].insertId}`);
      
      // Verify the insert
      const [verification] = await pool.query('SELECT * FROM campaign_data WHERE id = ?', [insertResult[0].insertId]);
      if (verification.length > 0) {
        console.log('✅ Verification: Record exists in database');
        console.log('   Campaign ID:', verification[0].campaign_id);
        console.log('   Card ID:', verification[0].card_id);
        console.log('   Facebook Result:', verification[0].facebook_result);
        console.log('   Zoho Result:', verification[0].xoho_result);
        console.log('   Date:', verification[0].data_date);
      }
      
      // Rollback the test insert
      await pool.query('ROLLBACK');
      console.log('\n✅ Test insert rolled back (database unchanged)');
      
    } catch (insertError) {
      await pool.query('ROLLBACK');
      console.log('❌ Insert failed:', insertError.message);
      
      if (insertError.message.includes('foreign key constraint fails')) {
        console.log('   Foreign key constraint issue still exists');
        
        // Let's see which constraint is failing
        const constraintMatch = insertError.message.match(/CONSTRAINT `([^`]+)`/);
        if (constraintMatch) {
          console.log(`   Failing constraint: ${constraintMatch[1]}`);
        }
      }
      return;
    }

    console.log('\n🎉 TEST PASSED!');
    console.log('Campaign data creation is now working correctly.');
    console.log('The frontend should be able to create campaign data with campaign_id 28.');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await pool.end();
  }
}

testCampaignDataCreation();
