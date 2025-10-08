const { pool } = require('../config/database');

async function addFacebookPermissionsToUser() {
    try {
        console.log('🔧 Adding Facebook Accounts permissions to current user...');
        
        // First, let's see what users exist
        const [users] = await pool.query('SELECT id, username, email FROM users LIMIT 10');
        console.log('📋 Available users:');
        users.forEach(user => {
            console.log(`   - ID: ${user.id}, Username: ${user.username || 'N/A'}, Email: ${user.email || 'N/A'}`);
        });
        
        // Check what permissions exist for facebook accounts
        const [permissions] = await pool.query("SELECT id, name, display_name FROM permissions WHERE name LIKE 'facebook_accounts_%'");
        console.log('\n📋 Facebook Accounts permissions:');
        permissions.forEach(perm => {
            console.log(`   - ${perm.name} (ID: ${perm.id})`);
        });
        
        if (permissions.length === 0) {
            console.log('❌ No Facebook accounts permissions found. Running setup first...');
            return;
        }
        
        // Get the first user (assuming admin)
        const userId = users[0]?.id;
        if (!userId) {
            console.log('❌ No users found in database');
            return;
        }
        
        // Check user's role
        const [userRoles] = await pool.query(`
            SELECT u.id, u.username, u.email, r.id as role_id, r.name as role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ?
        `, [userId]);
        
        if (userRoles.length > 0) {
            const user = userRoles[0];
            console.log(`\n👤 Current user: ${user.username || user.email} (Role: ${user.role_name || 'No role'})`);
            
            if (user.role_id) {
                // Check if role already has permissions
                const [rolePerms] = await pool.query(`
                    SELECT p.name 
                    FROM role_permissions rp 
                    JOIN permissions p ON rp.permission_id = p.id 
                    WHERE rp.role_id = ? AND p.name LIKE 'facebook_accounts_%'
                `, [user.role_id]);
                
                console.log(`\n📋 Current Facebook permissions for ${user.role_name} role:`);
                rolePerms.forEach(perm => {
                    console.log(`   ✅ ${perm.name}`);
                });
                
                if (rolePerms.length === 0) {
                    console.log('❌ No Facebook permissions found for this role. Adding them...');
                    
                    // Add permissions to role
                    for (const permission of permissions) {
                        try {
                            await pool.query(
                                'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                                [user.role_id, permission.id]
                            );
                            console.log(`   ✅ Added ${permission.name} to role`);
                        } catch (error) {
                            console.log(`   ❌ Error adding ${permission.name}: ${error.message}`);
                        }
                    }
                } else {
                    console.log('✅ User role already has Facebook permissions');
                }
            }
        }
        
        // Also check if there's a modules table entry
        try {
            const [modules] = await pool.query("SELECT * FROM modules WHERE name = 'facebook_accounts'");
            if (modules.length === 0) {
                console.log('\n📝 Adding Facebook Accounts module entry...');
                await pool.query(`
                    INSERT INTO modules (name, display_name, description, route_path, icon, is_active, sort_order) 
                    VALUES ('facebook_accounts', 'Facebook Accounts', 'Manage Facebook account credentials', '/facebook-accounts', 'Facebook', 1, 8)
                `);
                console.log('✅ Module entry added');
            } else {
                console.log('\n✅ Facebook Accounts module entry exists');
            }
        } catch (error) {
            console.log('\n⚠️  Modules table might not exist, that\'s okay - navigation is handled by frontend');
        }
        
        console.log('\n🎉 Setup completed! Please refresh your browser and check the sidebar.');
        
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

// Run the setup
addFacebookPermissionsToUser();