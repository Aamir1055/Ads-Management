const { pool } = require('./config/database');

async function checkPermissions() {
  try {
    const [perms] = await pool.query('SELECT name, category FROM permissions WHERE is_active = 1 ORDER BY category, name');
    
    console.log('🔑 Available Permissions:');
    let currentCategory = '';
    
    perms.forEach(p => {
      if (p.category !== currentCategory) {
        console.log(`\n📂 ${p.category.toUpperCase()}:`);
        currentCategory = p.category;
      }
      console.log(`   • ${p.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkPermissions();
