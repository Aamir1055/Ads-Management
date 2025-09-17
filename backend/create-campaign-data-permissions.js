/**
 * Create missing campaign_data permissions in the database
 */

const { pool } = require('./config/database');

async function createCampaignDataPermissions() {
  console.log('🔧 Creating missing campaign_data permissions...\n');
  
  try {
    // Define the permissions we need to create
    const permissionsToCreate = [
      {
        name: 'campaign_data_create',
        display_name: 'Create Campaign Data',
        description: 'Create new campaign data entries',
        category: 'campaign_data'
      },
      {
        name: 'campaign_data_read',
        display_name: 'View Campaign Data',
        description: 'View campaign data entries',
        category: 'campaign_data'
      },
      {
        name: 'campaign_data_update',
        display_name: 'Update Campaign Data',
        description: 'Update existing campaign data entries',
        category: 'campaign_data'
      },
      {
        name: 'campaign_data_delete',
        display_name: 'Delete Campaign Data',
        description: 'Delete campaign data entries',
        category: 'campaign_data'
      }
    ];
    
    console.log('1️⃣ Creating campaign_data permissions...');
    
    for (const perm of permissionsToCreate) {
      // Check if permission already exists
      const [existing] = await pool.query(`
        SELECT id FROM permissions WHERE name = ?
      `, [perm.name]);
      
      if (existing.length > 0) {
        console.log(`✅ ${perm.name}: Already exists`);
        continue;
      }
      
      // Create the permission
      try {
        await pool.query(`
          INSERT INTO permissions (name, display_name, description, category, is_active, created_at)
          VALUES (?, ?, ?, ?, 1, NOW())
        `, [perm.name, perm.display_name, perm.description, perm.category]);
        
        console.log(`✅ ${perm.name}: Created successfully`);
      } catch (error) {
        console.log(`❌ ${perm.name}: Failed to create - ${error.message}`);
      }
    }
    
    // Now assign campaign_data_read to Aamir's role
    console.log('\n2️⃣ Assigning campaign_data_read permission to Aamir...');
    
    const [aamirRole] = await pool.query(`
      SELECT role_id FROM users WHERE username = 'Aamir'
    `);
    
    if (aamirRole.length === 0) {
      console.log('❌ Aamir not found');
      return;
    }
    
    const roleId = aamirRole[0].role_id;
    
    // Get the permission ID
    const [permission] = await pool.query(`
      SELECT id FROM permissions WHERE name = 'campaign_data_read'
    `);
    
    if (permission.length === 0) {
      console.log('❌ campaign_data_read permission not found');
      return;
    }
    
    const permissionId = permission[0].id;
    
    // Check if already assigned
    const [existing] = await pool.query(`
      SELECT * FROM role_permissions 
      WHERE role_id = ? AND permission_id = ?
    `, [roleId, permissionId]);
    
    if (existing.length > 0) {
      console.log('✅ campaign_data_read: Already assigned to Aamir');
    } else {
      // Assign the permission
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id, created_at)
        VALUES (?, ?, NOW())
      `, [roleId, permissionId]);
      
      console.log('✅ campaign_data_read: Assigned to Aamir successfully');
    }
    
    // Show final permissions summary
    console.log('\n3️⃣ Final permissions for Aamir:');
    const [finalPerms] = await pool.query(`
      SELECT p.name, p.category
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.username = 'Aamir' AND p.is_active = 1
      ORDER BY p.category, p.name
    `);
    
    const grouped = {};
    finalPerms.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p.name.split('_').pop());
    });
    
    Object.keys(grouped).forEach(category => {
      console.log(`   ${category}: [${grouped[category].join(', ')}]`);
    });
    
    console.log(`\n📊 Total permissions: ${finalPerms.length}`);
    
    console.log('\n🎯 SUMMARY:');
    console.log('✅ All campaign_data permissions created');
    console.log('✅ campaign_data_read assigned to Aamir');
    console.log('✅ Aamir should now be able to access campaign data endpoints');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

createCampaignDataPermissions();
