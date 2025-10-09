const { pool } = require('../config/database');

async function createBMAndAdsManagerTables() {
    try {
        console.log('🚀 Creating BM and Ads Manager tables...');

        // Create BM table
        const createBMTableSQL = `
            CREATE TABLE IF NOT EXISTS bm (
                id INT PRIMARY KEY AUTO_INCREMENT,
                bm_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone_number VARCHAR(50) NULL,
                status ENUM('enabled', 'disabled', 'suspended_temporarily') DEFAULT 'enabled',
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Indexes for performance
                INDEX idx_bm_status (status),
                INDEX idx_bm_created_by (created_by),
                INDEX idx_bm_email (email),
                INDEX idx_bm_name (bm_name),
                
                -- Unique constraint on email
                UNIQUE KEY unique_bm_email (email)
            )
        `;

        await pool.query(createBMTableSQL);
        console.log('✅ BM table created successfully');

        // Create Ads Manager table
        const createAdsManagerTableSQL = `
            CREATE TABLE IF NOT EXISTS ads_managers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                bm_id INT NOT NULL,
                ads_manager_name VARCHAR(255) NOT NULL,
                status ENUM('enabled', 'disabled', 'suspended_temporarily') DEFAULT 'enabled',
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Foreign key constraints
                FOREIGN KEY (bm_id) REFERENCES bm(id) ON DELETE CASCADE,
                
                -- Indexes for performance
                INDEX idx_ads_manager_bm_id (bm_id),
                INDEX idx_ads_manager_status (status),
                INDEX idx_ads_manager_created_by (created_by),
                INDEX idx_ads_manager_name (ads_manager_name),
                
                -- Unique constraint to prevent duplicate ads manager names per BM
                UNIQUE KEY unique_ads_manager_per_bm (bm_id, ads_manager_name)
            )
        `;

        await pool.query(createAdsManagerTableSQL);
        console.log('✅ Ads Manager table created successfully');

        // Create auto-disable trigger for BM -> Ads Managers
        console.log('📝 Creating trigger for auto-disabling ads managers...');
        const triggerSQL = `
            CREATE TRIGGER bm_status_change_trigger 
            AFTER UPDATE ON bm
            FOR EACH ROW
            BEGIN
                -- If BM is disabled, disable all its ads managers
                IF NEW.status = 'disabled' AND OLD.status != 'disabled' THEN
                    UPDATE ads_managers 
                    SET status = 'disabled', updated_at = CURRENT_TIMESTAMP 
                    WHERE bm_id = NEW.id AND status != 'disabled';
                END IF;
            END
        `;
        
        try {
            await pool.query('DROP TRIGGER IF EXISTS bm_status_change_trigger');
            await pool.query(triggerSQL);
            console.log('   ✅ Auto-disable trigger created successfully');
        } catch (error) {
            console.log(`   ⚠️ Trigger creation failed: ${error.message}`);
        }

        // Verify tables were created
        console.log('\n📋 Verifying table creation:');
        
        // Check BM table
        const [bmTables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bm'
        `);
        
        if (bmTables.length > 0) {
            console.log('✅ BM table verified: EXISTS');
            
            // Check BM table structure
            const [bmColumns] = await pool.query(`DESCRIBE bm`);
            console.log('📊 BM table structure:');
            bmColumns.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'} ${col.Default ? `[default: ${col.Default}]` : ''} ${col.Key ? `[${col.Key}]` : ''}`);
            });
        } else {
            console.log('❌ BM table verification failed');
        }

        // Check Ads Manager table
        const [amTables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'ads_managers'
        `);
        
        if (amTables.length > 0) {
            console.log('✅ Ads Manager table verified: EXISTS');
            
            // Check Ads Manager table structure
            const [amColumns] = await pool.query(`DESCRIBE ads_managers`);
            console.log('📊 Ads Manager table structure:');
            amColumns.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'} ${col.Default ? `[default: ${col.Default}]` : ''} ${col.Key ? `[${col.Key}]` : ''}`);
            });
        } else {
            console.log('❌ Ads Manager table verification failed');
        }

        // Check trigger
        const [triggers] = await pool.query(`
            SELECT TRIGGER_NAME 
            FROM INFORMATION_SCHEMA.TRIGGERS 
            WHERE TRIGGER_SCHEMA = DATABASE()
            AND TRIGGER_NAME = 'bm_status_change_trigger'
        `);
        
        if (triggers.length > 0) {
            console.log('✅ Auto-disable trigger exists');
        } else {
            console.log('⚠️ Auto-disable trigger missing');
        }

        console.log('\n✅ Database setup completed successfully!');

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
createBMAndAdsManagerTables();