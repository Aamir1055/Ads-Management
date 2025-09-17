const { pool } = require('./config/database');

async function checkUser() {
  try {
    console.log('Permissions table structure:');
    const [columns] = await pool.query('DESCRIBE permissions');
    columns.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));
    
    console.log('\nSample permissions:');
    const [samplePerms] = await pool.query('SELECT * FROM permissions LIMIT 3');
    console.log(samplePerms);
    
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.username = 'Aamir'
    `);
    console.log('\nUser info:', users[0]);
    
    if (users.length > 0) {
      const [permissions] = await pool.query(`
        SELECT p.name, p.display_name, p.description, p.category
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.is_active = 1
        ORDER BY p.name
      `, [users[0].role_id]);
      
      console.log('\nActual permissions in DB:');
      permissions.forEach(p => console.log(`- ${p.name} (${p.category || 'general'})`));
      
      // Test what the RBAC middleware is looking for (without permission_key)
      console.log('\nTesting specific permission lookups:');
      
      // Test campaign_types_read
      const [campaignTypesRead] = await pool.query(`
        SELECT p.name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.name = 'campaign_types_read'
        AND p.is_active = 1
      `, [users[0].role_id]);
      
      console.log('campaign_types_read lookup result:', campaignTypesRead);
      
      // Test users_read
      const [usersRead] = await pool.query(`
        SELECT p.name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.name = 'users_read'
        AND p.is_active = 1
      `, [users[0].role_id]);
      
      console.log('users_read lookup result:', usersRead);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
