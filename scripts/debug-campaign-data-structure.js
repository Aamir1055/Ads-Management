const { pool } = require('../config/database');

async function checkTableStructure() {
  try {
    console.log('=== CAMPAIGN_DATA TABLE STRUCTURE ===');
    const [structure] = await pool.execute('DESCRIBE campaign_data');
    structure.forEach(col => {
      console.log(`${col.Field} | ${col.Type} | ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} | Key: ${col.Key}`);
    });
    
    console.log('\n=== FOREIGN KEY CONSTRAINTS ===');
    const [constraints] = await pool.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'campaign_data' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (constraints.length === 0) {
      console.log('No foreign key constraints found');
    } else {
      constraints.forEach(c => {
        console.log(`Column: ${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`);
      });
    }
    
    // Test if the values in our test exist
    console.log('\n=== CHECKING TEST DATA VALIDITY ===');
    
    // Check campaign_id=11
    const [campaignCheck] = await pool.execute('SELECT id, name FROM campaigns WHERE id = 11');
    console.log(`Campaign ID 11: ${campaignCheck.length > 0 ? 'EXISTS - ' + campaignCheck[0].name : 'NOT FOUND'}`);
    
    // Check card_id=1
    const [cardCheck] = await pool.execute('SELECT id, card_name FROM cards WHERE id = 1');
    console.log(`Card ID 1: ${cardCheck.length > 0 ? 'EXISTS - ' + cardCheck[0].card_name : 'NOT FOUND'}`);
    
    // Check if there are any other constraints that might be failing
    console.log('\n=== TESTING INSERT ===');
    const testData = {
      campaign_id: 11,
      facebook_result: 450,
      xoho_result: 380,
      spent: 675.50,
      data_date: '2025-09-08',
      card_id: 1,
      card_name: 'Facebook Ads Card',
      created_by: 1
    };
    
    try {
      const [testResult] = await pool.execute(`
        INSERT INTO campaign_data 
        (campaign_id, facebook_result, xoho_result, spent, data_date, card_id, card_name, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [testData.campaign_id, testData.facebook_result, testData.xoho_result, testData.spent, testData.data_date, testData.card_id, testData.card_name, testData.created_by]);
      
      console.log(`✅ Test insert successful! ID: ${testResult.insertId}`);
      
      // Clean up the test data
      await pool.execute('DELETE FROM campaign_data WHERE id = ?', [testResult.insertId]);
      console.log('✅ Test data cleaned up');
      
    } catch (error) {
      console.log(`❌ Test insert failed: ${error.message}`);
      console.log(`Error code: ${error.code}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTableStructure();
