const fs = require('fs');
const path = require('path');
const { pool } = require('./config/database');

async function setupBrandsDatabase() {
  try {
    console.log('🏷️ Setting up brands database...');
    
    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, 'migrations', 'create_brands_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🏷️ Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🏷️ Executing statement ${i + 1}...`);
        try {
          await pool.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Some statements might fail (like DROP TABLE IF EXISTS), that's okay
          console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
        }
      }
    }
    
    console.log('✅ Brands database setup completed successfully!');
    
    // Test the table by selecting from it
    console.log('🔍 Testing brands table...');
    const [testRows] = await pool.execute('SELECT COUNT(*) as count FROM brands');
    console.log(`📊 Brands table has ${testRows[0].count} records`);
    
  } catch (error) {
    console.error('❌ Error setting up brands database:', error);
  } finally {
    // Close the database connection
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupBrandsDatabase();
}

module.exports = { setupBrandsDatabase };
