/**
 * Fix Campaign Permissions for Current User
 * This script will check the current user's campaign permissions and add missing ones
 */

const { pool } = require('./config/database');

async function fixCampaignPermissions() {
  console.log('🔧 Fixing Campaign Permissions...\\n');
  
  try {
    // First, let's see what users we have and their current campaign permissions
    console.log('1️⃣ Checking all users and their campaign permissions...');
    
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name, r.level as role_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = 1
      ORDER BY u.id
    `);
    
    console.log('\\n📋 Current Users:');
    users.forEach(user => {
      console.log(`   - ${user.username} (ID: ${user.id}) → Role: ${user.role_name} (Level: ${user.role_level})`);
    });
    
    // Check existing campaign permissions for each user
    console.log('\\n2️⃣ Checking existing campaign permissions...');
    
    for (const user of users) {
      console.log(`\\n🔍 ${user.username} (${user.role_name}):`);
      
      const [permissions] = await pool.query(`
        SELECT p.name, p.display_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ? AND p.name LIKE 'campaigns_%' AND p.is_active = 1
        ORDER BY p.name
      `, [user.id]);
      
      if (permissions.length > 0) {
        permissions.forEach(perm => {
          console.log(`   ✅ ${perm.name} (${perm.display_name})`);
        });
      } else {
        console.log(`   ❌ No campaign permissions found`);
      }
    }
    
    // Define the campaign permissions we need
    const requiredPermissions = [
      {
        name: 'campaigns_create',
        display_name: 'Create Campaigns',
        description: 'Create new campaigns',
        category: 'campaigns'
      },
      {
        name: 'campaigns_read',
        display_name: 'View Campaigns',
        description: 'View campaigns',
        category: 'campaigns'
      },
      {
        name: 'campaigns_update',
        display_name: 'Update Campaigns',
        description: 'Update existing campaigns',
        category: 'campaigns'
      },
      {
        name: 'campaigns_delete',
        display_name: 'Delete Campaigns',
        description: 'Delete campaigns',
        category: 'campaigns'
      }
    ];
    
    // Ensure all campaign permissions exist in the database
    console.log('\\n3️⃣ Ensuring campaign permissions exist...');
    
    for (const perm of requiredPermissions) {
      const [existing] = await pool.query(`
        SELECT id FROM permissions WHERE name = ?
      `, [perm.name]);
      
      if (existing.length === 0) {
        console.log(`   ➕ Creating permission: ${perm.name}`);
        await pool.query(`
          INSERT INTO permissions (name, display_name, description, category, is_active, created_at)
          VALUES (?, ?, ?, ?, 1, NOW())
        `, [perm.name, perm.display_name, perm.description, perm.category]);
      } else {
        console.log(`   ✅ ${perm.name}: Already exists`);
      }
    }
    
    // Now let's add missing permissions to users who need them
    console.log('\\n4️⃣ Adding missing campaign permissions to users...');
    
    for (const user of users) {
      console.log(`\\n🔧 Processing ${user.username} (${user.role_name}):`);
      
      // Determine which permissions this role should have
      let permissionsToGrant = [];
      
      if (user.role_name === 'SuperAdmin' || user.role_name === 'Super Admin' || user.role_level >= 10) {
        // SuperAdmin gets all permissions (though they bypass checks anyway)
        permissionsToGrant = requiredPermissions.map(p => p.name);
        console.log(`   🔥 SuperAdmin role - granting all campaign permissions`);
      } else if (user.role_name === 'Admin' || user.role_level >= 8) {
        // Admin gets all permissions
        permissionsToGrant = requiredPermissions.map(p => p.name);
        console.log(`   👑 Admin role - granting all campaign permissions`);
      } else if (user.role_name === 'Manager' || user.role_level >= 5) {
        // Manager gets create, read, update (but not delete)
        permissionsToGrant = ['campaigns_create', 'campaigns_read', 'campaigns_update'];
        console.log(`   👨‍💼 Manager role - granting create, read, update permissions`);
      } else {
        // Regular users (Advertiser, etc.) get create and read only
        permissionsToGrant = ['campaigns_create', 'campaigns_read'];
        console.log(`   👤 Regular user role - granting create and read permissions`);
      }
      
      // Skip if no role_id (shouldn't happen with proper user data)
      if (!user.role_id) {
        console.log(`   ⚠️  User ${user.username} has no role_id, skipping...`);
        continue;
      }
      
      // Grant the permissions
      for (const permName of permissionsToGrant) {
        // Check if role already has this permission
        const [existingPerm] = await pool.query(`
          SELECT rp.id
          FROM role_permissions rp
          JOIN permissions p ON rp.permission_id = p.id
          WHERE rp.role_id = ? AND p.name = ?
        `, [user.role_id, permName]);
        
        if (existingPerm.length === 0) {
          // Get permission ID
          const [permission] = await pool.query(`
            SELECT id FROM permissions WHERE name = ?
          `, [permName]);
          
          if (permission.length > 0) {
            // Grant the permission to the role
            await pool.query(`
              INSERT INTO role_permissions (role_id, permission_id, created_at)
              VALUES (?, ?, NOW())
            `, [user.role_id, permission[0].id]);
            
            console.log(`     ✅ Granted: ${permName}`);
          }
        } else {
          console.log(`     ✅ Already has: ${permName}`);
        }
      }
    }
    
    // Final summary of all users' campaign permissions
    console.log('\\n5️⃣ Final Campaign Permissions Summary:');
    
    for (const user of users) {
      console.log(`\\n👤 ${user.username} (${user.role_name}):`);
      
      const [finalPermissions] = await pool.query(`
        SELECT p.name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ? AND p.name LIKE 'campaigns_%' AND p.is_active = 1
        ORDER BY p.name
      `, [user.id]);
      
      const permActions = finalPermissions.map(p => p.name.split('_')[1]);
      console.log(`   📊 Campaign permissions: [${permActions.join(', ')}]`);
    }
    
    console.log('\\n🎯 SUMMARY:');
    console.log('✅ All campaign permissions have been created in the database');
    console.log('✅ All users have been granted appropriate campaign permissions based on their roles');
    console.log('✅ You should now be able to delete and update campaigns');
    console.log('\\n💡 NEXT STEPS:');
    console.log('1. Restart your backend server to clear any permission caches');
    console.log('2. Try deleting or updating a campaign in the frontend');
    console.log('3. Check the browser console for any remaining permission errors');
    
  } catch (error) {
    console.error('❌ Error fixing campaign permissions:', error);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixCampaignPermissions();
