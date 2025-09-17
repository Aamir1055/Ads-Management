const { pool } = require('./config/database');

async function createBrandsTable() {
  try {
    console.log('🏷️ Creating brands table...');
    
    // Drop existing table if it exists
    try {
      await pool.execute('DROP TABLE IF EXISTS `brands`');
      console.log('✅ Dropped existing brands table');
    } catch (error) {
      console.log('⚠️  No existing brands table to drop');
    }
    
    // Create brands table
    const createTableQuery = `
      CREATE TABLE \`brands\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`created_by\` int(11) NULL,
        \`updated_by\` int(11) NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`unique_name\` (\`name\`),
        KEY \`idx_is_active\` (\`is_active\`),
        KEY \`idx_created_by\` (\`created_by\`),
        KEY \`idx_updated_by\` (\`updated_by\`)
      ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await pool.execute(createTableQuery);
    console.log('✅ Created brands table');
    
    // Insert sample brands
    const sampleBrands = [
      ['Nike', 'Sportswear and athletic footwear brand', 1, 1],
      ['Adidas', 'German multinational corporation that designs and manufactures shoes', 1, 1],
      ['Apple', 'Technology company known for innovative products', 1, 1],
      ['Samsung', 'South Korean multinational electronics company', 1, 1],
      ['Coca-Cola', 'American multinational beverage corporation', 1, 1]
    ];
    
    const insertQuery = `INSERT INTO \`brands\` (\`name\`, \`description\`, \`is_active\`, \`created_by\`) VALUES (?, ?, ?, ?)`;
    
    for (const brand of sampleBrands) {
      try {
        await pool.execute(insertQuery, brand);
        console.log(`✅ Inserted brand: ${brand[0]}`);
      } catch (error) {
        console.log(`⚠️  Could not insert brand ${brand[0]}:`, error.message);
      }
    }
    
    // Test the table
    console.log('🔍 Testing brands table...');
    const [testRows] = await pool.execute('SELECT COUNT(*) as count FROM brands');
    console.log(`📊 Brands table has ${testRows[0].count} records`);
    
    // Show sample data
    console.log('📋 Sample brands:');
    const [brands] = await pool.execute('SELECT id, name, description, is_active FROM brands LIMIT 5');
    brands.forEach(brand => {
      console.log(`  - ${brand.id}: ${brand.name} (${brand.is_active ? 'Active' : 'Inactive'})`);
    });
    
    console.log('✅ Brands database setup completed successfully!');
    
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
  createBrandsTable();
}

module.exports = { createBrandsTable };
