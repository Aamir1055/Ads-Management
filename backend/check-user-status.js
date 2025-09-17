/**
 * Check the current status of user "Aamir" and their permissions
 */

const { pool } = require('./config/database');

async function checkUserStatus() {
  console.log('🔍 Checking user status and permissions...\n');
  
  try {
    // Check if Aamir exists and get their role
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username = 'Aamir'
    `);
    
    if (users.length === 0) {
      console.log('❌ User "Aamir" not found!');
      return;
    }
    
    const user = users[0];
    console.log('👤 User Info:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role ID: ${user.role_id}`);
    console.log(`   Role Name: ${user.role_name}\n`);
    
    // Check permissions for this user's role
    const [permissions] = await pool.query(`
      SELECT rp.*, p.name as permission_name, p.category
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
      ORDER BY p.category, p.name
    `, [user.role_id]);
    
    if (permissions.length === 0) {
      console.log('❌ No permissions found for this role!');
      return;
    }
    
    console.log(`🔐 Permissions (${permissions.length} total):`);
    
    const groupedPermissions = {};
    permissions.forEach(perm => {
      if (!groupedPermissions[perm.category]) {
        groupedPermissions[perm.category] = [];
      }
      groupedPermissions[perm.category].push(perm.permission_name);
    });
    
    Object.keys(groupedPermissions).forEach(category => {
      console.log(`   ${category}: [${groupedPermissions[category].join(', ')}]`);
    });
    
    console.log('\n🎯 Specific permissions to check:');
    const criticalPerms = [
      'campaign_types_read',
      'users_read', 
      'campaigns_read',
      'cards_read',
      'reports_read'
    ];
    
    for (const permName of criticalPerms) {
      const found = permissions.find(p => p.permission_name === permName);
      console.log(`   ${permName}: ${found ? '✅ FOUND' : '❌ MISSING'}`);
    }
    
    console.log('\n📊 All permissions for this user:');
    permissions.forEach(perm => {
      console.log(`   ${perm.permission_name} (category: ${perm.category})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking user status:', error);
  } finally {
    await pool.end();
  }
}

checkUserStatus();
