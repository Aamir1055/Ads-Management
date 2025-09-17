/**
 * RBAC Test Script
 * 
 * This script tests the RBAC enforcement by simulating API calls 
 * with different user permissions.
 * 
 * Based on our analysis, user "Aamir" (role ID 27) should have:
 * ✅ brands_read
 * ✅ campaign_types_read  
 * ✅ campaigns_create, campaigns_read, campaigns_update
 * ✅ card_users_create, card_users_read
 * ✅ cards_create, cards_read
 * ✅ permissions_read
 * ✅ reports_create, reports_export, reports_read
 * ✅ users_create, users_read
 * 
 * And should be blocked from:
 * ❌ brands_create, brands_update, brands_delete
 * ❌ campaign_types_create, campaign_types_update, campaign_types_delete
 * ❌ campaigns_delete
 * ❌ cards_update, cards_delete
 * ❌ reports_update, reports_delete
 * ❌ users_update, users_delete
 */

const { pool } = require('./config/database');
const { checkModulePermission } = require('./middleware/rbacMiddleware');

async function testUserPermissions(userId) {
  console.log(`\n🧪 Testing RBAC for user ID: ${userId}`);
  console.log('=' .repeat(60));
  
  try {
    // Get user information
    const [userInfo] = await pool.query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name, r.level
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `, [userId]);
    
    if (userInfo.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userInfo[0];
    console.log(`👤 User: ${user.username} (ID: ${user.id})`);
    console.log(`🏷️  Role: ${user.role_name} (ID: ${user.role_id}, Level: ${user.level})`);
    
    // Get user permissions
    const [permissions] = await pool.query(`
      SELECT p.name, p.display_name, p.description, p.category
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ? AND p.is_active = 1
      ORDER BY p.category, p.name
    `, [user.role_id]);
    
    console.log(`\n📋 Permissions (${permissions.length} total):`);
    permissions.forEach(p => {
      console.log(`  ✅ ${p.name} (${p.category || 'general'})`);
    });
    
    // Test specific permission scenarios
    console.log(`\n🧪 Testing specific scenarios:`);
    
    const testCases = [
      // Should ALLOW (✅)
      { module: 'brands', action: 'read', expect: 'ALLOW', reason: 'has brands_read' },
      { module: 'campaign_types', action: 'read', expect: 'ALLOW', reason: 'has campaign_types_read' },
      { module: 'campaigns', action: 'read', expect: 'ALLOW', reason: 'has campaigns_read' },
      { module: 'campaigns', action: 'create', expect: 'ALLOW', reason: 'has campaigns_create' },
      { module: 'campaigns', action: 'update', expect: 'ALLOW', reason: 'has campaigns_update' },
      { module: 'cards', action: 'read', expect: 'ALLOW', reason: 'has cards_read' },
      { module: 'cards', action: 'create', expect: 'ALLOW', reason: 'has cards_create' },
      { module: 'users', action: 'read', expect: 'ALLOW', reason: 'has users_read' },
      { module: 'users', action: 'create', expect: 'ALLOW', reason: 'has users_create' },
      { module: 'reports', action: 'read', expect: 'ALLOW', reason: 'has reports_read' },
      { module: 'reports', action: 'create', expect: 'ALLOW', reason: 'has reports_create' },
      { module: 'reports', action: 'export', expect: 'ALLOW', reason: 'has reports_export' },
      
      // Should BLOCK (❌)
      { module: 'brands', action: 'create', expect: 'BLOCK', reason: 'missing brands_create' },
      { module: 'brands', action: 'update', expect: 'BLOCK', reason: 'missing brands_update' },
      { module: 'brands', action: 'delete', expect: 'BLOCK', reason: 'missing brands_delete' },
      { module: 'campaign_types', action: 'create', expect: 'BLOCK', reason: 'missing campaign_types_create' },
      { module: 'campaign_types', action: 'update', expect: 'BLOCK', reason: 'missing campaign_types_update' },
      { module: 'campaign_types', action: 'delete', expect: 'BLOCK', reason: 'missing campaign_types_delete' },
      { module: 'campaigns', action: 'delete', expect: 'BLOCK', reason: 'missing campaigns_delete' },
      { module: 'cards', action: 'update', expect: 'BLOCK', reason: 'missing cards_update' },
      { module: 'cards', action: 'delete', expect: 'BLOCK', reason: 'missing cards_delete' },
      { module: 'users', action: 'update', expect: 'BLOCK', reason: 'missing users_update' },
      { module: 'users', action: 'delete', expect: 'BLOCK', reason: 'missing users_delete' },
      { module: 'reports', action: 'update', expect: 'BLOCK', reason: 'missing reports_update' },
      { module: 'reports', action: 'delete', expect: 'BLOCK', reason: 'missing reports_delete' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
      const { module, action, expect, reason } = testCase;
      
      // Mock request object
      const mockReq = {
        user: {
          id: user.id,
          username: user.username,
          role_id: user.role_id
        }
      };
      
      const mockRes = {
        status: (code) => ({
          json: (response) => ({ statusCode: code, response })
        })
      };
      
      let result = 'ALLOW';
      let errorDetails = null;
      
      try {
        // Create the middleware function
        const middleware = checkModulePermission(module, action);
        
        // Test the middleware
        await new Promise((resolve, reject) => {
          middleware(mockReq, mockRes, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        
      } catch (error) {
        if (error && (error.message?.includes('INSUFFICIENT_PERMISSIONS') || 
                      error.response?.code === 'INSUFFICIENT_PERMISSIONS')) {
          result = 'BLOCK';
          errorDetails = error.message || error.response?.message;
        } else {
          result = 'ERROR';
          errorDetails = error.message;
        }
      }
      
      const isCorrect = result === expect;
      const status = isCorrect ? '✅' : '❌';
      
      if (isCorrect) passed++;
      else failed++;
      
      console.log(`  ${status} ${module}.${action}: ${result} (${reason})`);
      if (!isCorrect) {
        console.log(`      Expected: ${expect}, Got: ${result}`);
        if (errorDetails) console.log(`      Error: ${errorDetails}`);
      }
    }
    
    console.log(`\n📊 Test Results:`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log(`\n🎉 All tests passed! RBAC is working correctly for this user.`);
    } else {
      console.log(`\n⚠️  Some tests failed. Review the RBAC configuration.`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test SuperAdmin bypass
async function testSuperAdminBypass() {
  console.log(`\n👑 Testing SuperAdmin bypass...`);
  console.log('=' .repeat(60));
  
  try {
    // Find a SuperAdmin user
    const [superAdmins] = await pool.query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name, r.level
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name IN ('SuperAdmin', 'Super Admin') 
         OR r.level >= 10
      LIMIT 1
    `);
    
    if (superAdmins.length === 0) {
      console.log('⚠️  No SuperAdmin users found to test bypass');
      return;
    }
    
    const superAdmin = superAdmins[0];
    console.log(`👑 Testing with SuperAdmin: ${superAdmin.username} (Level: ${superAdmin.level})`);
    
    // Test a few operations that would normally require specific permissions
    const testCases = [
      { module: 'brands', action: 'delete' },
      { module: 'users', action: 'delete' },
      { module: 'campaigns', action: 'delete' },
      { module: 'reports', action: 'delete' }
    ];
    
    let allPassed = true;
    
    for (const testCase of testCases) {
      const { module, action } = testCase;
      
      const mockReq = {
        user: {
          id: superAdmin.id,
          username: superAdmin.username,
          role_id: superAdmin.role_id
        }
      };
      
      const mockRes = {
        status: (code) => ({
          json: (response) => ({ statusCode: code, response })
        })
      };
      
      try {
        const middleware = checkModulePermission(module, action);
        
        await new Promise((resolve, reject) => {
          middleware(mockReq, mockRes, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        
        console.log(`  ✅ ${module}.${action}: BYPASSED (SuperAdmin access granted)`);
        
      } catch (error) {
        console.log(`  ❌ ${module}.${action}: FAILED - SuperAdmin bypass not working`);
        console.log(`      Error: ${error.message}`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log(`\n🎉 SuperAdmin bypass is working correctly!`);
    } else {
      console.log(`\n⚠️  SuperAdmin bypass has issues.`);
    }
    
  } catch (error) {
    console.error('❌ SuperAdmin test failed:', error);
  }
}

// Main test function
async function runRBACTests() {
  console.log('🚀 Starting RBAC Tests');
  console.log('=' .repeat(80));
  
  // Test the specific user from the conversation (Aamir, ID: 3)
  // Note: We'll need to find the actual user ID for Aamir
  const [amirUser] = await pool.query(`
    SELECT id FROM users WHERE username = 'Aamir' LIMIT 1
  `);
  
  if (amirUser.length > 0) {
    await testUserPermissions(amirUser[0].id);
  } else {
    console.log('⚠️  User "Aamir" not found, testing with role ID 27 users...');
    const [roleUsers] = await pool.query(`
      SELECT id FROM users WHERE role_id = 27 LIMIT 1
    `);
    
    if (roleUsers.length > 0) {
      await testUserPermissions(roleUsers[0].id);
    } else {
      console.log('⚠️  No users found with role ID 27');
    }
  }
  
  // Test SuperAdmin bypass
  await testSuperAdminBypass();
  
  console.log('\n🏁 RBAC Tests Complete');
  console.log('=' .repeat(80));
}

// Run the tests
if (require.main === module) {
  runRBACTests()
    .then(() => {
      console.log('\n✨ Test execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testUserPermissions,
  testSuperAdminBypass,
  runRBACTests
};
