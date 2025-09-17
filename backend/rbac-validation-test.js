/**
 * Complete RBAC Validation Test
 * Tests that all permissions are working correctly for user Aamir
 */

const { pool } = require('./config/database');
const { checkModulePermission } = require('./middleware/rbacMiddleware');

async function completeRBACTest() {
  console.log('🏁 Complete RBAC Validation Test');
  console.log('=' .repeat(50));
  
  try {
    // Find the Aamir user
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.username = 'Aamir' 
      LIMIT 1
    `);
    
    if (users.length === 0) {
      console.log('❌ Aamir user not found');
      return;
    }
    
    const user = users[0];
    console.log(`👤 Testing user: ${user.username} (Role: ${user.role_name})`);
    
    // Quick validation tests
    const tests = [
      { module: 'brands', action: 'read', expectPass: true },
      { module: 'brands', action: 'create', expectPass: false },
      { module: 'campaign_types', action: 'read', expectPass: true },
      { module: 'campaign_types', action: 'create', expectPass: false },
      { module: 'users', action: 'read', expectPass: true },
      { module: 'users', action: 'update', expectPass: false }
    ];
    
    console.log(`\n🧪 Running ${tests.length} key validation tests...`);
    
    let allPassed = true;
    
    for (const test of tests) {
      try {
        const middleware = checkModulePermission(test.module, test.action);
        const mockReq = { user: { id: user.id, role_id: user.role_id } };
        let blocked = false;
        
        const mockRes = { 
          status: (code) => ({ 
            json: (response) => {
              if (code === 403) blocked = true;
            } 
          }) 
        };
        
        await new Promise((resolve) => {
          middleware(mockReq, mockRes, () => resolve());
        });
        
        const actualResult = blocked ? 'BLOCKED' : 'ALLOWED';
        const expectedResult = test.expectPass ? 'ALLOWED' : 'BLOCKED';
        const passed = actualResult === expectedResult;
        
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${test.module}.${test.action}: ${actualResult}`);
        
        if (!passed) allPassed = false;
        
      } catch (error) {
        console.log(`  ❓ ${test.module}.${test.action}: ERROR - ${error.message}`);
        allPassed = false;
      }
    }
    
    console.log(`\n📊 Final Result:`);
    if (allPassed) {
      console.log(`✅ ALL TESTS PASSED! RBAC is working correctly.`);
      console.log(`\n💡 This means:`);
      console.log(`  - User "Aamir" can only access authorized resources`);
      console.log(`  - Unauthorized actions are properly blocked with 403 errors`);
      console.log(`  - Your frontend should now receive proper permission errors`);
      console.log(`  - The RBAC system is fully operational! 🎉`);
    } else {
      console.log(`❌ Some tests failed. Please check the RBAC configuration.`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

completeRBACTest();
