const { pool } = require('./config/database');

async function checkUserRoles() {
    try {
        console.log('Checking user role assignments...');
        
        // Check current role assignments
        console.log('\n1. Current user role assignments:');
        const [userRoles] = await pool.query(`
            SELECT 
                u.id as user_id,
                u.username,
                r.id as role_id,
                r.name as role_name,
                ur.is_active,
                ur.assigned_at,
                ur.expires_at
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.username IN ('ahmed', 'aamir', 'testadmin')
            ORDER BY u.username, ur.assigned_at
        `);
        console.log('User roles:', userRoles);
        
        // Check available roles
        console.log('\n2. Available roles:');
        const [roles] = await pool.query('SELECT id, name, level, is_active FROM roles ORDER BY level DESC');
        console.log('Roles:', roles);
        
        // Check if ahmed has any role assignment
        const [ahmedRoles] = await pool.query(`
            SELECT * FROM user_roles 
            WHERE user_id = (SELECT id FROM users WHERE username = 'ahmed')
        `);
        console.log('\n3. Ahmed role assignments:', ahmedRoles);
        
        if (ahmedRoles.length === 0) {
            console.log('\n❌ Ahmed has no role assignments! Assigning admin role...');
            
            // Get admin role ID
            const [adminRole] = await pool.query('SELECT id FROM roles WHERE name = ? AND is_active = 1', ['admin']);
            const [ahmedUser] = await pool.query('SELECT id FROM users WHERE username = ?', ['ahmed']);
            
            if (adminRole.length > 0 && ahmedUser.length > 0) {
                // Use aamir (user ID 13) as the assigner since they have the Super Admin role
                await pool.query(`
                    INSERT INTO user_roles (user_id, role_id, is_active, assigned_by, assigned_at) 
                    VALUES (?, ?, 1, 13, NOW())
                `, [ahmedUser[0].id, adminRole[0].id]);
                console.log('✅ Admin role assigned to ahmed');
            } else {
                console.log('❌ Could not find admin role or ahmed user');
            }
        } else {
            // Check if the role is active
            const inactiveRoles = ahmedRoles.filter(role => !role.is_active);
            if (inactiveRoles.length > 0) {
                console.log('\n⚠️ Ahmed has inactive role assignments. Activating them...');
                await pool.query('UPDATE user_roles SET is_active = 1 WHERE user_id = ?', [ahmedRoles[0].user_id]);
                console.log('✅ Role assignments activated');
            }
        }
        
        // Test the view again for ahmed
        console.log('\n4. Testing permissions view for ahmed after fixes:');
        const [ahmedPerms] = await pool.query(`
            SELECT permission_key, permission_name, module_name
            FROM user_permissions_view
            WHERE user_id = (SELECT id FROM users WHERE username = 'ahmed')
            ORDER BY module_name, permission_key
        `);
        console.log('Ahmed permissions after fix:', ahmedPerms);
        
        console.log('\n✅ User role check completed!');
        
    } catch (error) {
        console.error('❌ Error checking user roles:', error);
    } finally {
        process.exit(0);
    }
}

checkUserRoles();
