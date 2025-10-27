/**
 * Grant Campaign Update and Delete Permissions to Advertiser Role
 * This script will add missing update and delete permissions to the Advertiser role
 */

const { pool } = require('./config/database');

async function grantAdvertiserPermissions() {
  console.log('🔧 Granting Campaign Update & Delete Permissions to Advertiser Role...\\n');
  
  try {
    // Find the Advertiser role
    console.log('1️⃣ Finding Advertiser role...');
    const [roles] = await pool.query(`
      SELECT id, name, level, description
      FROM roles 
      WHERE name = 'Advertiser' OR name = 'advertiser'
      LIMIT 1
    `);
    
    if (roles.length === 0) {
      console.log('❌ Advertiser role not found');
      return;
    }
    
    const advertiserRole = roles[0];
    console.log(`✅ Found Advertiser role: ID ${advertiserRole.id}, Level ${advertiserRole.level}`);
    
    // Check which users have this role
    console.log('\\n2️⃣ Users with Advertiser role:');
    const [users] = await pool.query(`
      SELECT u.id, u.username
      FROM users u
      WHERE u.role_id = ? AND u.is_active = 1
    `, [advertiserRole.id]);
    
    users.forEach(user => {
      console.log(`   - ${user.username} (ID: ${user.id})`);
    });
    
    // Check current campaign permissions for Advertiser role
    console.log('\\n3️⃣ Current campaign permissions for Advertiser role:');
    const [currentPerms] = await pool.query(`
      SELECT p.name, p.display_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ? AND p.name LIKE 'campaigns_%' AND p.is_active = 1
      ORDER BY p.name
    `, [advertiserRole.id]);
    
    currentPerms.forEach(perm => {
      console.log(`   ✅ ${perm.name} (${perm.display_name})`);
    });
    
    // Define permissions to add
    const permissionsToAdd = ['campaigns_update', 'campaigns_delete'];
    
    console.log('\\n4️⃣ Adding missing permissions to Advertiser role...');
    
    for (const permName of permissionsToAdd) {
      // Check if role already has this permission
      const [existing] = await pool.query(`
        SELECT rp.id
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ? AND p.name = ?
      `, [advertiserRole.id, permName]);
      
      if (existing.length === 0) {
        // Get permission ID
        const [permission] = await pool.query(`
          SELECT id FROM permissions WHERE name = ?
        `, [permName]);
        
        if (permission.length > 0) {
          // Grant the permission
          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id, created_at)
            VALUES (?, ?, NOW())
          `, [advertiserRole.id, permission[0].id]);
          
          console.log(`   ✅ Granted: ${permName}`);
        } else {
          console.log(`   ❌ Permission ${permName} not found in database`);
        }
      } else {
        console.log(`   ✅ Already has: ${permName}`);
      }
    }
    
    // Show final permissions for Advertiser role
    console.log('\\n5️⃣ Final campaign permissions for Advertiser role:');
    const [finalPerms] = await pool.query(`
      SELECT p.name, p.display_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ? AND p.name LIKE 'campaigns_%' AND p.is_active = 1
      ORDER BY p.name
    `, [advertiserRole.id]);
    
    finalPerms.forEach(perm => {
      console.log(`   ✅ ${perm.name} (${perm.display_name})`);
    });
    
    const permActions = finalPerms.map(p => p.name.split('_')[1]);
    console.log(`\\n📊 Campaign permissions: [${permActions.join(', ')}]`);
    
    console.log('\\n🎯 SUMMARY:');
    console.log('✅ Advertiser role now has full campaign permissions (create, read, update, delete)');
    console.log('✅ All users with Advertiser role can now update and delete campaigns');
    console.log('\\n💡 NEXT STEPS:');
    console.log('1. Restart your backend server to clear any permission caches');
    console.log('2. Refresh your frontend page or log out and back in');
    console.log('3. Try deleting or updating a campaign - it should work now!');
    
    console.log('\\n⚠️  NOTE:');
    console.log('This change affects ALL users with the Advertiser role.');
    console.log('If you want more granular control, consider creating different role levels.');
    
  } catch (error) {
    console.error('❌ Error granting advertiser permissions:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
grantAdvertiserPermissions();
