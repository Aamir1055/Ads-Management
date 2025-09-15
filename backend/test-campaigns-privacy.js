const { pool } = require('./config/database');

/**
 * Test Campaign Privacy Filtering
 * This simulates what the API should return for different users
 */

async function testCampaignPrivacy() {
  console.log('🔍 Testing Campaign Privacy Filtering...\n');

  try {
    // Get all campaigns with ownership info
    const [campaigns] = await pool.query(`
      SELECT c.id, c.name, c.created_by, u.username as creator_username, r.level as creator_role_level
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY c.created_by
    `);

    console.log('📊 All campaigns in database:');
    campaigns.forEach(camp => {
      console.log(`   - "${camp.name}" (ID: ${camp.id}) → Created by: ${camp.creator_username} (ID: ${camp.created_by}, Role Level: ${camp.creator_role_level})`);
    });

    // Test what Saad (ID: 44) should see
    console.log('\n🔵 What SAAD (Regular User, ID: 44) should see:');
    const saadCampaigns = campaigns.filter(c => c.created_by === 44);
    if (saadCampaigns.length > 0) {
      saadCampaigns.forEach(camp => {
        console.log(`   ✅ "${camp.name}" (owns this campaign)`);
      });
    } else {
      console.log('   ❌ No campaigns found for Saad');
    }

    // Test what Admin should see
    console.log('\n🔴 What ADMIN (ID: 35 or 41) should see:');
    console.log('   ✅ ALL campaigns (admin privileges):');
    campaigns.forEach(camp => {
      console.log(`     - "${camp.name}" (Created by: ${camp.creator_username})`);
    });

    // Simulate the API filter logic
    console.log('\n🧪 Simulating API Privacy Filter Logic:');
    
    // Mock user objects
    const mockSaad = { id: 44, role: { level: 1, name: 'advertiser' } };
    const mockAdmin = { id: 35, role: { level: 10, name: 'super_admin' } };

    // Privacy check function (from controller)
    const isAdmin = (user) => {
      return user.role && (user.role.level >= 8 || user.role.name === 'super_admin' || user.role.name === 'admin');
    };

    console.log(`   Saad is admin: ${isAdmin(mockSaad)} (should be false)`);
    console.log(`   Admin is admin: ${isAdmin(mockAdmin)} (should be true)`);

    // Build WHERE clause like the controller does
    console.log('\n📝 SQL WHERE clause that should be generated:');
    
    // For Saad (non-admin)
    console.log('   For Saad (regular user):');
    console.log('   WHERE 1=1 AND c.created_by = 44');
    console.log(`   Result: Should return ${saadCampaigns.length} campaign(s)`);

    // For Admin
    console.log('\n   For Admin:');
    console.log('   WHERE 1=1');
    console.log(`   Result: Should return ${campaigns.length} campaigns`);

    // Test the actual query that should run for Saad
    console.log('\n🔍 Testing actual SQL query for Saad:');
    const [saadQueryResult] = await pool.query(`
      SELECT c.*, ct.type_name as campaign_type_name
      FROM campaigns c
      LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
      WHERE 1=1 AND c.created_by = 44
      ORDER BY c.created_at DESC
    `);

    console.log(`   Query returned ${saadQueryResult.length} campaigns for Saad:`);
    saadQueryResult.forEach(camp => {
      console.log(`     ✅ "${camp.name}"`);
    });

    if (saadQueryResult.length !== saadCampaigns.length) {
      console.log('   ⚠️  Mismatch detected! Check database consistency.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🎯 CONCLUSION:');
    console.log('If Saad can see campaigns other than "Saad Campaign", the problem is:');
    console.log('1. Server not restarted after code changes, OR');
    console.log('2. Frontend calling different API endpoint, OR');
    console.log('3. Authentication/user context not working properly');
    console.log('\n💡 SOLUTION: Ensure server is restarted and verify frontend API calls');
    process.exit(0);
  }
}

testCampaignPrivacy();
