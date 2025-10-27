const { pool } = require('../config/database');

async function verifyTable() {
    try {
        console.log('🔍 Checking for facebook_pages table...');

        // Show all tables in database
        const [allTables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
        `);
        
        console.log('📋 All tables in database:');
        allTables.forEach(table => {
            console.log(`   - ${table.TABLE_NAME}`);
        });

        // Check specifically for facebook_pages
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'facebook_pages'
        `);
        
        if (tables.length > 0) {
            console.log('✅ Facebook pages table found!');
            
            // Get table structure
            const [columns] = await pool.query(`
                DESCRIBE facebook_pages
            `);
            
            console.log('📊 Table structure:');
            columns.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'} ${col.Default ? `[default: ${col.Default}]` : ''} ${col.Key ? `[${col.Key}]` : ''}`);
            });

            // Check triggers
            const [triggers] = await pool.query(`
                SELECT TRIGGER_NAME 
                FROM INFORMATION_SCHEMA.TRIGGERS 
                WHERE TRIGGER_SCHEMA = DATABASE()
                AND TRIGGER_NAME = 'facebook_account_status_change'
            `);
            
            if (triggers.length > 0) {
                console.log('✅ Auto-disable trigger exists');
            } else {
                console.log('⚠️ Auto-disable trigger missing');
            }
            
        } else {
            console.log('❌ Facebook pages table not found');
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

verifyTable();