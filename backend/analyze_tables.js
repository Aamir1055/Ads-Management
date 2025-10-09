const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ads reporting',
  charset: 'utf8mb4'
};

async function analyzeTables() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Analyzing tables for report structure...\n');
    
    // Check campaign_data table structure
    console.log('=== CAMPAIGN_DATA TABLE STRUCTURE ===');
    const [campaignDataStructure] = await connection.execute('DESCRIBE campaign_data');
    console.table(campaignDataStructure);
    
    console.log('\n=== SAMPLE CAMPAIGN_DATA RECORDS ===');
    const [campaignDataSamples] = await connection.execute(`
      SELECT * FROM campaign_data 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    console.table(campaignDataSamples);
    
    // Check if facebook_results table exists
    console.log('\n=== CHECKING FACEBOOK_RESULTS TABLE ===');
    try {
      const [facebookResultsStructure] = await connection.execute('DESCRIBE facebook_results');
      console.log('Facebook Results table structure:');
      console.table(facebookResultsStructure);
      
      console.log('\n=== SAMPLE FACEBOOK_RESULTS RECORDS ===');
      const [facebookResultsSamples] = await connection.execute(`
        SELECT * FROM facebook_results 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      console.table(facebookResultsSamples);
    } catch (error) {
      console.log('❌ facebook_results table does not exist');
      console.log('Error:', error.message);
    }
    
    // Check available tables that might contain Facebook data
    console.log('\n=== AVAILABLE TABLES ===');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('Available tables:', tableNames);
    
    // Look for tables with 'facebook' or 'result' in name
    const facebookTables = tableNames.filter(name => 
      name.toLowerCase().includes('facebook') || 
      name.toLowerCase().includes('result')
    );
    
    if (facebookTables.length > 0) {
      console.log('\n=== FACEBOOK/RESULT RELATED TABLES ===');
      for (const tableName of facebookTables) {
        try {
          console.log(`\n--- ${tableName.toUpperCase()} ---`);
          const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
          console.table(structure);
          
          const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`Records: ${count[0].count}`);
        } catch (error) {
          console.log(`Error analyzing ${tableName}:`, error.message);
        }
      }
    }
    
    // Check what columns exist in campaign_data related to our requirements
    console.log('\n=== CAMPAIGN_DATA COLUMNS ANALYSIS ===');
    const columnNames = campaignDataStructure.map(col => col.Field);
    const requiredColumns = ['created_at', 'updated_at', 'spent', 'facebook_result', 'zoho_result'];
    
    console.log('Looking for required columns:');
    requiredColumns.forEach(col => {
      const exists = columnNames.includes(col);
      console.log(`  ${col}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
    // Check for similar column names
    console.log('\nAll columns in campaign_data:');
    columnNames.forEach(col => {
      console.log(`  • ${col}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

analyzeTables().catch(console.error);