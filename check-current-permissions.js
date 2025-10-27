const { pool } = require('./config/database');

async function checkCurrentPermissions() {
    try {
        console.log('🔍 Checking current modules and permissions structure...\n');

        // Check existing modules
        console.log('📊 Current Modules:');
        const [modules] = await pool.query('SELECT id, name, display_name, description, is_active FROM modules ORDER BY id');
        if (modules.length === 0) {
            console.log('  (No modules found)');
        } else {
            modules.forEach(module => {
                console.log(`  - ID: ${module.id}, Name: "${module.name}", Display: "${module.display_name}", Active: ${module.is_active}`);
            });
        }

        // Check existing permissions
        console.log('\n🔑 Current Permissions:');
        const [permissions] = await pool.query(`
            SELECT p.id, p.name, p.display_name, p.category, p.module_id, m.name as module_name 
            FROM permissions p 
            LEFT JOIN modules m ON p.module_id = m.id 
            ORDER BY p.module_id, p.id
        `);
        if (permissions.length === 0) {
            console.log('  (No permissions found)');
        } else {
            let currentModule = null;
            permissions.forEach(perm => {
                if (currentModule !== perm.module_name) {
                    currentModule = perm.module_name;
                    console.log(`\n  📦 Module: ${currentModule || 'No Module'}`);
                }
                console.log(`    - ${perm.name} (${perm.display_name}) [${perm.category}]`);
            });
        }

        // Check existing roles
        console.log('\n👥 Current Roles:');
        const [roles] = await pool.query('SELECT id, name, display_name, description, level, is_active FROM roles ORDER BY level');
        if (roles.length === 0) {
            console.log('  (No roles found)');
        } else {
            roles.forEach(role => {
                console.log(`  - ID: ${role.id}, Name: "${role.name}", Display: "${role.display_name}", Level: ${role.level}, Active: ${role.is_active}`);
            });
        }

        // Check role permissions
        console.log('\n🔗 Role-Permission Mappings:');
        const [rolePermissions] = await pool.query(`
            SELECT 
                r.name as role_name, 
                m.name as module_name, 
                p.name as permission_name,
                rp.can_create, rp.can_read, rp.can_update, rp.can_delete
            FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.id
            JOIN permissions p ON rp.permission_id = p.id
            LEFT JOIN modules m ON p.module_id = m.id
            ORDER BY r.id, m.id, p.id
        `);
        
        if (rolePermissions.length === 0) {
            console.log('  (No role-permission mappings found)');
        } else {
            let currentRole = null;
            let currentModule = null;
            rolePermissions.forEach(rp => {
                if (currentRole !== rp.role_name) {
                    currentRole = rp.role_name;
                    console.log(`\n  👤 Role: ${currentRole}`);
                    currentModule = null;
                }
                if (currentModule !== rp.module_name) {
                    currentModule = rp.module_name;
                    console.log(`    📦 ${currentModule || 'No Module'}:`);
                }
                const perms = [];
                if (rp.can_create) perms.push('CREATE');
                if (rp.can_read) perms.push('READ');
                if (rp.can_update) perms.push('UPDATE');
                if (rp.can_delete) perms.push('DELETE');
                console.log(`      - ${rp.permission_name}: [${perms.join(', ')}]`);
            });
        }

        console.log('\n✅ Permission structure check completed.');

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
checkCurrentPermissions();