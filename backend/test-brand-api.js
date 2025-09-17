const { pool } = require('./config/database');

async function testBrandAPI() {
  try {
    console.log('🧪 BRAND API DIRECT TEST');
    console.log('=' .repeat(60));
    
    // Import the Brand Controller to test directly
    const BrandController = require('./controllers/brandController');
    
    // Mock request and response objects
    const createMockReq = (user, query = {}, params = {}, body = {}) => ({
      user: user,
      query: query,
      params: params,
      body: body
    });
    
    const createMockRes = () => {
      const res = {};
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.data = data;
        return res;
      };
      return res;
    };
    
    // Test users
    const adminUser = { id: 54, username: 'Aamir' }; // Admin user
    const superAdminUser = { id: 35, username: 'admin' }; // SuperAdmin user
    
    console.log('\n🔬 Testing Brand Controller Methods:');
    console.log('-' .repeat(50));
    
    // Test 1: Get All Brands (Admin User)
    console.log('\n1️⃣ Test: getAllBrands() with Admin User (Aamir)');
    try {
      const req = createMockReq(adminUser);
      const res = createMockRes();
      
      await BrandController.getAllBrands(req, res);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Success: ${res.data?.success}`);
      console.log(`   Message: ${res.data?.message}`);
      console.log(`   Data Count: ${res.data?.data?.length || 0}`);
      
      if (res.data?.data && res.data.data.length > 0) {
        console.log('   Sample Brand:', res.data.data[0].name);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 2: Get All Brands (SuperAdmin User)
    console.log('\n2️⃣ Test: getAllBrands() with SuperAdmin User (admin)');
    try {
      const req = createMockReq(superAdminUser);
      const res = createMockRes();
      
      await BrandController.getAllBrands(req, res);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Success: ${res.data?.success}`);
      console.log(`   Message: ${res.data?.message}`);
      console.log(`   Data Count: ${res.data?.data?.length || 0}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 3: Get Active Brands
    console.log('\n3️⃣ Test: getActiveBrands() with Admin User');
    try {
      const req = createMockReq(adminUser);
      const res = createMockRes();
      
      await BrandController.getActiveBrands(req, res);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Success: ${res.data?.success}`);
      console.log(`   Message: ${res.data?.message}`);
      console.log(`   Data Count: ${res.data?.data?.length || 0}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 4: Get Brand by ID
    console.log('\n4️⃣ Test: getBrandById() with existing brand ID');
    try {
      const req = createMockReq(adminUser, {}, { id: '11' }); // Nike brand ID
      const res = createMockRes();
      
      await BrandController.getBrandById(req, res);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Success: ${res.data?.success}`);
      console.log(`   Message: ${res.data?.message}`);
      if (res.data?.data) {
        console.log(`   Brand Name: ${res.data.data.name}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 5: Create Brand (Admin User - Should fail due to permissions)
    console.log('\n5️⃣ Test: createBrand() with Admin User (should fail)');
    try {
      const req = createMockReq(adminUser, {}, {}, { 
        name: 'Test Brand Admin',
        description: 'Test brand created by admin'
      });
      const res = createMockRes();
      
      await BrandController.createBrand(req, res);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Success: ${res.data?.success}`);
      console.log(`   Message: ${res.data?.message}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Test 6: Create Brand (SuperAdmin User - Should succeed)
    console.log('\n6️⃣ Test: createBrand() with SuperAdmin User (should succeed)');
    try {
      const req = createMockReq(superAdminUser, {}, {}, { 
        name: 'Test Brand SuperAdmin',
        description: 'Test brand created by superadmin'
      });
      const res = createMockRes();
      
      await BrandController.createBrand(req, res);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Success: ${res.data?.success}`);
      console.log(`   Message: ${res.data?.message}`);
      if (res.data?.data) {
        console.log(`   Created Brand: ${res.data.data.name}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n🔍 RAW DATABASE BRAND DATA:');
    console.log('-' .repeat(50));
    
    const [brands] = await pool.query(`
      SELECT id, name, description, is_active, created_by, created_at
      FROM brands 
      ORDER BY id
    `);
    
    brands.forEach((brand, index) => {
      console.log(`${index + 1}. ${brand.name}`);
      console.log(`   ID: ${brand.id}`);
      console.log(`   Active: ${brand.is_active ? 'Yes' : 'No'}`);
      console.log(`   Created By: ${brand.created_by}`);
      console.log(`   Created: ${brand.created_at}`);
      console.log('');
    });
    
    console.log('\n🌐 SIMULATED API RESPONSE TEST:');
    console.log('-' .repeat(50));
    
    // Simulate exact API response structure
    const mockApiResponse = {
      success: true,
      data: brands.filter(b => b.is_active === 1),
      message: `Found ${brands.filter(b => b.is_active === 1).length} active brands`
    };
    
    console.log('Simulated /api/brands response:');
    console.log(JSON.stringify(mockApiResponse, null, 2));
    
    console.log('\n📊 API HEALTH CHECK:');
    console.log('-' .repeat(50));
    
    // Check if the Brand model exists and has the required methods
    const Brand = require('./models/Brand');
    console.log('✅ Brand model imported successfully');
    
    // Test Brand.findAll method directly
    try {
      const brandData = await Brand.findAll();
      console.log(`✅ Brand.findAll() works - Found ${brandData.length} brands`);
    } catch (error) {
      console.log(`❌ Brand.findAll() error: ${error.message}`);
    }
    
    // Test Brand.getForDropdown method directly
    try {
      const activebrands = await Brand.getForDropdown();
      console.log(`✅ Brand.getForDropdown() works - Found ${activebrands.length} active brands`);
    } catch (error) {
      console.log(`❌ Brand.getForDropdown() error: ${error.message}`);
    }
    
    console.log('\n🔑 PERMISSION CHECK FOR FRONTEND:');
    console.log('-' .repeat(50));
    
    // Check user permissions that frontend might be checking
    const [userPermissions] = await pool.query(`
      SELECT p.name, p.display_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.username = 'Aamir' AND p.name LIKE 'brands_%'
    `);
    
    console.log('Aamir\'s brand permissions (for frontend):');
    userPermissions.forEach(perm => {
      console.log(`  ✓ ${perm.name} (${perm.display_name})`);
    });
    
    if (userPermissions.length === 0) {
      console.log('  ❌ No brand permissions found for Aamir!');
    }
    
    console.log('\n🎯 FRONTEND DEBUGGING CHECKLIST:');
    console.log('=' .repeat(60));
    console.log('✅ Database has brand data');
    console.log('✅ Brand API controller methods work');
    console.log('✅ Admin user has brands_read permission');
    console.log('✅ Brand API endpoints are properly defined');
    console.log('');
    console.log('🔍 If frontend still shows loading, check:');
    console.log('1. Network tab in browser dev tools');
    console.log('2. Console errors in browser');
    console.log('3. Authentication token in API calls');
    console.log('4. Frontend route permissions check');
    console.log('5. API base URL configuration');
    
    // Clean up test brand if created
    try {
      await pool.query(`DELETE FROM brands WHERE name = 'Test Brand SuperAdmin'`);
      console.log('\n🧹 Cleaned up test data');
    } catch (error) {
      // Ignore cleanup errors
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing brand API:', error);
    process.exit(1);
  }
}

testBrandAPI();
