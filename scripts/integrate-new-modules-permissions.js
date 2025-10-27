const { pool } = require('../config/database');

async function integrateNewModulesPermissions() {
    try {
        console.log('🚀 Integrating new modules into Role Management system...\n');

        // Step 1: Create/Update Facebook Accounts module
        console.log('📦 Step 1: Setting up Facebook Accounts module...');
        const [fbAccountsModule] = await pool.query(`
            SELECT id FROM modules WHERE name = 'facebook_accounts'
        `);
        
        let fbAccountsModuleId;
        if (fbAccountsModule.length === 0) {
            console.log('   Creating Facebook Accounts module...');
            const [result] = await pool.query(`
                INSERT INTO modules (name, display_name, description, is_active, created_at, updated_at) 
                VALUES ('facebook_accounts', 'Facebook Accounts', 'Manage Facebook advertising accounts', 1, NOW(), NOW())
            `);
            fbAccountsModuleId = result.insertId;
        } else {
            fbAccountsModuleId = fbAccountsModule[0].id;
            console.log('   Facebook Accounts module already exists with ID:', fbAccountsModuleId);
        }

        // Step 2: Create/Update Facebook Pages module
        console.log('📦 Step 2: Setting up Facebook Pages module...');
        const [fbPagesModule] = await pool.query(`
            SELECT id FROM modules WHERE name = 'facebook_pages'
        `);
        
        let fbPagesModuleId;
        if (fbPagesModule.length === 0) {
            console.log('   Creating Facebook Pages module...');
            const [result] = await pool.query(`
                INSERT INTO modules (name, display_name, description, is_active, created_at, updated_at) 
                VALUES ('facebook_pages', 'Facebook Pages', 'Manage Facebook business pages', 1, NOW(), NOW())
            `);
            fbPagesModuleId = result.insertId;
        } else {
            fbPagesModuleId = fbPagesModule[0].id;
            console.log('   Facebook Pages module already exists with ID:', fbPagesModuleId);
            
            // Update the display name and description for consistency
            await pool.query(`
                UPDATE modules 
                SET display_name = 'Facebook Pages', description = 'Manage Facebook business pages' 
                WHERE id = ?
            `, [fbPagesModuleId]);
        }

        // Step 3: Create/Update Business Manager module  
        console.log('📦 Step 3: Setting up Business Manager module...');
        const [bmModule] = await pool.query(`
            SELECT id FROM modules WHERE name = 'business_manager'
        `);
        
        let bmModuleId;
        if (bmModule.length === 0) {
            console.log('   Creating Business Manager module...');
            const [result] = await pool.query(`
                INSERT INTO modules (name, display_name, description, is_active, created_at, updated_at) 
                VALUES ('business_manager', 'Business Manager', 'Manage business managers and organizational structure', 1, NOW(), NOW())
            `);
            bmModuleId = result.insertId;
        } else {
            bmModuleId = bmModule[0].id;
            console.log('   Business Manager module already exists with ID:', bmModuleId);
        }

        // Check if 'bm' module exists and update it to 'business_manager'
        const [oldBmModule] = await pool.query(`SELECT id FROM modules WHERE name = 'bm'`);
        if (oldBmModule.length > 0) {
            console.log('   Found old "bm" module, using its ID and updating...');
            bmModuleId = oldBmModule[0].id;
            // Just update display name and description, keep the name as 'bm' to avoid conflicts
            await pool.query(`
                UPDATE modules 
                SET display_name = 'Business Manager', 
                    description = 'Manage business managers and organizational structure' 
                WHERE name = 'bm'
            `);
            console.log('   Updated "bm" module details');
        }

        // Step 4: Create/Update Ads Manager module
        console.log('📦 Step 4: Setting up Ads Manager module...');
        const [adsManagerModule] = await pool.query(`
            SELECT id FROM modules WHERE name = 'ads_manager'
        `);
        
        let adsManagerModuleId;
        if (adsManagerModule.length === 0) {
            console.log('   Creating Ads Manager module...');
            const [result] = await pool.query(`
                INSERT INTO modules (name, display_name, description, is_active, created_at, updated_at) 
                VALUES ('ads_manager', 'Ads Manager', 'Manage advertising managers and campaign personnel', 1, NOW(), NOW())
            `);
            adsManagerModuleId = result.insertId;
        } else {
            adsManagerModuleId = adsManagerModule[0].id;
            console.log('   Ads Manager module already exists with ID:', adsManagerModuleId);
        }

        // Check if 'ads_managers' module exists and use it for ads_manager
        const [oldAdsManagerModule] = await pool.query(`SELECT id FROM modules WHERE name = 'ads_managers'`);
        if (oldAdsManagerModule.length > 0) {
            console.log('   Found old "ads_managers" module, using its ID and updating...');
            adsManagerModuleId = oldAdsManagerModule[0].id;
            // Just update display name and description, keep the name as 'ads_managers'
            await pool.query(`
                UPDATE modules 
                SET display_name = 'Ads Manager', 
                    description = 'Manage advertising managers and campaign personnel' 
                WHERE name = 'ads_managers'
            `);
            console.log('   Updated "ads_managers" module details');
        }

        // Step 5: Create comprehensive permissions for each module
        console.log('\\n🔑 Step 5: Setting up permissions...');
        
        const permissionsToCreate = [
            // Facebook Accounts permissions
            { module_id: fbAccountsModuleId, name: 'facebook_accounts_view', display_name: 'View Facebook Accounts', category: 'facebook_accounts' },
            { module_id: fbAccountsModuleId, name: 'facebook_accounts_create', display_name: 'Create Facebook Accounts', category: 'facebook_accounts' },
            { module_id: fbAccountsModuleId, name: 'facebook_accounts_update', display_name: 'Update Facebook Accounts', category: 'facebook_accounts' },
            { module_id: fbAccountsModuleId, name: 'facebook_accounts_delete', display_name: 'Delete Facebook Accounts', category: 'facebook_accounts' },
            { module_id: fbAccountsModuleId, name: 'facebook_accounts_manage', display_name: 'Full Facebook Accounts Management', category: 'facebook_accounts' },
            
            // Facebook Pages permissions
            { module_id: fbPagesModuleId, name: 'facebook_pages_view', display_name: 'View Facebook Pages', category: 'facebook_pages' },
            { module_id: fbPagesModuleId, name: 'facebook_pages_create', display_name: 'Create Facebook Pages', category: 'facebook_pages' },
            { module_id: fbPagesModuleId, name: 'facebook_pages_update', display_name: 'Update Facebook Pages', category: 'facebook_pages' },
            { module_id: fbPagesModuleId, name: 'facebook_pages_delete', display_name: 'Delete Facebook Pages', category: 'facebook_pages' },
            { module_id: fbPagesModuleId, name: 'facebook_pages_manage', display_name: 'Full Facebook Pages Management', category: 'facebook_pages' },
            
            // Business Manager permissions
            { module_id: bmModuleId, name: 'business_manager_view', display_name: 'View Business Managers', category: 'business_manager' },
            { module_id: bmModuleId, name: 'business_manager_create', display_name: 'Create Business Managers', category: 'business_manager' },
            { module_id: bmModuleId, name: 'business_manager_update', display_name: 'Update Business Managers', category: 'business_manager' },
            { module_id: bmModuleId, name: 'business_manager_delete', display_name: 'Delete Business Managers', category: 'business_manager' },
            { module_id: bmModuleId, name: 'business_manager_manage', display_name: 'Full Business Manager Management', category: 'business_manager' },
            
            // Ads Manager permissions
            { module_id: adsManagerModuleId, name: 'ads_manager_view', display_name: 'View Ads Managers', category: 'ads_manager' },
            { module_id: adsManagerModuleId, name: 'ads_manager_create', display_name: 'Create Ads Managers', category: 'ads_manager' },
            { module_id: adsManagerModuleId, name: 'ads_manager_update', display_name: 'Update Ads Managers', category: 'ads_manager' },
            { module_id: adsManagerModuleId, name: 'ads_manager_delete', display_name: 'Delete Ads Managers', category: 'ads_manager' },
            { module_id: adsManagerModuleId, name: 'ads_manager_manage', display_name: 'Full Ads Manager Management', category: 'ads_manager' }
        ];

        for (const perm of permissionsToCreate) {
            // Check if permission already exists
            const [existing] = await pool.query('SELECT id FROM permissions WHERE name = ?', [perm.name]);
            
            if (existing.length === 0) {
                console.log(`   Creating permission: ${perm.name}`);
                await pool.query(`
                    INSERT INTO permissions (name, display_name, category, module_id, is_active, created_at)
                    VALUES (?, ?, ?, ?, 1, NOW())
                `, [perm.name, perm.display_name, perm.category, perm.module_id]);
            } else {
                console.log(`   Permission already exists: ${perm.name}`);
                // Update existing permission to ensure it has correct module_id and category
                await pool.query(`
                    UPDATE permissions 
                    SET display_name = ?, category = ?, module_id = ?
                    WHERE name = ?
                `, [perm.display_name, perm.category, perm.module_id, perm.name]);
            }
        }

        // Step 6: Assign all new permissions to Super Admin role
        console.log('\\n👤 Step 6: Assigning permissions to Super Admin role...');
        
        const [superAdminRole] = await pool.query(`
            SELECT id FROM roles WHERE name = 'super_admin' OR level >= 10 ORDER BY level DESC LIMIT 1
        `);
        
        if (superAdminRole.length > 0) {
            const superAdminId = superAdminRole[0].id;
            console.log(`   Found Super Admin role with ID: ${superAdminId}`);
            
            // Get all new permissions
            const [newPermissions] = await pool.query(`
                SELECT id, name FROM permissions 
                WHERE module_id IN (?, ?, ?, ?) 
                ORDER BY module_id, name
            `, [fbAccountsModuleId, fbPagesModuleId, bmModuleId, adsManagerModuleId]);
            
            for (const perm of newPermissions) {
                // Check if role already has this permission
                const [existing] = await pool.query(`
                    SELECT id FROM role_permissions 
                    WHERE role_id = ? AND permission_id = ?
                `, [superAdminId, perm.id]);
                
                if (existing.length === 0) {
                    console.log(`   Assigning permission: ${perm.name}`);
                    await pool.query(`
                        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
                        VALUES (?, ?, NOW(), NOW())
                    `, [superAdminId, perm.id]);
                } else {
                    console.log(`   Permission already assigned: ${perm.name}`);
                }
            }
        } else {
            console.log('   ⚠️ No Super Admin role found. Please assign permissions manually.');
        }

        // Step 7: Clean up old permissions
        console.log('\\n🧹 Step 7: Cleaning up old permission entries...');
        
        const oldPermissionPatterns = [
            'facebook_pages_create', 'facebook_pages_read', 'facebook_pages_update', 'facebook_pages_delete',
            'bm_view', 'bm_create', 'bm_update', 'bm_delete', 'bm_manage',
            'ads_manager_view', 'ads_manager_create', 'ads_manager_update', 'ads_manager_delete', 'ads_manager_manage'
        ];
        
        for (const pattern of oldPermissionPatterns) {
            const [oldPerms] = await pool.query(`
                SELECT id FROM permissions 
                WHERE name = ? AND (module_id IS NULL OR display_name = '' OR category = 'general')
            `, [pattern]);
            
            if (oldPerms.length > 0) {
                console.log(`   Removing old permission entry: ${pattern}`);
                // Remove from role_permissions first
                await pool.query(`
                    DELETE FROM role_permissions WHERE permission_id IN (${oldPerms.map(() => '?').join(',')})
                `, oldPerms.map(p => p.id));
                
                // Remove the permission itself
                await pool.query(`
                    DELETE FROM permissions WHERE id IN (${oldPerms.map(() => '?').join(',')})
                `, oldPerms.map(p => p.id));
            }
        }

        // Step 8: Summary
        console.log('\\n📊 Step 8: Integration Summary...');
        
        const [finalModules] = await pool.query(`
            SELECT id, name, display_name, is_active 
            FROM modules 
            WHERE name IN ('facebook_accounts', 'facebook_pages', 'business_manager', 'ads_manager', 'bm', 'ads_managers')
            ORDER BY name
        `);
        
        console.log('\\n✅ Integrated Modules:');
        for (const module of finalModules) {
            const [permCount] = await pool.query(
                'SELECT COUNT(*) as count FROM permissions WHERE module_id = ?', 
                [module.id]
            );
            console.log(`   - ${module.display_name} (${module.name}): ${permCount[0].count} permissions`);
        }
        
        const [totalPerms] = await pool.query(`
            SELECT COUNT(*) as count FROM permissions 
            WHERE module_id IN (${finalModules.map(() => '?').join(',')})
        `, finalModules.map(m => m.id));
        
        console.log(`\\n🎉 Integration completed successfully!`);
        console.log(`   Total new permissions created: ${totalPerms[0].count}`);
        console.log(`   All modules are now available in the Role Management system.`);

    } catch (error) {
        console.error('❌ Integration Error:', error.message);
        console.error('❌ Full error:', error);
    } finally {
        try {
            await pool.end();
        } catch (err) {
            console.warn('Warning: Could not close database connection');
        }
        process.exit(0);
    }
}

// Run the integration
integrateNewModulesPermissions();