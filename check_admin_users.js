const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdminUsers() {
    console.log('🔍 Checking admin users...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ads reporting',
        port: process.env.DB_PORT || 3306
    });

    try {
        // Get all users with their roles
        const [users] = await connection.execute(`
            SELECT 
                u.id,
                u.username,
                u.is_active,
                u.created_at,
                r.id as role_id,
                r.name as role_name,
                r.display_name as role_display_name,
                r.level as role_level
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY r.level DESC, u.username ASC
        `);

        console.log('\n📋 All Users with Roles:');
        console.log('─'.repeat(80));
        console.log('ID | Username        | Role Name      | Display Name           | Level | Active');
        console.log('─'.repeat(80));

        users.forEach(user => {
            const status = user.is_active ? '✅' : '❌';
            console.log(
                `${user.id.toString().padEnd(2)} | ${user.username.padEnd(15)} | ${user.role_name.padEnd(14)} | ${user.role_display_name.padEnd(21)} | ${user.role_level.toString().padEnd(5)} | ${status}`
            );
        });

        // Get super admin users specifically
        const [superAdmins] = await connection.execute(`
            SELECT 
                u.id,
                u.username,
                u.is_active,
                u.last_login,
                r.name as role_name,
                r.display_name as role_display_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name = 'super_admin' AND u.is_active = 1
        `);

        console.log('\n🔑 Super Admin Users (Full Access):');
        console.log('─'.repeat(60));
        
        if (superAdmins.length === 0) {
            console.log('❌ No active super admin users found!');
            console.log('\n💡 Creating a test super admin user...');
            
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const [result] = await connection.execute(`
                INSERT INTO users (username, hashed_password, role_id, is_active) 
                VALUES ('admin', ?, 1, 1)
            `, [hashedPassword]);
            
            console.log('✅ Created super admin user:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
            console.log('   Role: Super Administrator');
            
        } else {
            superAdmins.forEach((user, index) => {
                console.log(`${index + 1}. Username: ${user.username}`);
                console.log(`   Role: ${user.role_display_name}`);
                console.log(`   Status: ${user.is_active ? 'Active' : 'Inactive'}`);
                console.log(`   Last Login: ${user.last_login || 'Never'}`);
                console.log('');
            });
        }

        // Also check admin level users
        const [admins] = await connection.execute(`
            SELECT 
                u.id,
                u.username,
                u.is_active,
                r.name as role_name,
                r.display_name as role_display_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name IN ('admin', 'super_admin') AND u.is_active = 1
            ORDER BY r.level DESC
        `);

        console.log('\n👥 All Admin Level Users:');
        console.log('─'.repeat(50));
        
        admins.forEach((user, index) => {
            console.log(`${index + 1}. Username: ${user.username}`);
            console.log(`   Role: ${user.role_display_name}`);
            console.log('');
        });

        // Show role permissions for super admin
        const [permissions] = await connection.execute(`
            SELECT COUNT(*) as total_permissions
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN roles r ON rp.role_id = r.id
            WHERE r.name = 'super_admin' AND p.is_active = 1
        `);

        console.log(`📊 Super Admin has access to ${permissions[0].total_permissions} permissions (full system access)`);
        
    } catch (error) {
        console.error('❌ Error checking admin users:', error.message);
    } finally {
        await connection.end();
    }
}

// Run the check
checkAdminUsers()
    .then(() => {
        console.log('\n✅ Admin user check completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Check failed:', error.message);
        process.exit(1);
    });
