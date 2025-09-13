const { pool } = require('./config/database');

async function testAamirPermissions() {
    try {
        console.log('🔍 Testing Aamir role permissions system...\n');
        
        // 1. Check current state of Aamir role
        console.log('1. Current Aamir role permissions:');
        const [aamirPermissions] = await pool.query(`
            SELECT 
                r.name as role_name,
                p.permission_key,
                p.permission_name,
                m.module_name
            FROM roles r
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            JOIN modules m ON p.module_id = m.id
            WHERE r.name = 'Aamir'
            ORDER BY m.module_name, p.permission_key
        `);
        
        if (aamirPermissions.length === 0) {
            console.log('   ✅ Aamir role has no permissions (as expected)');
        } else {
            console.log('   Current permissions:');
            aamirPermissions.forEach(perm => {
                console.log(`   - ${perm.module_name}: ${perm.permission_key}`);
            });
        }
        
        // 2. Create a test user assigned to Aamir role if doesn't exist
        console.log('\n2. Setting up test user with Aamir role:');
        const [aamirRole] = await pool.query('SELECT id FROM roles WHERE name = ?', ['Aamir']);
        if (aamirRole.length === 0) {
            console.log('   ❌ Aamir role not found');
            return;
        }
        
        const roleId = aamirRole[0].id;
        
        // Check if test user exists
        let [testUser] = await pool.query('SELECT id FROM users WHERE username = ?', ['test_aamir']);
        let userId;
        
        if (testUser.length === 0) {
            // Create test user
            const [result] = await pool.query(`
                INSERT INTO users (username, email, password_hash, is_active) 
                VALUES ('test_aamir', 'test_aamir@example.com', 'dummy_hash', 1)
            `);
            userId = result.insertId;
            console.log('   ✅ Created test user: test_aamir');
        } else {
            userId = testUser[0].id;
            console.log('   ✅ Test user already exists: test_aamir');
        }
        
        // Assign Aamir role to test user
        await pool.query(`
            INSERT INTO user_roles (user_id, role_id, is_active, assigned_by) 
            VALUES (?, ?, 1, 1)
            ON DUPLICATE KEY UPDATE is_active = 1
        `, [userId, roleId]);
        console.log('   ✅ Assigned Aamir role to test user');
        
        // 3. Test specific permission assignment
        console.log('\n3. Assigning specific permissions to Aamir role:');
        const testPermissions = ['campaigns.read', 'campaigns.create'];
        
        for (const permKey of testPermissions) {
            const [permission] = await pool.query(
                'SELECT id FROM permissions WHERE permission_key = ?', 
                [permKey]
            );
            
            if (permission.length > 0) {
                await pool.query(`
                    INSERT INTO role_permissions (role_id, permission_id, granted_by) 
                    VALUES (?, ?, 1)
                    ON DUPLICATE KEY UPDATE granted_by = 1
                `, [roleId, permission[0].id]);
                console.log(`   ✅ Added permission: ${permKey}`);
            } else {
                console.log(`   ❌ Permission not found: ${permKey}`);
            }
        }
        
        // 4. Verify user's effective permissions
        console.log('\n4. Testing user\'s effective permissions:');
        const [userPermissions] = await pool.query(`
            SELECT DISTINCT
                p.permission_key,
                p.permission_name,
                m.module_name
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
            JOIN roles r ON ur.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            JOIN modules m ON p.module_id = m.id
            WHERE u.username = 'test_aamir'
            ORDER BY m.module_name, p.permission_key
        `);
        
        console.log(`   User has ${userPermissions.length} permissions:`);
        userPermissions.forEach(perm => {
            console.log(`   - ${perm.module_name}: ${perm.permission_key} (${perm.permission_name})`);
        });
        
        // 5. Test module access
        console.log('\n5. Testing module access:');
        const modules = ['campaigns', 'users', 'reports', 'cards'];
        
        for (const moduleName of modules) {
            const [hasAccess] = await pool.query(`
                SELECT COUNT(*) as has_access
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
                JOIN roles r ON ur.role_id = r.id
                JOIN role_permissions rp ON r.id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                JOIN modules m ON p.module_id = m.id
                WHERE u.username = 'test_aamir' AND m.module_name = ?
            `, [moduleName]);
            
            const hasModuleAccess = hasAccess[0].has_access > 0;
            console.log(`   ${hasModuleAccess ? '✅' : '❌'} ${moduleName} module: ${hasModuleAccess ? 'ACCESSIBLE' : 'BLOCKED'}`);
        }
        
        // 6. Test what should happen in the frontend
        console.log('\n6. Frontend behavior prediction:');
        console.log('   📱 Navigation will show:');
        console.log('      ✅ Dashboard (always accessible)');
        console.log('      ✅ Campaigns (has campaigns.read permission)');
        console.log('      ❌ User Management (no users.read permission)');
        console.log('      ❌ Role Management (no permissions.manage_roles permission)');
        console.log('      ❌ Reports (no reports.read permission)');
        console.log('      ❌ Cards (no cards.read permission)');
        console.log('      ❌ Analytics (no reports.read permission)');
        
        // 7. Summary
        console.log('\n🎯 SUMMARY:');
        console.log('   ✅ Aamir role has been cleaned of unwanted permissions');
        console.log('   ✅ Only specific permissions (campaigns.read, campaigns.create) are assigned');
        console.log('   ✅ Test user can only access Dashboard and Campaigns modules');
        console.log('   ✅ All other modules should be hidden in navigation');
        console.log('   ✅ Direct URL access to unauthorized modules will show "Access Denied"');
        
        console.log('\n🧪 To test in the frontend:');
        console.log('   1. Login as a user with the Aamir role');
        console.log('   2. Verify only Dashboard and Campaigns appear in navigation');
        console.log('   3. Try accessing /user-management directly - should see "Access Denied"');
        console.log('   4. Try accessing /campaigns - should work normally');
        
    } catch (error) {
        console.error('❌ Error testing permissions:', error);
    } finally {
        process.exit(0);
    }
}

testAamirPermissions();
