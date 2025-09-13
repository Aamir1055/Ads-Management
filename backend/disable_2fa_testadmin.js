const mysql = require('mysql2/promise');
require('dotenv').config();

async function disable2FAForTestAdmin() {
    console.log('🔧 Disabling 2FA for testadmin user...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ads reporting',
        port: process.env.DB_PORT || 3306
    });

    try {
        const username = 'testadmin';
        
        // Check current 2FA status
        console.log('🔍 Checking current 2FA status...');
        const [currentUser] = await connection.execute(`
            SELECT 
                id, 
                username, 
                is_active,
                twofa_enabled,
                is_2fa_enabled,
                twofa_secret,
                two_factor_secret,
                auth_token
            FROM users 
            WHERE username = ?
        `, [username]);

        if (currentUser.length === 0) {
            console.log('❌ User testadmin not found!');
            return;
        }

        const user = currentUser[0];
        console.log('\n📋 Current User Status:');
        console.log('─'.repeat(40));
        console.log(`👤 Username: ${user.username}`);
        console.log(`🆔 User ID: ${user.id}`);
        console.log(`✅ Active: ${user.is_active ? 'Yes' : 'No'}`);
        console.log(`🔐 twofa_enabled: ${user.twofa_enabled ? 'Yes' : 'No'}`);
        console.log(`🔐 is_2fa_enabled: ${user.is_2fa_enabled ? 'Yes' : 'No'}`);
        console.log(`🔑 Has twofa_secret: ${user.twofa_secret ? 'Yes' : 'No'}`);
        console.log(`🔑 Has two_factor_secret: ${user.two_factor_secret ? 'Yes' : 'No'}`);
        console.log(`🎫 Has auth_token: ${user.auth_token ? 'Yes' : 'No'}`);

        // Disable all 2FA related fields
        console.log('\n🚫 Disabling 2FA completely...');
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
            WHERE username = ?
        `, [username]);

        // Verify the changes
        const [updatedUser] = await connection.execute(`
            SELECT 
                id, 
                username, 
                is_active,
                twofa_enabled,
                is_2fa_enabled,
                twofa_secret,
                two_factor_secret,
                auth_token,
                r.name as role_name,
                r.display_name as role_display_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.username = ?
        `, [username]);

        const updated = updatedUser[0];
        console.log('\n✅ Updated User Status:');
        console.log('─'.repeat(40));
        console.log(`👤 Username: ${updated.username}`);
        console.log(`🛡️  Role: ${updated.role_display_name}`);
        console.log(`✅ Active: ${updated.is_active ? 'Yes' : 'No'}`);
        console.log(`🔐 twofa_enabled: ${updated.twofa_enabled ? 'Yes' : 'No'}`);
        console.log(`🔐 is_2fa_enabled: ${updated.is_2fa_enabled ? 'Yes' : 'No'}`);
        console.log(`🔑 twofa_secret: ${updated.twofa_secret || 'NULL'}`);
        console.log(`🔑 two_factor_secret: ${updated.two_factor_secret || 'NULL'}`);
        console.log(`🎫 auth_token: ${updated.auth_token || 'NULL'}`);

        console.log('\n🎉 Perfect! The testadmin user is now ready for simple login:');
        console.log('─'.repeat(50));
        console.log('👤 Username: testadmin');
        console.log('🔑 Password: password123');
        console.log('🚫 2FA: DISABLED (no additional verification needed)');
        console.log('🛡️  Role: Super Administrator (full access)');
        
        console.log('\n💡 Login Process:');
        console.log('1. Enter username: testadmin');
        console.log('2. Enter password: password123'); 
        console.log('3. Click login - should work immediately!');
        console.log('4. No 2FA code required');
        console.log('5. You\'ll receive access and refresh tokens');

        console.log('\n📝 API Test:');
        console.log('POST /api/auth/login');
        console.log('Body: {"username": "testadmin", "password": "password123"}');
        console.log('Expected: Success with tokens (no 2FA step)');

    } catch (error) {
        console.error('❌ Error disabling 2FA:', error.message);
    } finally {
        await connection.end();
    }
}

// Run the script
disable2FAForTestAdmin()
    .then(() => {
        console.log('\n✅ 2FA disabled successfully for testadmin!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Failed to disable 2FA:', error.message);
        process.exit(1);
    });
