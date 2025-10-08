const { pool } = require('../config/database');

async function addSuspendedStatus() {
    try {
        console.log('🔧 Adding "suspended_temporarily" status to facebook_accounts table...');
        
        // Modify the ENUM to include suspended_temporarily
        const alterQuery = `
            ALTER TABLE facebook_accounts 
            MODIFY COLUMN status ENUM('enabled', 'disabled', 'suspended_temporarily') 
            DEFAULT 'enabled'
        `;
        
        await pool.query(alterQuery);
        
        console.log('✅ Successfully added "suspended_temporarily" status option');
        
        // Verify the change
        const [results] = await pool.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'ads_reporting' 
            AND TABLE_NAME = 'facebook_accounts' 
            AND COLUMN_NAME = 'status'
        `);
        
        console.log('🔍 Current status column definition:');
        console.log('   ', results[0].COLUMN_TYPE);
        
        console.log('🎉 Database schema update completed successfully!');
        
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

// Run the update
addSuspendedStatus();