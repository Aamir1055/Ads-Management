const { pool } = require('../config/database');

async function addEmailPhoneToAdsManagers() {
    try {
        console.log('🚀 Adding email and phone_number fields to ads_managers table...');

        // Check current table structure
        const [currentColumns] = await pool.query(`DESCRIBE ads_managers`);
        const columnNames = currentColumns.map(col => col.Field);
        
        console.log('📋 Current ads_managers table columns:', columnNames);

        // Add email column if it doesn't exist
        if (!columnNames.includes('email')) {
            console.log('➕ Adding email column...');
            await pool.query(`
                ALTER TABLE ads_managers 
                ADD COLUMN email VARCHAR(255) NULL AFTER ads_manager_name
            `);
            
            // Add index for email
            await pool.query(`
                ALTER TABLE ads_managers 
                ADD INDEX idx_ads_manager_email (email)
            `);
            
            console.log('✅ Email column added successfully');
        } else {
            console.log('✅ Email column already exists');
        }

        // Add phone_number column if it doesn't exist
        if (!columnNames.includes('phone_number')) {
            console.log('➕ Adding phone_number column...');
            await pool.query(`
                ALTER TABLE ads_managers 
                ADD COLUMN phone_number VARCHAR(50) NULL AFTER email
            `);
            
            console.log('✅ Phone number column added successfully');
        } else {
            console.log('✅ Phone number column already exists');
        }

        // Verify the updated structure
        console.log('\\n📋 Verifying updated table structure:');
        const [updatedColumns] = await pool.query(`DESCRIBE ads_managers`);
        console.log('📊 Updated ads_managers table structure:');
        updatedColumns.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'} ${col.Default ? `[default: ${col.Default}]` : ''} ${col.Key ? `[${col.Key}]` : ''}`);
        });

        console.log('\\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration Error:', error.message);
        console.error('❌ Full error:', error);
    } finally {
        try {
            await pool.end();
        } catch (err) {
            console.warn('Warning: Could not close database connection');
        }
        process.exit(0);
    }
}

// Run the migration
addEmailPhoneToAdsManagers();