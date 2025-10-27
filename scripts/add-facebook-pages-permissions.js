const { pool } = require('../config/database');

async function addFacebookPagesPermissions() {
    try {
        console.log('🔐 Adding Facebook Pages permissions...');

        // Insert Facebook Pages permissions
        const permissions = [
            { name: 'facebook_pages_view', description: 'View Facebook Pages' },
            { name: 'facebook_pages_create', description: 'Create Facebook Pages' },
            { name: 'facebook_pages_update', description: 'Update Facebook Pages' },
            { name: 'facebook_pages_delete', description: 'Delete Facebook Pages' },
            { name: 'facebook_pages_manage', description: 'Manage Facebook Pages' }
        ];

        // Insert permissions
        for (const permission of permissions) {
            try {
                await pool.query(
                    'INSERT IGNORE INTO permissions (name, description) VALUES (?, ?)',
                    [permission.name, permission.description]
                );
                console.log(`✅ Permission added: ${permission.name}`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️ Permission already exists: ${permission.name}`);
                } else {
                    console.error(`❌ Error adding permission ${permission.name}:`, error.message);
                }
            }
        }

        // Get admin role ID (assuming it exists)
        const [adminRoles] = await pool.query(
            'SELECT id FROM roles WHERE name = ? OR name = ? LIMIT 1',
            ['admin', 'Admin']
        );

        if (adminRoles.length > 0) {
            const adminRoleId = adminRoles[0].id;
            console.log(`🎭 Found admin role with ID: ${adminRoleId}`);

            // Assign all Facebook Pages permissions to admin role
            for (const permission of permissions) {
                try {
                    const [permissionRows] = await pool.query(
                        'SELECT id FROM permissions WHERE name = ?',
                        [permission.name]
                    );

                    if (permissionRows.length > 0) {
                        const permissionId = permissionRows[0].id;
                        
                        await pool.query(
                            'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                            [adminRoleId, permissionId]
                        );
                        console.log(`✅ Permission ${permission.name} assigned to admin role`);
                    }
                } catch (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        console.log(`⚠️ Permission ${permission.name} already assigned to admin role`);
                    } else {
                        console.error(`❌ Error assigning permission ${permission.name}:`, error.message);
                    }
                }
            }
        } else {
            console.log('⚠️ Admin role not found, skipping permission assignment');
        }

        // Add Facebook Pages to modules table
        try {
            await pool.query(
                'INSERT IGNORE INTO modules (name, display_name, description, icon, route, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
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

        console.log('✅ Facebook Pages permissions setup completed successfully!');

    } catch (error) {
        console.error('❌ Error setting up Facebook Pages permissions:', error);
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
addFacebookPagesPermissions();