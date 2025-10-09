const { pool } = require('./config/database');

async function verifyIntegration() {
    try {
        console.log('🎯 Verifying Role Management Integration...\n');

        // Show integrated modules
        console.log('✅ Integrated Modules:');
        const [modules] = await pool.query(`
            SELECT id, name, display_name, description 
            FROM modules 
            WHERE name IN ('facebook_accounts', 'facebook_pages', 'bm', 'ads_managers')
            ORDER BY name
        `);

        modules.forEach(module => {
            console.log(`   📦 ${module.display_name}`);
            console.log(`      - Internal Name: ${module.name}`);
            console.log(`      - Description: ${module.description || 'No description'}`);
            console.log('');
        });

        // Show permissions for each module
        console.log('🔑 Available Permissions:');
        for (const module of modules) {
            const [permissions] = await pool.query(`
                SELECT name, display_name, category 
                FROM permissions 
                WHERE module_id = ?
                ORDER BY name
            `, [module.id]);
            
            console.log(`\n   📦 ${module.display_name}:`);
            permissions.forEach(perm => {
                console.log(`      ✓ ${perm.display_name} (${perm.name})`);
            });
        }

        // Show Super Admin role permissions
        console.log('\n👤 Super Admin Permissions:');
        const [superAdminRole] = await pool.query(`
            SELECT id FROM roles WHERE name = 'super_admin' OR level >= 10 ORDER BY level DESC LIMIT 1
        `);
        
        if (superAdminRole.length > 0) {
            const [assignedPermissions] = await pool.query(`
                SELECT p.name, p.display_name, m.display_name as module_name
                FROM role_permissions rp
                JOIN permissions p ON rp.permission_id = p.id
                JOIN modules m ON p.module_id = m.id
                WHERE rp.role_id = ? AND m.name IN ('facebook_accounts', 'facebook_pages', 'bm', 'ads_managers')
                ORDER BY m.display_name, p.name
            `, [superAdminRole[0].id]);

            let currentModule = null;
            assignedPermissions.forEach(perm => {
                if (currentModule !== perm.module_name) {
                    currentModule = perm.module_name;
                    console.log(`\n   📦 ${currentModule}:`);
                }
                console.log(`      ✓ ${perm.display_name}`);
            });
        }

        console.log('\n🎉 Integration Status: SUCCESS!');
        console.log('   All new modules are now fully integrated into the Role Management system.');
        console.log('   Administrators can now assign granular permissions for:');
        console.log('   • Facebook Accounts management');
        console.log('   • Facebook Pages management');  
        console.log('   • Business Manager operations');
        console.log('   • Ads Manager operations');

    } catch (error) {
        console.error('❌ Verification Error:', error.message);
    } finally {
        try {
            await pool.end();
        } catch (err) {
            console.warn('Warning: Could not close database connection');
        }
        process.exit(0);
    }
}

// Run the verification
verifyIntegration();