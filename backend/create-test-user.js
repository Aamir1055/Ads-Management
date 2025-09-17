const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function createTestUser() {
  try {
    console.log('🔧 Creating test user for API testing...');

    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔒 Password hashed successfully');

    // Create roles if they don't exist
    console.log('📝 Ensuring roles exist...');
    await pool.execute(`
      INSERT IGNORE INTO roles (id, name, display_name, description, level, is_active, created_at, updated_at)
      VALUES 
      (1, 'admin', 'Administrator', 'Full access to all system features', 100, 1, NOW(), NOW()),
      (2, 'user', 'User', 'Basic user access', 1, 1, NOW(), NOW())
    `);

    // Create campaign types if they don't exist
    console.log('📊 Ensuring campaign types exist...');
    await pool.execute(`
      INSERT IGNORE INTO campaign_types (id, type_name, description, is_active, created_at, updated_at)
      VALUES 
      (1, 'Search', 'Search advertising campaigns', 1, NOW(), NOW()),
      (2, 'Display', 'Display advertising campaigns', 1, NOW(), NOW()),
      (3, 'Social', 'Social media campaigns', 1, NOW(), NOW())
    `);

    // Check if user already exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE username = ?', ['admin']);
    
    if (existingUsers.length > 0) {
      console.log('👤 Test user already exists');
      // Update password in case it's different
      await pool.execute(`
        UPDATE users 
        SET hashed_password = ?, updated_at = NOW()
        WHERE username = 'admin'
      `, [hashedPassword]);
      console.log('🔄 Updated password for existing test user');
    } else {
      // Create new test user
      await pool.execute(`
        INSERT INTO users (
          username, email, hashed_password, role_id, is_2fa_enabled, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, ['admin', 'admin@test.com', hashedPassword, 1, 0, 1]);
      
      console.log('✅ Test user created successfully');
    }

    // Verify the user was created
    const [users] = await pool.execute(`
      SELECT u.id, u.username, u.role_id, u.is_active, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username = 'admin'
    `);

    if (users.length > 0) {
      const user = users[0];
      console.log('👤 Test user details:', {
        id: user.id,
        username: user.username,
        email: user.email,
        role_name: user.role_name,
        is_active: user.is_active
      });
      console.log('🔑 Test credentials: admin / admin123');
    }

    // Check campaign types
    const [campaignTypes] = await pool.execute('SELECT id, type_name FROM campaign_types WHERE is_active = 1');
    console.log('📊 Available campaign types:', campaignTypes.map(ct => ({ id: ct.id, name: ct.type_name })));

    console.log('🎉 Setup complete! You can now test the API');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    // Close the database connection
    if (pool && pool.end) {
      await pool.end();
    }
    process.exit(0);
  }
}

createTestUser();
