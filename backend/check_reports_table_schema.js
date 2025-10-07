require('dotenv').config();
const { pool } = require('./config/database');

const checkReportsTableSchema = async () => {
  try {
    console.log('🔍 Checking Reports Table Schema...\n');
    
    // Get table structure
    const [columns] = await pool.query('DESCRIBE reports');
    
    console.log('📋 Reports Table Columns:');
    columns.forEach(col => {
      console.log(`  • ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `(default: ${col.Default})` : ''}`);
    });
    
    console.log('\n🔍 Checking if brand_name column exists:');
    const brandNameExists = columns.some(col => col.Field === 'brand_name');
    console.log(`brand_name column exists: ${brandNameExists}`);
    
    // Get a sample record to see actual data
    console.log('\n📊 Sample Records:');
    const [sampleRecords] = await pool.query('SELECT * FROM reports LIMIT 3');
    
    if (sampleRecords.length > 0) {
      console.log('First record fields:');
      Object.keys(sampleRecords[0]).forEach(key => {
        console.log(`  • ${key}: ${sampleRecords[0][key]} (${typeof sampleRecords[0][key]})`);
      });
      
      if (sampleRecords.length > 1) {
        console.log('\nSecond record brand info:');
        const record2 = sampleRecords[1];
        console.log(`  • campaign_name: ${record2.campaign_name}`);
        console.log(`  • brand: ${record2.brand} (ID)`);
        console.log(`  • brand_name: ${record2.brand_name || 'NOT FOUND'}`);
      }
    }
    
    // Check if there's any data and get brand info
    console.log('\n🏢 Brand Information Check:');
    const [brandCheck] = await pool.query(`
      SELECT 
        r.campaign_name,
        r.brand as brand_id,
        r.brand_name,
        b.name as actual_brand_name
      FROM reports r 
      LEFT JOIN brands b ON r.brand = b.id 
      LIMIT 5
    `);
    
    brandCheck.forEach((record, index) => {
      console.log(`${index + 1}. Campaign: ${record.campaign_name}`);
      console.log(`   - Brand ID: ${record.brand_id}`);
      console.log(`   - brand_name field: ${record.brand_name || 'NULL'}`);
      console.log(`   - actual_brand_name from join: ${record.actual_brand_name}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
};

checkReportsTableSchema();
