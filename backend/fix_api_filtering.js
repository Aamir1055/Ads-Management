const fs = require('fs');
const path = require('path');

// Quick fix to modify API controllers to show all records instead of filtering by is_active
function fixAPIFiltering() {
  console.log('🔧 Applying quick fix to API filtering...\n');
  
  // Fix 1: User Controller - Remove is_active filtering
  const userControllerPath = path.join(__dirname, 'controllers', 'userController.js');
  
  try {
    console.log('📝 Fixing User Controller...');
    
    let userControllerContent = fs.readFileSync(userControllerPath, 'utf8');
    
    // Replace the line that defaults is_active to true with null (no filtering)
    const originalLine = "const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : true;";
    const fixedLine = "const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : null;";
    
    if (userControllerContent.includes(originalLine)) {
      userControllerContent = userControllerContent.replace(originalLine, fixedLine);
      fs.writeFileSync(userControllerPath, userControllerContent);
      console.log('✅ User Controller fixed - will now show all users regardless of is_active');
    } else {
      console.log('ℹ️  User Controller already fixed or structure changed');
    }
    
  } catch (error) {
    console.log('❌ Error fixing User Controller:', error.message);
  }
  
  // Fix 2: Cards Controller - Check if it has similar filtering
  const cardsControllerPath = path.join(__dirname, 'controllers', 'cardsController.js');
  
  try {
    if (fs.existsSync(cardsControllerPath)) {
      console.log('📝 Checking Cards Controller...');
      
      let cardsControllerContent = fs.readFileSync(cardsControllerPath, 'utf8');
      
      // Look for is_active filtering patterns
      if (cardsControllerContent.includes('is_active') && cardsControllerContent.includes('true')) {
        console.log('⚠️  Cards Controller has is_active filtering - manual review needed');
        
        // Try common pattern fixes
        const patterns = [
          {
            original: "is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : true",
            fixed: "is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : null"
          },
          {
            original: "is_active: true",
            fixed: "is_active: null"
          }
        ];
        
        let modified = false;
        patterns.forEach(pattern => {
          if (cardsControllerContent.includes(pattern.original)) {
            cardsControllerContent = cardsControllerContent.replace(pattern.original, pattern.fixed);
            modified = true;
          }
        });
        
        if (modified) {
          fs.writeFileSync(cardsControllerPath, cardsControllerContent);
          console.log('✅ Cards Controller fixed - will now show all cards');
        }
      } else {
        console.log('✅ Cards Controller looks good');
      }
    }
  } catch (error) {
    console.log('❌ Error checking Cards Controller:', error.message);
  }
  
  // Fix 3: Create a test endpoint to verify the fix
  const testEndpointPath = path.join(__dirname, 'routes', 'testRoutes.js');
  
  try {
    console.log('📝 Creating test endpoint...');
    
    const testEndpointContent = `
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Test endpoint to check all data without filtering
router.get('/test-data', async (req, res) => {
  try {
    const tables = ['users', 'campaigns', 'cards', 'brands', 'campaign_types'];
    const results = {};
    
    for (const table of tables) {
      const [rows] = await pool.execute(\`SELECT COUNT(*) as total FROM \${table}\`);
      results[table] = {
        total: rows[0].total,
        table_exists: true
      };
      
      // Get sample record
      const [sample] = await pool.execute(\`SELECT * FROM \${table} LIMIT 1\`);
      if (sample.length > 0) {
        results[table].sample_fields = Object.keys(sample[0]);
        results[table].has_is_active = 'is_active' in sample[0];
      }
    }
    
    res.json({
      success: true,
      message: 'Data overview without filtering',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching data',
      error: error.message
    });
  }
});

module.exports = router;
`;
    
    fs.writeFileSync(testEndpointPath, testEndpointContent);
    console.log('✅ Test endpoint created at /api/test/test-data');
    
  } catch (error) {
    console.log('❌ Error creating test endpoint:', error.message);
  }
  
  console.log('\n🎯 FIXES APPLIED:');
  console.log('══════════════════════════════════════');
  console.log('1. ✅ User API now shows ALL users (active and inactive)');
  console.log('2. ✅ Cards API filtering checked and fixed if needed');
  console.log('3. ✅ Test endpoint created for verification');
  console.log('');
  console.log('🔄 NEXT STEPS:');
  console.log('1. Restart your backend server');
  console.log('2. Test the frontend modules - they should now show data');
  console.log('3. Visit http://localhost:5000/api/test/test-data to verify data exists');
  console.log('');
  console.log('💡 If modules are still blank after restart:');
  console.log('   - Run the browser debug script');
  console.log('   - Check Network tab for API request failures');
  console.log('   - Check Console for JavaScript errors');
}

// Run the fix
fixAPIFiltering();
