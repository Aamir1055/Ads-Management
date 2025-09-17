/**
 * Activate campaign_data permissions and verify assignments
 */

const { pool } = require('./config/database');

async function activateCampaignData() {
  console.log('🔧 Activating campaign_data permissions...\n');
  
  try {
    // Activate all campaign_data permissions
    console.log('1️⃣ Activating campaign_data permissions...');
    const [result] = await pool.query(`
      UPDATE permissions 
      SET is_active = 1 
      WHERE category = 'campaign_data'
    `);
    
    console.log(`✅ Activated ${result.affectedRows} campaign_data permissions`);
    
    // Verify activation
    console.log('\n2️⃣ Verifying activated permissions...');
    const [activePerms] = await pool.query(`
      SELECT id, name, category, is_active 
      FROM permissions 
      WHERE category = 'campaign_data'
      ORDER BY name
    `);
    
    activePerms.forEach(p => {
      console.log(`   ${p.name}: ${p.is_active ? 'ACTIVE' : 'INACTIVE'}`);
    });
    
    // Check Aamir's permissions now
    console.log('\n3️⃣ Final check - Aamir\'s permissions including campaign_data:');
    const [finalCheck] = await pool.query(`
      SELECT p.name, p.category, p.is_active
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.username = 'Aamir' AND p.is_active = 1
      ORDER BY p.category, p.name
    `);
    
    console.log(`Total active permissions: ${finalCheck.length}`);
    
    const grouped = {};
    finalCheck.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p.name.split('_').pop());
    });
    
    Object.keys(grouped).forEach(category => {
      console.log(`   ${category}: [${grouped[category].join(', ')}]`);
    });
    
    // Check if campaign_data now appears
    const campaignDataPerms = finalCheck.filter(p => p.category === 'campaign_data');
    if (campaignDataPerms.length > 0) {
      console.log('\n🎉 SUCCESS! campaign_data permissions are now active and assigned!');
      console.log(`   Aamir has ${campaignDataPerms.length} campaign_data permissions:`, 
                  campaignDataPerms.map(p => p.name));
    } else {
      console.log('\n❌ Still no campaign_data permissions showing up');
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('✅ campaign_data permissions activated');
    console.log('✅ Aamir should now be able to access campaign_data endpoints');
    console.log('✅ The 403 Forbidden errors for campaign_data should be resolved');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

activateCampaignData();
