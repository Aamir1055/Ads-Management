/**
 * Test the actual middleware function as it runs on the server
 */

const { pool } = require('./config/database');
const { checkModulePermission } = require('./middleware/rbacMiddleware');

async function testActualMiddleware() {
  console.log('🧪 Testing the actual RBAC middleware function');
  console.log('=' .repeat(50));
  
  try {
    const [users] = await pool.query("SELECT id, role_id FROM users WHERE username = 'Aamir'");
    if (users.length === 0) return console.log('User not found');
    
    const user = users[0];
    console.log(`👤 Testing user: Aamir (ID: ${user.id}, Role: ${user.role_id})`);
    
    // Test campaign_types_read permission
    console.log('\n📝 Testing campaign_types.read permission:');
    
    const middleware = checkModulePermission('campaign_types', 'read');
    const mockReq = { user: { id: user.id, role_id: user.role_id } };
    
    let responseData = null;
    let statusCode = null;
    
    const mockRes = {
      status: (code) => {
        statusCode = code;
        console.log(`📊 Status Code: ${code}`);
        return {
          json: (data) => {
            responseData = data;
            console.log(`📄 Response:`, JSON.stringify(data, null, 2));
          }
        };
      }
    };
    
    let nextCalled = false;
    const mockNext = () => {
      nextCalled = true;
      console.log('✅ next() was called - middleware passed!');
    };
    
    console.log('⏳ Calling middleware...');
    await middleware(mockReq, mockRes, mockNext);
    
    // Wait a moment for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('\n📊 Results:');
    console.log('- Status Code:', statusCode || 'none');
    console.log('- Next Called:', nextCalled);
    console.log('- Success:', nextCalled && !statusCode);
    
    if (nextCalled && !statusCode) {
      console.log('\n🎉 SUCCESS: User has campaign_types_read permission!');
      console.log('   The RBAC middleware is working correctly.');
      console.log('   The issue might be that your server needs to be restarted.');
    } else {
      console.log('\n❌ BLOCKED: User was denied access');
      if (responseData) {
        console.log('   Reason:', responseData.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in middleware test:', error.message);
  } finally {
    await pool.end();
  }
}

testActualMiddleware();
