const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your MySQL password if needed
  database: 'ads reporting'
};

async function diagnoseProblem() {
  let connection;
  
  try {
    console.log('🔍 Diagnosing blank modules issue...\n');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');
    
    // 1. Check if we have actual data in key tables
    console.log('\n📊 Checking data in key tables...\n');
    
    // Check brands data
    const [brands] = await connection.execute('SELECT COUNT(*) as count FROM brands');
    console.log(`Brands table: ${brands[0].count} records`);
    
    // Check users
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`Users table: ${users[0].count} records`);
    
    // Check campaigns
    const [campaigns] = await connection.execute('SELECT COUNT(*) as count FROM campaigns');
    console.log(`Campaigns table: ${campaigns[0].count} records`);
    
    // Check cards
    const [cards] = await connection.execute('SELECT COUNT(*) as count FROM cards');
    console.log(`Cards table: ${cards[0].count} records`);
    
    // Check campaign_data
    const [campaignData] = await connection.execute('SELECT COUNT(*) as count FROM campaign_data');
    console.log(`Campaign data table: ${campaignData[0].count} records`);
    
    // Check campaign_types
    const [campaignTypes] = await connection.execute('SELECT COUNT(*) as count FROM campaign_types');
    console.log(`Campaign types table: ${campaignTypes[0].count} records`);
    
    // 2. Test if we can get sample data from each table
    console.log('\n🔍 Testing sample data retrieval...\n');
    
    const tables = ['brands', 'users', 'campaigns', 'cards', 'campaign_data', 'campaign_types'];
    
    for (const table of tables) {
      try {
        const [sampleData] = await connection.execute(`SELECT * FROM ${table} LIMIT 1`);
        console.log(`✅ ${table}: ${sampleData.length > 0 ? 'HAS DATA' : 'EMPTY'}`);
        
        if (sampleData.length > 0) {
          const sampleRecord = sampleData[0];
          const keys = Object.keys(sampleRecord).slice(0, 3); // Show first 3 fields
          console.log(`   Sample fields: ${keys.join(', ')}`);
        }
      } catch (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
      }
    }
    
    // 3. Check if tables have the expected structure
    console.log('\n🏗️  Checking table structures...\n');
    
    for (const table of tables) {
      try {
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        const primaryKey = columns.find(col => col.Key === 'PRI');
        const activeField = columns.find(col => col.Field === 'is_active');
        
        console.log(`${table}:`);
        console.log(`   Primary key: ${primaryKey ? primaryKey.Field : 'NONE'}`);
        console.log(`   Has is_active: ${activeField ? 'YES' : 'NO'}`);
        console.log(`   Total columns: ${columns.length}`);
      } catch (error) {
        console.log(`❌ ${table} structure: ${error.message}`);
      }
    }
    
    // 4. Check authentication-related issues
    console.log('\n🔐 Checking authentication data...\n');
    
    const [activeUsers] = await connection.execute(`
      SELECT u.id, u.username, r.name as role_name, u.is_active
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.is_active = 1
      ORDER BY u.id
    `);
    
    console.log(`Active users: ${activeUsers.length}`);
    activeUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.role_name})`);
    });
    
    // 5. Check for common API issues
    console.log('\n🔍 Potential issues to check:\n');
    
    // Check if brands table has any active records
    const [activeBrands] = await connection.execute(`
      SELECT COUNT(*) as count FROM brands WHERE is_active = 1
    `);
    console.log(`Active brands: ${activeBrands[0].count}`);
    
    // Check if any campaigns exist
    const [activeCampaigns] = await connection.execute(`
      SELECT COUNT(*) as count FROM campaigns WHERE is_active = 1
    `);
    console.log(`Active campaigns: ${activeCampaigns[0].count}`);
    
    // Summary
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (brands[0].count === 0) {
      console.log('❌ BRANDS table is empty - this could cause blank brand module');
    }
    
    if (campaigns[0].count === 0) {
      console.log('❌ CAMPAIGNS table is empty - this could cause blank campaign module');
    }
    
    if (cards[0].count === 0) {
      console.log('❌ CARDS table is empty - this could cause blank cards module');
    }
    
    if (campaignData[0].count === 0) {
      console.log('❌ CAMPAIGN_DATA table is empty - this could cause blank data module');
    }
    
    if (activeUsers.length === 0) {
      console.log('❌ NO active users - authentication might fail');
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (brands[0].count === 0) {
      console.log('1. Create some sample brand records');
    }
    if (campaigns[0].count === 0) {
      console.log('2. Create some sample campaign records');
    }
    if (cards[0].count === 0) {
      console.log('3. Create some sample card records');
    }
    
    console.log('\n✅ Frontend troubleshooting steps:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Check Network tab for failed API requests');
    console.log('3. Verify authentication token is being sent');
    console.log('4. Check if CORS errors are occurring');
    
  } catch (error) {
    console.error('❌ Diagnosis error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

diagnoseProblem();
