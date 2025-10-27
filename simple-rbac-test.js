/**
 * Simple RBAC Validation Test
 * Tests basic permission checking functionality
 */

const { pool } = require('./config/database');
const { checkModulePermission } = require('./middleware/rbacMiddleware');

async function simpleTest() {
  console.log('🧪 Simple RBAC Test');
  console.log('=' .repeat(40));
  
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
    
    // Test 1: Should ALLOW (has brands_read permission)
    console.log('\n📝 Test 1: brands.read (should ALLOW)');
    try {
      const middleware = checkModulePermission('brands', 'read');
      const mockReq = { user: { id: user.id, role_id: user.role_id } };
      const mockRes = { status: () => ({ json: () => {} }) };
      
      await new Promise((resolve, reject) => {
        middleware(mockReq, mockRes, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      
      console.log('✅ PASS - User can read brands');
    } catch (error) {
      console.log('❌ FAIL - User should be able to read brands');
      console.log('   Error:', error.message);
    }
    
    // Test 2: Should BLOCK (missing brands_create permission)  
    console.log('\n📝 Test 2: brands.create (should BLOCK)');
    try {
      const middleware = checkModulePermission('brands', 'create');
      const mockReq = { user: { id: user.id, role_id: user.role_id } };
      let blocked = false;
      const mockRes = { 
        status: (code) => ({ 
          json: (response) => {
            if (code === 403) {
              blocked = true;
              console.log('✅ PASS - User correctly blocked from creating brands');
              return;
            }
          } 
        }) 
      };
      
      await new Promise((resolve, reject) => {
        middleware(mockReq, mockRes, (error) => {
          if (error) reject(error);
          else {
            if (!blocked) {
              console.log('❌ FAIL - User should NOT be able to create brands');
            }
            resolve();
          }
        });
      });
    } catch (error) {
      console.log('❌ FAIL - Test error:', error.message);
    }
    
    // Test 3: Should ALLOW (has campaign_types_read permission)
    console.log('\n📝 Test 3: campaign_types.read (should ALLOW)');
    try {
      const middleware = checkModulePermission('campaign_types', 'read');
      const mockReq = { user: { id: user.id, role_id: user.role_id } };
      const mockRes = { status: () => ({ json: () => {} }) };
      
      await new Promise((resolve, reject) => {
        middleware(mockReq, mockRes, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      
      console.log('✅ PASS - User can read campaign_types');
    } catch (error) {
      console.log('❌ FAIL - User should be able to read campaign_types');
      console.log('   Error:', error.message);
    }
    
    // Test 4: Should ALLOW (has users_read permission)
    console.log('\n📝 Test 4: users.read (should ALLOW)');
    try {
      const middleware = checkModulePermission('users', 'read');
      const mockReq = { user: { id: user.id, role_id: user.role_id } };
      const mockRes = { status: () => ({ json: () => {} }) };
      
      await new Promise((resolve, reject) => {
        middleware(mockReq, mockRes, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      
      console.log('✅ PASS - User can read users');
    } catch (error) {
      console.log('❌ FAIL - User should be able to read users');
      console.log('   Error:', error.message);
    }
    
    // Test SuperAdmin bypass
    console.log('\n👑 Testing SuperAdmin bypass...');
    const [superAdmins] = await pool.query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name, r.level
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name IN ('SuperAdmin', 'Super Admin') OR r.level >= 10
      LIMIT 1
    `);
    
    if (superAdmins.length > 0) {
      const superAdmin = superAdmins[0];
      console.log(`👑 Testing SuperAdmin: ${superAdmin.username}`);
      
      try {
        const middleware = checkModulePermission('brands', 'delete'); // Should bypass
        const mockReq = { user: { id: superAdmin.id, role_id: superAdmin.role_id } };
        const mockRes = { status: () => ({ json: () => {} }) };
        
        await new Promise((resolve, reject) => {
          middleware(mockReq, mockRes, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        
        console.log('✅ PASS - SuperAdmin bypass working');
      } catch (error) {
        console.log('❌ FAIL - SuperAdmin bypass not working:', error.message);
      }
    } else {
      console.log('⚠️  No SuperAdmin found to test');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  await pool.end();
}

simpleTest();
