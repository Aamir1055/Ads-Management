const { pool } = require('../config/database');

async function addBMAndAdsManagerPermissions() {
    try {
        console.log('🔐 Adding BM and Ads Manager permissions...');

        // Insert BM permissions
        const bmPermissions = [
            { name: 'bm_view', description: 'View Business Managers' },
            { name: 'bm_create', description: 'Create Business Managers' },
            { name: 'bm_update', description: 'Update Business Managers' },
            { name: 'bm_delete', description: 'Delete Business Managers' },
            { name: 'bm_manage', description: 'Manage Business Managers' }
        ];

        // Insert Ads Manager permissions
        const adsManagerPermissions = [
            { name: 'ads_manager_view', description: 'View Ads Managers' },
            { name: 'ads_manager_create', description: 'Create Ads Managers' },
            { name: 'ads_manager_update', description: 'Update Ads Managers' },
            { name: 'ads_manager_delete', description: 'Delete Ads Managers' },
            { name: 'ads_manager_manage', description: 'Manage Ads Managers' }
        ];

        const allPermissions = [...bmPermissions, ...adsManagerPermissions];

        // Insert permissions
        for (const permission of allPermissions) {
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

        // Get super_admin role ID
        const [adminRoles] = await pool.query(
            'SELECT id FROM roles WHERE name = ? LIMIT 1',
            ['super_admin']
        );

        if (adminRoles.length > 0) {
            const adminRoleId = adminRoles[0].id;
            console.log(`🎭 Found super_admin role with ID: ${adminRoleId}`);

            // Assign all permissions to super_admin role
            for (const permission of allPermissions) {
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
                        console.log(`✅ Permission ${permission.name} assigned to super_admin role`);
                    }
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

        // Add BM module to modules table
        try {
            await pool.query(
                'INSERT IGNORE INTO modules (name, display_name, description, icon, route, is_active, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    'bm', 
                    'Business Manager', 
                    'Manage Business Managers', 
                    'Building2', 
                    '/bm', 
                    1, 
                    10
                ]
            );
            console.log('✅ BM module added to modules table');
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('⚠️ BM module already exists in modules table');
            } else {
                console.error('❌ Error adding BM module:', error.message);
            }
        }

        // Add Ads Manager module to modules table
        try {
            await pool.query(
                'INSERT IGNORE INTO modules (name, display_name, description, icon, route, is_active, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    'ads_managers', 
                    'Ads Manager', 
                    'Manage Ads Managers', 
                    'TrendingUp', 
                    '/ads-managers', 
                    1, 
                    11
                ]
            );
            console.log('✅ Ads Manager module added to modules table');
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('⚠️ Ads Manager module already exists in modules table');
            } else {
                console.error('❌ Error adding Ads Manager module:', error.message);
            }
        }

        console.log('✅ BM and Ads Manager permissions setup completed successfully!');

    } catch (error) {
        console.error('❌ Error setting up BM and Ads Manager permissions:', error);
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
addBMAndAdsManagerPermissions();