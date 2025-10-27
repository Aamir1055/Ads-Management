const { pool } = require('./config/database');

async function checkMismatch() {
  try {
    const [users] = await pool.query("SELECT id, role_id FROM users WHERE username = 'Aamir'");
    if (users.length === 0) return console.log('User not found');
    
    const [perms] = await pool.query('SELECT name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ? AND p.is_active = 1', [users[0].role_id]);
    console.log('Permissions in DB:');
    perms.forEach(p => console.log(' -', p.name));
    
    console.log('\nWhat RBAC is looking for vs what exists:');
    const lookingFor = ['campaign_types_read', 'campaigns_read', 'cards_read'];
    lookingFor.forEach(perm => {
      const exists = perms.some(p => p.name === perm);
      console.log(exists ? '✅' : '❌', perm, exists ? '(EXISTS)' : '(MISSING)');
    });
    
    // Check categories
    console.log('\nChecking permission categories:');
    const [categories] = await pool.query('SELECT name, category FROM permissions WHERE name IN (?, ?, ?)', ['campaign_types_read', 'campaigns_read', 'cards_read']);
    categories.forEach(p => console.log('-', p.name, '| category:', p.category || '(NULL)'));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkMismatch();
