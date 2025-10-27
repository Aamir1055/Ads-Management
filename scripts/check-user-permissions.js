const { pool } = require('../config/database');

async function checkUserPermissions() {
    try {
        console.log('🔧 Checking Facebook Accounts permissions setup...');
        
        // First, check the users table structure
        console.log('\n📋 Users table structure:');
        const [columns] = await pool.query('DESCRIBE users');
        columns.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type}`);
        });
        
        // Get users with proper column names
        const [users] = await pool.query('SELECT id, username FROM users LIMIT 5');
        console.log('\n📋 Available users:');
        users.forEach(user => {
            console.log(`   - ID: ${user.id}, Username: ${user.username}`);
        });
        
        // Check what permissions exist for facebook accounts
        const [permissions] = await pool.query("SELECT id, name, display_name FROM permissions WHERE name LIKE 'facebook_accounts_%'");
        console.log('\n📋 Facebook Accounts permissions:');
        permissions.forEach(perm => {
            console.log(`   - ${perm.name} (ID: ${perm.id})`);
        });
        
        if (permissions.length === 0) {
            console.log('❌ No Facebook accounts permissions found.');
            console.log('💡 Please run: node scripts/setup-facebook-simple.js');
            return;
        }
        
        // Check roles table
        const [roles] = await pool.query('SELECT id, name FROM roles LIMIT 5');
        console.log('\n📋 Available roles:');
        roles.forEach(role => {
            console.log(`   - ID: ${role.id}, Name: ${role.name}`);
        });
        
        // Get admin role (typically ID 1 or name 'admin')
        const adminRole = roles.find(r => r.name === 'admin' || r.id === 1) || roles[0];
        if (adminRole) {
            console.log(`\n🎯 Using role: ${adminRole.name} (ID: ${adminRole.id})`);
            
            // Check if admin role has Facebook permissions
            const [rolePerms] = await pool.query(`
                SELECT p.name 
                FROM role_permissions rp 
                JOIN permissions p ON rp.permission_id = p.id 
                WHERE rp.role_id = ? AND p.name LIKE 'facebook_accounts_%'
            `, [adminRole.id]);
            
            console.log(`\n📋 Current Facebook permissions for ${adminRole.name}:`);
            if (rolePerms.length > 0) {
                rolePerms.forEach(perm => {
                    console.log(`   ✅ ${perm.name}`);
                });
            } else {
                console.log('   ❌ No Facebook permissions assigned');
                
                // Add permissions
                console.log('\n🔄 Adding Facebook permissions to admin role...');
                for (const permission of permissions) {
                    try {
                        await pool.query(
                            'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                            [adminRole.id, permission.id]
                        );
                        console.log(`   ✅ Added ${permission.name}`);
                    } catch (error) {
                        console.log(`   ❌ Error adding ${permission.name}: ${error.message}`);
                    }
                }
            }
        }
        
        console.log('\n🎉 Permission check completed!');
        console.log('\n📝 Next steps:');
        console.log('1. Refresh your browser (Ctrl+F5)');
        console.log('2. Look for "Facebook Accounts" in the sidebar');
        console.log('3. If not visible, try logging out and back in');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        try {
            await pool.end();
        } catch (err) {
            console.warn('Warning: Could not close database connection');
        }
        process.exit(0);
    }
}

// Run the check
checkUserPermissions();