const { pool } = require('./config/database');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function testDirectDatabase() {
  console.log(`${colors.blue}============================================================${colors.reset}`);
  console.log(`${colors.blue}Testing Database Direct Queries${colors.reset}`);
  console.log(`${colors.blue}============================================================${colors.reset}`);
  
  try {
    // Test the exact query from the getAll function
    console.log(`\n${colors.blue}=== Testing Updated getAll Query ===${colors.reset}`);
    const getAllQuery = `
      SELECT
        r.id,
        r.report_date,
        r.report_month,
        r.campaign_id,
        r.campaign_name,
        r.campaign_type,
        r.brand as brand_id,
        COALESCE(r.brand_name, b.name, 'Unknown Brand') as brand_name,
        r.leads,
        r.facebook_result,
        r.zoho_result,
        r.spent,
        r.cost_per_lead,
        r.created_at,
        r.updated_at
      FROM reports r
      LEFT JOIN brands b ON r.brand = b.id
      ORDER BY r.report_date DESC, r.id DESC 
      LIMIT 5
    `;
    
    const [getAllResults] = await pool.query(getAllQuery);
    console.log(`${colors.green}✓ Query successful${colors.reset} - Found ${getAllResults.length} reports`);
    
    if (getAllResults.length > 0) {
      console.log(`\n${colors.yellow}Sample results:${colors.reset}`);
      getAllResults.forEach((row, index) => {
        console.log(`${colors.yellow}Report ${index + 1}:${colors.reset}`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Campaign: ${row.campaign_name || 'N/A'}`);
        console.log(`  Brand ID: ${row.brand_id || 'N/A'}`);
        console.log(`  Brand Name: ${row.brand_name || 'N/A'} (type: ${typeof row.brand_name})`);
        console.log(`  Leads: ${row.leads || 0}`);
        console.log(`  Date: ${row.report_date}`);
        console.log('');
      });
    }
    
    // Also check brands table directly
    console.log(`${colors.blue}=== Checking Brands Table ===${colors.reset}`);
    const [brandsResults] = await pool.query('SELECT id, name, is_active FROM brands ORDER BY id');
    console.log(`${colors.green}✓ Brands query successful${colors.reset} - Found ${brandsResults.length} brands`);
    
    console.log(`${colors.yellow}Available brands:${colors.reset}`);
    brandsResults.forEach(brand => {
      console.log(`  ID: ${brand.id}, Name: ${brand.name}, Active: ${brand.is_active}`);
    });
    
    // Check if reports table has brand_name column
    console.log(`\n${colors.blue}=== Checking Reports Table Structure ===${colors.reset}`);
    const [structureResults] = await pool.query('DESCRIBE reports');
    console.log(`${colors.green}✓ Structure query successful${colors.reset}`);
    
    const brandNameCol = structureResults.find(col => col.Field === 'brand_name');
    if (brandNameCol) {
      console.log(`${colors.green}✓ brand_name column exists${colors.reset}:`, {
        Field: brandNameCol.Field,
        Type: brandNameCol.Type,
        Null: brandNameCol.Null,
        Default: brandNameCol.Default
      });
    } else {
      console.log(`${colors.red}✗ brand_name column does NOT exist${colors.reset}`);
      console.log(`${colors.yellow}Available columns:${colors.reset}`);
      structureResults.forEach(col => {
        console.log(`  ${col.Field} (${col.Type})`);
      });
    }
    
    // Check if there's data with brand_name values
    console.log(`\n${colors.blue}=== Checking brand_name Data Distribution ===${colors.reset}`);
    if (brandNameCol) {
      const [brandNameStats] = await pool.query(`
        SELECT 
          brand_name,
          COUNT(*) as count
        FROM reports 
        GROUP BY brand_name 
        ORDER BY count DESC
      `);
      
      console.log(`${colors.yellow}Brand name distribution in reports:${colors.reset}`);
      brandNameStats.forEach(stat => {
        console.log(`  "${stat.brand_name}": ${stat.count} records`);
      });
    }
    
  } catch (error) {
    console.error(`${colors.red}✗ Database test failed:${colors.reset}`, error.message);
  } finally {
    await pool.end();
  }
  
  console.log(`\n${colors.blue}============================================================${colors.reset}`);
  console.log(`${colors.green}Database test completed!${colors.reset}`);
  console.log(`${colors.blue}============================================================${colors.reset}`);
}

testDirectDatabase().catch(error => {
  console.error(`${colors.red}Test failed:${colors.reset}`, error.message);
  process.exit(1);
});
