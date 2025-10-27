const { pool } = require('./config/database');

async function debugRBACQuery() {
  try {
    const [users] = await pool.query("SELECT id, role_id FROM users WHERE username = 'Aamir'");
    if (users.length === 0) return console.log('User not found');
    
    const roleId = users[0].role_id;
    const module = 'campaign_types';
    
    console.log(`Testing RBAC query for user role ${roleId} and module '${module}':`);
    
    // Test the exact query from RBAC middleware
    const [availablePermissions] = await pool.query(`
      SELECT p.name, p.display_name as action_name, p.category as module_name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ? AND (p.category = ? OR p.name LIKE ?)
      AND p.is_active = 1
    `, [roleId, module, `${module}_%`]);
    
    console.log('Query results:');
    console.log('Available permissions:', availablePermissions.length);
    
    if (availablePermissions.length === 0) {
      console.log('❌ No permissions found - this explains the error!');
      
      // Debug: check each part of the query
      console.log('\nDebugging query parts:');
      
      // Check category match
      const [categoryMatch] = await pool.query(`
        SELECT p.name, p.category 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.category = ?
        AND p.is_active = 1
      `, [roleId, module]);
      
      console.log('Category match:', categoryMatch.length, 'results');
      categoryMatch.forEach(p => console.log('  -', p.name, '(category:', p.category + ')'));
      
      // Check LIKE match
      const [likeMatch] = await pool.query(`
        SELECT p.name, p.category 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.name LIKE ?
        AND p.is_active = 1
      `, [roleId, `${module}_%`]);
      
      console.log('LIKE match:', likeMatch.length, 'results');
      likeMatch.forEach(p => console.log('  -', p.name, '(matches pattern:', `${module}_%` + ')'));
      
    } else {
      console.log('✅ Permissions found:');
      availablePermissions.forEach(p => {
        console.log('  -', p.name, '|', p.action_name, '|', p.module_name);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugRBACQuery();
