const mysql = require('mysql2/promise');
const config = { host: 'localhost', user: 'root', password: '', database: 'ads reporting' };

(async () => {
  try {
    const connection = await mysql.createConnection(config);
    console.log('=== Testing Brand Resolution Logic ===\n');
    
    // Step 1: Check what's in campaigns table
    console.log('1. Campaigns table data:');
    const [campaigns] = await connection.query(`
      SELECT id, name, brand as brand_id 
      FROM campaigns 
      WHERE id IN (SELECT DISTINCT campaign_id FROM campaign_data)
    `);
    console.table(campaigns);
    
    // Step 2: Check what's in brands table  
    console.log('2. Brands table data:');
    const [brands] = await connection.query('SELECT id, name FROM brands ORDER BY id');
    console.table(brands);
    
    // Step 3: Test the exact JOIN logic
    console.log('3. Testing JOIN logic:');
    const [joinResult] = await connection.query(`
      SELECT 
        c.id as campaign_id,
        c.name as campaign_name,
        c.brand as stored_brand_id,
        b.id as resolved_brand_id,
        b.name as resolved_brand_name
      FROM campaigns c 
      LEFT JOIN brands b ON c.brand = b.id 
      WHERE c.id IN (SELECT DISTINCT campaign_id FROM campaign_data)
    `);
    console.table(joinResult);
    
    // Step 4: Test the full query from campaign_data
    console.log('4. Full query with campaign_data (should match our backend):');
    const [fullQuery] = await connection.query(`
      SELECT
        cd.id,
        cd.campaign_id,
        c.name as campaign_name,
        c.brand as campaign_brand_id,
        b.id as brand_table_id,
        b.name as brand_name,
        cd.facebook_result,
        cd.xoho_result,
        (cd.facebook_result + cd.xoho_result) as calculated_leads,
        cd.spent,
        CASE 
          WHEN (cd.facebook_result + cd.xoho_result) > 0 
          THEN cd.spent / (cd.facebook_result + cd.xoho_result)
          ELSE NULL 
        END as calculated_cost_per_lead
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN brands b ON c.brand = b.id
      ORDER BY cd.data_date DESC
      LIMIT 5
    `);
    
    console.log('Full query results:');
    fullQuery.forEach((row, idx) => {
      console.log(`\nRow ${idx + 1}:`);
      console.log(`  Campaign: ${row.campaign_name} (ID: ${row.campaign_id})`);
      console.log(`  Brand ID in campaigns: ${row.campaign_brand_id}`);
      console.log(`  Brand ID from brands table: ${row.brand_table_id}`);
      console.log(`  Brand name: "${row.brand_name}"`);
      console.log(`  Facebook: ${row.facebook_result}, Xoho: ${row.xoho_result}`);
      console.log(`  Calculated leads: ${row.calculated_leads}`);
      console.log(`  Spent: ${row.spent}`);
      console.log(`  Calculated cost per lead: ${row.calculated_cost_per_lead}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error);
  }
})();
