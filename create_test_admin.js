const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestAdmin() {
    console.log('🔧 Creating test admin user...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ads reporting',
        port: process.env.DB_PORT || 3306
    });

    try {
        const username = 'testadmin';
        const password = 'password123';
        
        // Check if user already exists
        const [existingUser] = await connection.execute(
            'SELECT id, username FROM users WHERE username = ?',
            [username]
        );

        if (existingUser.length > 0) {
            console.log(`⚠️  User '${username}' already exists. Updating password...`);
            
            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.execute(
                'UPDATE users SET hashed_password = ?, role_id = 1, is_active = 1 WHERE username = ?',
                [hashedPassword, username]
            );
            
            console.log('✅ Updated existing user credentials');
        } else {
            console.log(`➕ Creating new user '${username}'...`);
            
            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.execute(
                'INSERT INTO users (username, hashed_password, role_id, is_active) VALUES (?, ?, 1, 1)',
                [username, hashedPassword]
            );
            
            console.log('✅ Created new super admin user');
        }

        // Verify the user was created/updated correctly
        const [user] = await connection.execute(`
            SELECT 
                u.id,
                u.username,
                u.is_active,
                r.name as role_name,
                r.display_name as role_display_name,
                r.level as role_level
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.username = ?
        `, [username]);

        if (user.length > 0) {
            console.log('\n🎉 Test Admin User Details:');
            console.log('─'.repeat(40));
            console.log(`👤 Username: ${username}`);
            console.log(`🔑 Password: ${password}`);
            console.log(`🛡️  Role: ${user[0].role_display_name} (Level ${user[0].role_level})`);
            console.log(`✅ Status: ${user[0].is_active ? 'Active' : 'Inactive'}`);
            console.log(`🆔 User ID: ${user[0].id}`);
        }

        // Show available permissions
        const [permissions] = await connection.execute(`
            SELECT COUNT(*) as total_permissions
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN roles r ON rp.role_id = r.id
            WHERE r.name = 'super_admin' AND p.is_active = 1
        `);

        console.log(`\n📊 This user has access to ${permissions[0].total_permissions} permissions (ALL MODULES)`);

        // List some key permissions
        const [keyPermissions] = await connection.execute(`
            SELECT 
                p.category,
                p.display_name,
                p.description
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN roles r ON rp.role_id = r.id
            WHERE r.name = 'super_admin' AND p.is_active = 1
            ORDER BY p.category, p.display_name
            LIMIT 10
        `);

        console.log('\n🔍 Sample Permissions (showing first 10):');
        console.log('─'.repeat(50));
        keyPermissions.forEach((perm, index) => {
            console.log(`${index + 1}. [${perm.category.toUpperCase()}] ${perm.display_name}`);
        });

        console.log('\n💡 How to test:');
        console.log('1. Use these credentials to login through your frontend');
        console.log('2. Or test via API: POST /api/auth/login');
        console.log('3. Body: {"username": "testadmin", "password": "password123"}');
        console.log('4. You should receive both access and refresh tokens');
        console.log('5. Use the access token for all subsequent API calls');

        
    } catch (error) {
        console.error('❌ Error creating test admin:', error.message);
    } finally {
        await connection.end();
    }
}

// Run the script
createTestAdmin()
    .then(() => {
        console.log('\n✅ Test admin creation completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Creation failed:', error.message);
        process.exit(1);
    });
