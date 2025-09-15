const { pool } = require('./config/database');

(async () => {
  try {
    console.log('Checking reports table structure and data...\n');
    
    // Get table structure
    const [structure] = await pool.query('DESCRIBE reports');
    console.log('Reports table structure:');
    structure.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Get sample data
    const [sample] = await pool.query('SELECT * FROM reports LIMIT 1');
    console.log('\nSample data:');
    if (sample.length > 0) {
      console.log(JSON.stringify(sample[0], null, 2));
    } else {
      console.log('No data found in reports table');
    }
    
    // Count total records
    const [count] = await pool.query('SELECT COUNT(*) as total FROM reports');
    console.log(`\nTotal records in reports table: ${count[0].total}`);
    
    // Check if created_by column exists (needed for user filtering)
    const hasCreatedBy = structure.some(col => col.Field === 'created_by');
    console.log(`Has created_by column: ${hasCreatedBy}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
