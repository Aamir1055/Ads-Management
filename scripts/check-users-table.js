const { pool } = require('../config/database');

async function checkUsersTable() {
    try {
        console.log('🔍 Checking users table structure...');
        
        // Check if users table exists
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'ads_reporting' 
            AND TABLE_NAME = 'users'
        `);
        
        if (tables.length === 0) {
            console.log('❌ Users table does not exist');
            return;
        }
        
        // Get table structure
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'ads_reporting' 
            AND TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('✅ Users table structure:');
        columns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Check if there are users in the table
        const [users] = await pool.query('SELECT id, username FROM users LIMIT 5');
        
        console.log('\n📋 Sample users:');
        users.forEach(user => {
            console.log(`   - ID: ${user.id}, Username: ${user.username || 'N/A'}`);
        });
        
        // Test the facebook_accounts query
        console.log('\n🧪 Testing facebook_accounts query...');
        try {
            const [accounts] = await pool.query(`
                SELECT 
                    fa.id, 
                    fa.email, 
                    fa.status, 
                    fa.created_by, 
                    u.username as created_by_name
                FROM facebook_accounts fa
                LEFT JOIN users u ON fa.created_by = u.id
                LIMIT 1
            `);
            
            console.log('✅ Facebook accounts query works with username field');
            if (accounts.length > 0) {
                console.log('   Sample:', accounts[0]);
            } else {
                console.log('   No facebook accounts found');
            }
            
        } catch (error) {
            console.log('❌ Facebook accounts query failed:', error.message);
        }
        
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
checkUsersTable();