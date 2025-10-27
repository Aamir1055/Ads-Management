/**
 * Debug campaign_data permission issue
 */

const { pool } = require('./config/database');

async function debugCampaignData() {
  console.log('🔍 Debugging campaign_data permission issue...\n');
  
  try {
    // Check all permissions in database
    console.log('1️⃣ Checking all permissions with campaign_data...');
    const [allPerms] = await pool.query(`
      SELECT id, name, category, is_active 
      FROM permissions 
      WHERE name LIKE '%campaign_data%' OR category = 'campaign_data'
      ORDER BY name
    `);
    
    console.log(`Found ${allPerms.length} campaign_data related permissions:`);
    allPerms.forEach(p => {
      console.log(`   ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Active: ${p.is_active}`);
    });
    
    if (allPerms.length === 0) {
      console.log('❌ No campaign_data permissions found at all!');
      return;
    }
    
    // Check Aamir's role assignments
    console.log('\n2️⃣ Checking Aamir\'s role assignments...');
    const [aamirRole] = await pool.query(`
      SELECT role_id FROM users WHERE username = 'Aamir'
    `);
    
    const roleId = aamirRole[0].role_id;
    console.log(`Aamir's role ID: ${roleId}`);
    
    // Check role_permissions for campaign_data
    const [rolePerms] = await pool.query(`
      SELECT rp.*, p.name, p.category
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ? AND (p.name LIKE '%campaign_data%' OR p.category = 'campaign_data')
    `, [roleId]);
    
    console.log(`Found ${rolePerms.length} campaign_data permissions assigned to Aamir:`);
    rolePerms.forEach(rp => {
      console.log(`   Permission: ${rp.name} (Category: ${rp.category})`);
    });
    
    // Try to assign campaign_data_read manually
    if (allPerms.length > 0) {
      console.log('\n3️⃣ Manually assigning campaign_data_read...');
      const campaignDataReadPerm = allPerms.find(p => p.name === 'campaign_data_read');
      
      if (campaignDataReadPerm) {
        // Check if already assigned
        const [existing] = await pool.query(`
          SELECT * FROM role_permissions 
          WHERE role_id = ? AND permission_id = ?
        `, [roleId, campaignDataReadPerm.id]);
        
        if (existing.length > 0) {
          console.log('✅ campaign_data_read already assigned');
        } else {
          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id, created_at)
            VALUES (?, ?, NOW())
          `, [roleId, campaignDataReadPerm.id]);
          
          console.log('✅ campaign_data_read assigned successfully');
        }
      }
    }
    
    // Final check - show all Aamir's permissions including campaign_data
    console.log('\n4️⃣ Final verification - All Aamir\'s permissions:');
    const [finalCheck] = await pool.query(`
      SELECT p.name, p.category
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.username = 'Aamir' AND p.is_active = 1
      ORDER BY p.category, p.name
    `);
    
    console.log(`Total permissions: ${finalCheck.length}`);
    
    const grouped = {};
    finalCheck.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p.name.split('_').pop());
    });
    
    Object.keys(grouped).forEach(category => {
      console.log(`   ${category}: [${grouped[category].join(', ')}]`);
    });
    
    // Check if campaign_data appears now
    const campaignDataPerms = finalCheck.filter(p => p.category === 'campaign_data');
    if (campaignDataPerms.length > 0) {
      console.log('\n✅ SUCCESS: campaign_data permissions are now assigned!');
    } else {
      console.log('\n❌ ISSUE: campaign_data permissions still not showing up');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugCampaignData();
