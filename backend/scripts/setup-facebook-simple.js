const { pool } = require('../config/database');

async function setupFacebookAccountsModule() {
    try {
        console.log('🚀 Starting Facebook Accounts module setup...');
        
        // Step 1: Create the table
        console.log('📝 Creating facebook_accounts table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS facebook_accounts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                authenticator TEXT NULL,
                phone_number VARCHAR(20) NULL,
                id_image_path VARCHAR(500) NULL,
                status ENUM('enabled', 'disabled') DEFAULT 'enabled',
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_facebook_accounts_email (email),
                INDEX idx_facebook_accounts_status (status),
                INDEX idx_facebook_accounts_created_by (created_by)
            )
        `);
        console.log('✅ Table created successfully');
        
        // Step 2: Add permissions
        console.log('📝 Adding permissions...');
        const permissions = [
            ['facebook_accounts_read', 'View Facebook Accounts', 'Facebook Accounts'],
            ['facebook_accounts_create', 'Create Facebook Accounts', 'Facebook Accounts'],
            ['facebook_accounts_update', 'Update Facebook Accounts', 'Facebook Accounts'],
            ['facebook_accounts_delete', 'Delete Facebook Accounts', 'Facebook Accounts']
        ];
        
        for (const [name, display_name, category] of permissions) {
            try {
                await pool.query(
                    'INSERT IGNORE INTO permissions (name, display_name, category, is_active) VALUES (?, ?, ?, 1)',
                    [name, display_name, category]
                );
            } catch (error) {
                console.log(`   Permission ${name} already exists or error:`, error.message);
            }
        }
        console.log('✅ Permissions added');
        
        // Step 3: Assign permissions to admin role (ID = 1)
        console.log('📝 Assigning permissions to admin role...');
        try {
            await pool.query(`
                INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT 1, id FROM permissions WHERE name LIKE 'facebook_accounts_%'
            `);
        } catch (error) {
            console.log('   Role permission assignment error:', error.message);
        }
        console.log('✅ Permissions assigned to admin');
        
        // Step 4: Verification
        console.log('\n🔍 Verifying setup...');
        
        // Check table
        const [tables] = await pool.query("SHOW TABLES LIKE 'facebook_accounts'");
        console.log('✅ Facebook accounts table:', tables.length > 0 ? 'EXISTS' : 'NOT FOUND');
        
        // Check permissions
        const [permissions_check] = await pool.query("SELECT name, display_name FROM permissions WHERE name LIKE 'facebook_accounts_%'");
        console.log('✅ Permissions created:', permissions_check.length);
        permissions_check.forEach(perm => {
            console.log(`   - ${perm.name}: ${perm.display_name}`);
        });
        
        // Check table structure
        const [columns] = await pool.query("DESCRIBE facebook_accounts");
        console.log('✅ Table structure:');
        columns.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`);
        });
        
        console.log('\n🎉 Facebook Accounts module setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('Stack:', error.stack);
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
setupFacebookAccountsModule();