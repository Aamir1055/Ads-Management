/**
 * Add missing permissions with correct database schema
 */

const { pool } = require('./config/database');

async function addMissingPermissions() {
  console.log('🔧 Adding missing permissions with correct schema...\n');
  
  try {
    // First, check the role_permissions table structure
    console.log('1️⃣ Checking role_permissions table structure...');
    const [columns] = await pool.query('SHOW COLUMNS FROM role_permissions');
    console.log('Table columns:', columns.map(c => c.Field));
    
    // Get Aamir's role ID
    const [aamirRole] = await pool.query(`
      SELECT role_id FROM users WHERE username = 'Aamir'
    `);
    
    if (aamirRole.length === 0) {
      console.log('❌ Aamir not found');
      return;
    }
    
    const roleId = aamirRole[0].role_id;
    console.log(`\n2️⃣ Adding permissions for role ID: ${roleId}`);
    
    // Check what permissions exist in the database
    const [allPermissions] = await pool.query(`
      SELECT name, id, category FROM permissions 
      WHERE is_active = 1 
      ORDER BY category, name
    `);
    
    console.log(`\n📋 Available permissions in database (${allPermissions.length} total):`);
    allPermissions.forEach(p => {
      console.log(`   ${p.name} (${p.category})`);
    });
    
    // Permissions we want to add
    const desiredPermissions = [
      'cards_update',
      'cards_delete', 
      'users_update',
      'campaigns_delete',
      'users_create'  // Make sure Aamir can create users
    ];
    
    console.log('\n3️⃣ Adding missing permissions...');
    
    for (const permissionName of desiredPermissions) {
      // Find the permission
      const permission = allPermissions.find(p => p.name === permissionName);
      
      if (!permission) {
        console.log(`❌ ${permissionName}: Does not exist in database`);
        continue;
      }
      
      // Check if already assigned
      const [existing] = await pool.query(`
        SELECT * FROM role_permissions 
        WHERE role_id = ? AND permission_id = ?
      `, [roleId, permission.id]);
      
      if (existing.length > 0) {
        console.log(`✅ ${permissionName}: Already assigned`);
        continue;
      }
      
      // Add the permission (using correct column names)
      try {
        await pool.query(`
          INSERT INTO role_permissions (role_id, permission_id, created_at)
          VALUES (?, ?, NOW())
        `, [roleId, permission.id]);
        
        console.log(`✅ ${permissionName}: Added successfully`);
      } catch (error) {
        console.log(`❌ ${permissionName}: Failed - ${error.message}`);
      }
    }
    
    // Show final permissions for Aamir
    console.log('\n4️⃣ Final permissions for Aamir:');
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
    
    // Create missing campaign_data permission if needed
    console.log('\n5️⃣ Checking for campaign_data permissions...');
    const campaignDataPerms = allPermissions.filter(p => p.category === 'campaign_data');
    if (campaignDataPerms.length === 0) {
      console.log('❌ No campaign_data permissions found in database');
      console.log('💡 The campaign_data endpoints might be using a different permission scheme');
      console.log('💡 Check the campaignDataRoutes_privacy.js file to see what permissions it expects');
    } else {
      console.log('✅ Found campaign_data permissions:', campaignDataPerms.map(p => p.name));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addMissingPermissions();
