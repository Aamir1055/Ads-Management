const { pool } = require('../config/database');

async function cleanupCampaignTypes() {
  let connection;
  
  try {
    console.log('🔄 Cleaning up campaign types - deactivating test/development types...');
    connection = await pool.getConnection();
    
    await connection.beginTransaction();
    
    // Deactivate test/development campaign types
    const testTypesToDeactivate = [
      'Updated Test Type',           // id=1 - clearly a test
      'Updated Test Campaign Type',  // id=7 - already inactive
      'JustChecking',               // id=9 - already inactive  
      'Check',                      // id=10 - already inactive
      'EmailUpdatedtwice',          // id=12 - already inactive
      'Check12',                    // id=14 - appears to be a test
      'New',                        // id=15 - generic name, likely test
      'Test',                       // id=16 - already inactive
      'iii',                        // id=17 - already inactive 
      'jhgf'                        // id=18 - already inactive
    ];
    
    // Keep only business-relevant campaign types active
    const businessTypesToKeepActive = [
      'Display',      // id=2
      'Social Media', // id=3  
      'Video',        // id=4
      'Shopping',     // id=5
      'Email'         // id=6
    ];
    
    console.log('Deactivating test campaign types...');
    for (const typeName of testTypesToDeactivate) {
      const [result] = await connection.execute(
        'UPDATE campaign_types SET is_active = 0 WHERE type_name = ?',
        [typeName]
      );
      if (result.affectedRows > 0) {
        console.log(`✅ Deactivated: ${typeName}`);
      }
    }
    
    console.log('Ensuring business campaign types are active...');
    for (const typeName of businessTypesToKeepActive) {
      const [result] = await connection.execute(
        'UPDATE campaign_types SET is_active = 1 WHERE type_name = ?',
        [typeName]
      );
      if (result.affectedRows > 0) {
        console.log(`✅ Activated: ${typeName}`);
      }
    }
    
    // Show final active campaign types
    const [activeTypes] = await connection.execute(`
      SELECT id, type_name, is_active
      FROM campaign_types 
      WHERE is_active = 1
      ORDER BY type_name
    `);
    
    console.log('\n📋 Final active campaign types:');
    activeTypes.forEach(type => {
      console.log(`  - ${type.type_name} (id: ${type.id})`);
    });
    
    await connection.commit();
    console.log('\n✅ Campaign types cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    if (connection) {
      await connection.rollback();
    }
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

cleanupCampaignTypes();
