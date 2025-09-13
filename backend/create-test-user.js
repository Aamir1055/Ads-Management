const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'ads reporting'
  });

  try {
    // Check if Pakistan role exists
    const [pakistanRoles] = await connection.execute('SELECT * FROM roles WHERE name = ?', ['Pakistan']);
    
    if (pakistanRoles.length === 0) {
      console.log('❌ Pakistan role not found');
      return;
    }

    const pakistanRole = pakistanRoles[0];
    console.log(`✅ Pakistan role found (ID: ${pakistanRole.id})`);

    // Create test password
    const testPassword = 'test123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Check if test user already exists
    const [existingUsers] = await connection.execute('SELECT * FROM users WHERE username = ?', ['TestPakistan']);
    
    if (existingUsers.length > 0) {
      // Update existing user password
      await connection.execute(
        'UPDATE users SET hashed_password = ?, role_id = ?, is_active = 1 WHERE username = ?',
        [hashedPassword, pakistanRole.id, 'TestPakistan']
      );
      console.log('✅ Updated existing TestPakistan user password and role');
    } else {
      // Create new test user
      await connection.execute(
        'INSERT INTO users (username, hashed_password, role_id, is_active, created_at) VALUES (?, ?, ?, 1, NOW())',
        ['TestPakistan', hashedPassword, pakistanRole.id]
      );
      console.log('✅ Created new TestPakistan user');
    }

    console.log('\n🎯 Test credentials:');
    console.log('Username: TestPakistan');
    console.log('Password: test123');
    console.log(`Role: ${pakistanRole.name} (ID: ${pakistanRole.id})`);

    // Show what permissions this role has
    const [permissions] = await connection.execute(`
      SELECT 
        p.category as module_name,
        p.name as permission_name,
        p.display_name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ? AND p.is_active = 1
      ORDER BY p.category, p.name
    `, [pakistanRole.id]);

    console.log('\n📋 Role permissions:');
    const moduleGroups = {};
    permissions.forEach(perm => {
      if (!moduleGroups[perm.module_name]) {
        moduleGroups[perm.module_name] = [];
      }
      moduleGroups[perm.module_name].push(perm);
    });

    Object.entries(moduleGroups).forEach(([module, perms]) => {
      console.log(`  📁 ${module}:`);
      perms.forEach(perm => {
        console.log(`     - ${perm.permission_name}: ${perm.display_name}`);
      });
    });

  } finally {
    await connection.end();
  }
}

createTestUser().catch(console.error);
