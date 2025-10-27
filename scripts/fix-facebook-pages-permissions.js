const { pool } = require('../config/database');

async function fixFacebookPagesPermissions() {
    try {
        console.log('🔧 Fixing Facebook Pages permissions...');

        // Get super_admin role ID
        const [adminRoles] = await pool.query(
            'SELECT id FROM roles WHERE name = ? LIMIT 1',
            ['super_admin']
        );

        if (adminRoles.length > 0) {
            const adminRoleId = adminRoles[0].id;
            console.log(`🎭 Found super_admin role with ID: ${adminRoleId}`);

            // Get all Facebook Pages permissions
            const [fbPermissions] = await pool.query(
                'SELECT id, name FROM permissions WHERE name LIKE "facebook_pages%"'
            );

            // Assign all Facebook Pages permissions to super_admin role
            for (const permission of fbPermissions) {
                try {
                    await pool.query(
                        'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                        [adminRoleId, permission.id]
                    );
                    console.log(`✅ Permission ${permission.name} assigned to super_admin role`);
                } catch (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        console.log(`⚠️ Permission ${permission.name} already assigned to super_admin role`);
                    } else {
                        console.error(`❌ Error assigning permission ${permission.name}:`, error.message);
                    }
                }
            }
        } else {
            console.log('⚠️ Super_admin role not found, skipping permission assignment');
        }

        // Add Facebook Pages to modules table with correct column name
        try {
            await pool.query(
                'INSERT IGNORE INTO modules (name, display_name, description, icon, route, is_active, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    'facebook_pages', 
                    'Facebook Pages', 
                    'Manage Facebook pages linked to accounts', 
                    'FileText', 
                    '/facebook-pages', 
                    1, 
                    9
                ]
            );
            console.log('✅ Facebook Pages module added to modules table');
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('⚠️ Facebook Pages module already exists in modules table');
            } else {
                console.error('❌ Error adding Facebook Pages module:', error.message);
            }
        }

        console.log('✅ Facebook Pages permissions fix completed successfully!');

    } catch (error) {
        console.error('❌ Error fixing Facebook Pages permissions:', error);
    } finally {
        try {
            await pool.end();
        } catch (err) {
            console.warn('Warning: Could not close database connection');
        }
        process.exit(0);
    }
}

// Run the fix
fixFacebookPagesPermissions();