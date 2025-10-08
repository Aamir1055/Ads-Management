const { pool } = require('../config/database');

async function cleanupFacebookAccounts() {
    try {
        console.log('🧹 Cleaning up Facebook accounts table...');
        
        // Check how many accounts exist
        const [count] = await pool.query('SELECT COUNT(*) as total FROM facebook_accounts');
        console.log(`📊 Found ${count[0].total} Facebook accounts`);
        
        if (count[0].total > 0) {
            // Show existing accounts
            const [accounts] = await pool.query('SELECT id, email, status FROM facebook_accounts');
            console.log('📋 Existing accounts:');
            accounts.forEach(account => {
                console.log(`   - ID: ${account.id}, Email: ${account.email}, Status: ${account.status}`);
            });
            
            // Clear all accounts
            const [result] = await pool.query('DELETE FROM facebook_accounts');
            console.log(`✅ Deleted ${result.affectedRows} Facebook accounts`);
        } else {
            console.log('✅ No Facebook accounts to clean up');
        }
        
        // Reset auto increment
        await pool.query('ALTER TABLE facebook_accounts AUTO_INCREMENT = 1');
        console.log('🔄 Reset auto increment counter');
        
        console.log('🎉 Cleanup completed successfully!');
        
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

// Run the cleanup
cleanupFacebookAccounts();