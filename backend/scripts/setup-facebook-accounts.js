const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupFacebookAccountsModule() {
    try {
        console.log('🚀 Starting Facebook Accounts module setup...');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, '../../setup-facebook-accounts-db.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Split SQL into individual statements
        const statements = sqlContent
            .split(';')
            .filter(statement => statement.trim() && !statement.trim().startsWith('--'))
            .filter(statement => !statement.trim().toLowerCase().includes('commit'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                try {
                    console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
                    const [result] = await pool.query(statement);
                    
                    // Log results for SELECT statements
                    if (statement.toLowerCase().startsWith('select')) {
                        console.log('   Result:', result);
                    }
                } catch (error) {
                    if (error.code !== 'ER_DUP_ENTRY' && !error.message.includes('already exists')) {
                        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                        console.error('   Statement:', statement);
                    } else {
                        console.log(`   ℹ️  Skipped (already exists): Statement ${i + 1}`);
                    }
                }
            }
        }
        
        // Test the setup by checking if table exists and permissions are created
        console.log('\n🔍 Verifying setup...');
        
        // Check table
        const [tables] = await pool.query("SHOW TABLES LIKE 'facebook_accounts'");
        console.log('✅ Facebook accounts table:', tables.length > 0 ? 'EXISTS' : 'NOT FOUND');
        
        // Check permissions
        const [permissions] = await pool.query("SELECT name, display_name FROM permissions WHERE name LIKE 'facebook_accounts_%'");
        console.log('✅ Permissions created:', permissions.length);
        permissions.forEach(perm => {
            console.log(`   - ${perm.name}: ${perm.display_name}`);
        });
        
        // Check role permissions (for admin role)
        const [rolePerms] = await pool.query(`
            SELECT p.name, r.name as role_name 
            FROM role_permissions rp 
            JOIN permissions p ON rp.permission_id = p.id 
            JOIN roles r ON rp.role_id = r.id 
            WHERE p.name LIKE 'facebook_accounts_%'
        `);
        console.log('✅ Role permissions assigned:', rolePerms.length);
        rolePerms.forEach(perm => {
            console.log(`   - ${perm.role_name}: ${perm.name}`);
        });
        
        console.log('\n🎉 Facebook Accounts module setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        // Close the database connection
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