const { pool } = require('./config/database');

async function debugRole() {
    try {
        console.log('🔍 Debugging SuperAdmin Role Issue');
        console.log('=====================================');
        
        // Get admin user details
        const [users] = await pool.query(`
            SELECT u.id, u.username, u.role_id, r.name as role_name, r.level as role_level
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.username = 'admin'
        `);
        
        if (users.length === 0) {
            console.log('❌ No admin user found');
            return;
        }
        
        const user = users[0];
        console.log('\n👤 Admin User Details:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role ID: ${user.role_id}`);
        console.log(`   Role Name: "${user.role_name}"`);
        console.log(`   Role Level: ${user.role_level}`);
        
        // Check SuperAdmin criteria
        console.log('\n🔍 SuperAdmin Check Criteria:');
        const roleLevel = Number(user.role_level) || 0;
        const roleName = user.role_name || '';
        
        console.log(`   Role Level >= 10: ${roleLevel >= 10} (current: ${roleLevel})`);
        console.log(`   Role Name === 'SuperAdmin': ${roleName === 'SuperAdmin'}`);
        console.log(`   Role Name === 'Super Admin': ${roleName === 'Super Admin'}`);
        console.log(`   Role Name === 'super_admin': ${roleName === 'super_admin'}`);
        console.log(`   Role Name === 'superadmin': ${roleName === 'superadmin'}`);
        console.log(`   Role Name === 'SUPERADMIN': ${roleName === 'SUPERADMIN'}`);
        
        const isSuperAdmin = (
            roleLevel >= 10 ||
            roleName === 'SuperAdmin' ||
            roleName === 'Super Admin' ||
            roleName === 'super_admin' ||
            roleName === 'superadmin' ||
            roleName === 'SUPERADMIN'
        );
        
        console.log(`\n✅ Should be SuperAdmin: ${isSuperAdmin}`);
        
        if (!isSuperAdmin) {
            console.log('\n🔧 Potential Fixes:');
            console.log('   1. Change role level to >= 10');
            console.log('   2. Change role name to one of the accepted values');
            
            // Update the role to have level 10
            console.log('\n🔧 Applying fix: Setting role level to 10...');
            await pool.query('UPDATE roles SET level = 10 WHERE id = ?', [user.role_id]);
            console.log('✅ Role level updated to 10');
        }
        
        pool.end();
    } catch (error) {
        console.error('Error:', error);
        pool.end();
    }
}

debugRole();
