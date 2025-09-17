const { pool } = require('./config/database');
const Brand = require('./models/Brand');

async function testBrandsAPI() {
  console.log('🧪 Testing Brands API Components...\n');

  try {
    // 1. Test database connection and table structure
    console.log('1️⃣ Testing database connection...');
    const [result] = await pool.query('SELECT 1 as test');
    console.log('✅ Database connection successful');
    
    console.log('\n2️⃣ Checking brands table...');
    const [tables] = await pool.query('SHOW TABLES LIKE "brands"');
    if (tables.length === 0) {
      console.log('❌ Brands table does not exist');
      return;
    }
    console.log('✅ Brands table exists');
    
    console.log('\n3️⃣ Checking table structure...');
    const [columns] = await pool.query('DESCRIBE brands');
    console.log('📋 Table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''} ${col.Default !== null ? 'DEFAULT ' + col.Default : ''}`);
    });

    // 2. Test Brand model methods
    console.log('\n4️⃣ Testing Brand model methods...');
    
    // Clear any test data first
    await pool.query('DELETE FROM brands WHERE name LIKE "Test Brand%"');
    console.log('✅ Cleared test data');

    // Test create
    console.log('\n  📝 Testing Brand.create()...');
    const testBrandData = {
      name: 'Test Brand API',
      description: 'Test brand for API testing',
      is_active: 1,
      created_by: 1
    };
    
    const createdBrand = await Brand.create(testBrandData);
    console.log('✅ Brand created:', createdBrand.name);
    const brandId = createdBrand.id;

    // Test findById
    console.log('\n  🔍 Testing Brand.findById()...');
    const foundBrand = await Brand.findById(brandId);
    if (!foundBrand) {
      throw new Error('Brand not found by ID');
    }
    console.log('✅ Brand found by ID:', foundBrand.name);

    // Test findAll
    console.log('\n  📋 Testing Brand.findAll()...');
    const allBrands = await Brand.findAll();
    console.log(`✅ Found ${allBrands.length} total brands`);

    // Test findAll with filters
    console.log('\n  🔍 Testing Brand.findAll() with filters...');
    const activeBrands = await Brand.findAll({ isActive: 1 });
    console.log(`✅ Found ${activeBrands.length} active brands`);

    // Test getForDropdown
    console.log('\n  📋 Testing Brand.getForDropdown()...');
    const dropdownBrands = await Brand.getForDropdown();
    console.log(`✅ Found ${dropdownBrands.length} dropdown brands`);

    // Test update
    console.log('\n  ✏️ Testing Brand.update()...');
    const updateData = {
      name: 'Test Brand API Updated',
      description: 'Updated description',
      is_active: 1,
      updated_by: 1
    };
    const updatedBrand = await Brand.update(brandId, updateData);
    console.log('✅ Brand updated:', updatedBrand.name);

    // Test toggleActive
    console.log('\n  🔄 Testing Brand.toggleActive()...');
    const toggledBrand = await Brand.toggleActive(brandId, 1);
    console.log(`✅ Brand status toggled: ${toggledBrand.is_active ? 'Active' : 'Inactive'}`);

    // Test validateName
    console.log('\n  ✅ Testing Brand.validateName()...');
    const isUnique = await Brand.validateName('Unique Test Name');
    const isNotUnique = await Brand.validateName(updatedBrand.name, brandId);
    console.log(`✅ Name validation: unique name = ${isUnique}, same name excluded = ${isNotUnique}`);

    // Test getStats
    console.log('\n  📊 Testing Brand.getStats()...');
    const stats = await Brand.getStats();
    console.log('✅ Brand statistics:', stats);

    // Test delete (should be last)
    console.log('\n  🗑️ Testing Brand.delete()...');
    const deleteResult = await Brand.delete(brandId);
    console.log('✅ Brand deleted successfully');

    // Verify deletion
    const deletedBrand = await Brand.findById(brandId);
    if (deletedBrand) {
      throw new Error('Brand was not deleted properly');
    }
    console.log('✅ Deletion verified');

    console.log('\n🎉 All Brand API tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Clean up any remaining test data
    try {
      await pool.query('DELETE FROM brands WHERE name LIKE "Test Brand%"');
      console.log('\n🧹 Test data cleanup completed');
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error.message);
    }
    
    // Close database connection
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the tests
testBrandsAPI();
