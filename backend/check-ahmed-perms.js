const { pool } = require('./config/database');

async function checkPerms() {
    try {
        const [perms] = await pool.query(`
            SELECT permission_key, permission_name, module_name
            FROM user_permissions_view
            WHERE user_id = 14
            ORDER BY module_name, permission_key
        `);
        
        console.log('Ahmed (ID: 14) permissions:');
        console.log('Total permissions:', perms.length);
        
        const byModule = {};
        perms.forEach(p => {
            if (!byModule[p.module_name]) byModule[p.module_name] = [];
            byModule[p.module_name].push(p.permission_key);
        });
        
        for (const module in byModule) {
            console.log(`\n${module}:`, byModule[module]);
        }
        
        // Check specifically for delete permissions
        const deletePerms = perms.filter(p => p.permission_key.includes('delete'));
        console.log('\nDelete permissions:', deletePerms.map(p => p.permission_key));
        
        // Check if users.delete exists
        const hasUsersDelete = perms.some(p => p.permission_key === 'users.delete');
        console.log('\nHas users.delete permission:', hasUsersDelete);
        
    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

checkPerms();
