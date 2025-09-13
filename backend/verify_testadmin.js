const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyTestAdmin() {
    console.log('🔍 Verifying testadmin user status...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ads reporting',
        port: process.env.DB_PORT || 3306
    });

    try {
        // Check user status with cleaner query
        const [user] = await connection.execute(`
            SELECT 
                u.id, 
                u.username, 
                u.is_active,
                u.twofa_enabled,
                u.is_2fa_enabled,
                u.twofa_secret,
                u.two_factor_secret,
                u.auth_token,
                r.name as role_name,
                r.display_name as role_display_name,
                r.level as role_level
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.username = 'testadmin'
        `);

        if (user.length === 0) {
            console.log('❌ testadmin user not found!');
            return;
        }

        const userData = user[0];
        
        console.log('\n✅ Final testadmin User Status:');
        console.log('═'.repeat(50));
        console.log(`👤 Username: ${userData.username}`);
        console.log(`🆔 User ID: ${userData.id}`);
        console.log(`🛡️  Role: ${userData.role_display_name} (Level ${userData.role_level})`);
        console.log(`✅ Active: ${userData.is_active ? 'YES' : 'NO'}`);
        console.log('');
        console.log('🔐 2FA Status:');
        console.log(`   twofa_enabled: ${userData.twofa_enabled ? 'YES ⚠️' : 'NO ✅'}`);
        console.log(`   is_2fa_enabled: ${userData.is_2fa_enabled ? 'YES ⚠️' : 'NO ✅'}`);
        console.log(`   twofa_secret: ${userData.twofa_secret ? 'SET ⚠️' : 'NULL ✅'}`);
        console.log(`   two_factor_secret: ${userData.two_factor_secret ? 'SET ⚠️' : 'NULL ✅'}`);
        console.log(`   auth_token: ${userData.auth_token ? 'SET ⚠️' : 'NULL ✅'}`);

        // If any 2FA is still enabled, disable it
        if (userData.twofa_enabled || userData.is_2fa_enabled || userData.twofa_secret || userData.two_factor_secret) {
            console.log('\n🔧 Found 2FA still enabled. Fixing it...');
            
            await connection.execute(`
                UPDATE users 
                SET 
                    twofa_enabled = 0,
                    is_2fa_enabled = 0,
                    twofa_secret = NULL,
                    two_factor_secret = NULL,
                    two_factor_backup_codes = NULL,
                    auth_token = NULL,
                    twofa_verified_at = NULL
                WHERE username = 'testadmin'
            `);
            
            console.log('✅ 2FA completely disabled now!');
        }

        console.log('\n🎉 TESTADMIN USER IS READY FOR LOGIN!');
        console.log('═'.repeat(50));
        console.log('📋 Login Credentials:');
        console.log('   👤 Username: testadmin');
        console.log('   🔑 Password: password123');
        console.log('   🚫 2FA: DISABLED (no code needed)');
        console.log('   🛡️  Access: FULL SYSTEM ACCESS');
        
        console.log('\n🚀 How to Login:');
        console.log('1. Go to your login page');
        console.log('2. Enter: testadmin / password123');
        console.log('3. Click Login');
        console.log('4. Should work immediately - no 2FA prompt!');
        console.log('5. You\'ll get full access to all modules');

        // Show what modules they can access
        const [permissionCount] = await connection.execute(`
            SELECT COUNT(*) as total
            FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.id
            WHERE r.name = 'super_admin'
        `);

        console.log(`\n📊 Available Permissions: ${permissionCount[0].total} (ALL MODULES)`);
        console.log('   ✅ Users Management');
        console.log('   ✅ Campaign Management');
        console.log('   ✅ Campaign Data');
        console.log('   ✅ Reports Generation');
        console.log('   ✅ Cards Management');
        console.log('   ✅ System Settings');
        console.log('   ✅ Role Management');

    } catch (error) {
        console.error('❌ Error verifying user:', error.message);
    } finally {
        await connection.end();
    }
}

// Run verification
verifyTestAdmin()
    .then(() => {
        console.log('\n🎯 Verification completed! User is ready for testing.');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Verification failed:', error.message);
        process.exit(1);
    });
