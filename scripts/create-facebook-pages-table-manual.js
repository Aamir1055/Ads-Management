const { pool } = require('../config/database');

async function createFacebookPagesTable() {
    try {
        console.log('🚀 Creating Facebook Pages table manually...');

        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS facebook_pages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                facebook_account_id INT NOT NULL,
                page_name VARCHAR(255) NOT NULL,
                page_description TEXT NULL,
                status ENUM('enabled', 'disabled', 'suspended_temporarily') DEFAULT 'enabled',
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Foreign key constraints
                FOREIGN KEY (facebook_account_id) REFERENCES facebook_accounts(id) ON DELETE CASCADE,
                
                -- Indexes for performance
                INDEX idx_facebook_pages_account_id (facebook_account_id),
                INDEX idx_facebook_pages_status (status),
                INDEX idx_facebook_pages_created_by (created_by),
                INDEX idx_facebook_pages_page_name (page_name),
                
                -- Unique constraint to prevent duplicate page names per account
                UNIQUE KEY unique_page_per_account (facebook_account_id, page_name)
            )
        `;

        await pool.query(createTableSQL);
        console.log('✅ Facebook pages table created successfully');

        // Verify table was created
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'ads_reporting' 
            AND TABLE_NAME = 'facebook_pages'
        `);
        
        if (tables.length > 0) {
            console.log('✅ Facebook pages table verified: EXISTS');
            
            // Check table structure
            const [columns] = await pool.query(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'ads_reporting' 
                AND TABLE_NAME = 'facebook_pages'
                ORDER BY ORDINAL_POSITION
            `);
            
            console.log('✅ Table structure:');
            columns.forEach(col => {
                console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'required'}) ${col.COLUMN_DEFAULT ? `[default: ${col.COLUMN_DEFAULT}]` : ''}`);
            });

            // Create auto-disable trigger
            console.log('📝 Creating trigger for auto-disabling pages...');
            const triggerSQL = `
                CREATE TRIGGER facebook_account_status_change 
                AFTER UPDATE ON facebook_accounts
                FOR EACH ROW
                BEGIN
                    -- If Facebook account is disabled, disable all its pages
                    IF NEW.status = 'disabled' AND OLD.status != 'disabled' THEN
                        UPDATE facebook_pages 
                        SET status = 'disabled', updated_at = CURRENT_TIMESTAMP 
                        WHERE facebook_account_id = NEW.id AND status != 'disabled';
                    END IF;
                END
            `;
            
            try {
                await pool.query('DROP TRIGGER IF EXISTS facebook_account_status_change');
                await pool.query(triggerSQL);
                console.log('   ✅ Auto-disable trigger created successfully');
            } catch (error) {
                console.log(`   ⚠️ Trigger creation failed: ${error.message}`);
            }

        } else {
            console.log('❌ Facebook pages table verification failed');
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

// Run the setup
createFacebookPagesTable();