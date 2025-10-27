const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupFacebookPages() {
    try {
        console.log('🚀 Starting Facebook Pages module setup...');

        // Read and execute the table creation SQL
        const sqlPath = path.join(__dirname, '../database_migrations/create_facebook_pages_table.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Split SQL statements (remove comments and empty lines)
        const sqlStatements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('USE'))
            .filter(stmt => stmt.length > 0);

        console.log(`📝 Found ${sqlStatements.length} SQL statements to execute`);
        
        // Execute each SQL statement
        for (let i = 0; i < sqlStatements.length; i++) {
            console.log(`⚡ Executing statement ${i + 1}/${sqlStatements.length}...`);
            try {
                const [result] = await pool.query(sqlStatements[i]);
                console.log(`   Result:`, result.info || result.message || 'Success');
            } catch (error) {
                if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
                    throw error;
                }
                console.log(`   Table already exists, skipping...`);
            }
        }

        // Create permissions for Facebook Pages
        console.log('📝 Creating Facebook Pages permissions...');
        const permissions = [
            {
                name: 'facebook_pages_create',
                display_name: 'Create Facebook Pages',
                description: 'Can create new Facebook pages'
            },
            {
                name: 'facebook_pages_read',
                display_name: 'View Facebook Pages',
                description: 'Can view Facebook pages list and details'
            },
            {
                name: 'facebook_pages_update',
                display_name: 'Update Facebook Pages',
                description: 'Can update Facebook page information and status'
            },
            {
                name: 'facebook_pages_delete',
                display_name: 'Delete Facebook Pages',
                description: 'Can delete Facebook pages'
            }
        ];

        // Insert permissions (ignore if they already exist)
        for (const permission of permissions) {
            try {
                await pool.query(
                    'INSERT IGNORE INTO permissions (name, display_name, description) VALUES (?, ?, ?)',
                    [permission.name, permission.display_name, permission.description]
                );
            } catch (error) {
                console.log(`   Permission ${permission.name} might already exist, continuing...`);
            }
        }

        // Assign permissions to admin roles
        console.log('📝 Assigning Facebook Pages permissions to admin roles...');
        const adminRoles = ['super_admin', 'admin'];
        
        for (const roleName of adminRoles) {
            // Check if role exists
            const [roleCheck] = await pool.query('SELECT id FROM roles WHERE name = ?', [roleName]);
            
            if (roleCheck.length > 0) {
                const roleId = roleCheck[0].id;
                
                // Assign each permission to this role
                for (const permission of permissions) {
                    try {
                        await pool.query(`
                            INSERT IGNORE INTO role_permissions (role_id, permission_id) 
                            SELECT ?, p.id 
                            FROM permissions p 
                            WHERE p.name = ?
                        `, [roleId, permission.name]);
                    } catch (error) {
                        console.log(`   Error assigning ${permission.name} to ${roleName}: ${error.message}`);
                    }
                }
                console.log(`   ✅ Assigned permissions to ${roleName} role`);
            } else {
                console.log(`   ⚠️ Role ${roleName} not found, skipping...`);
            }
        }

        // Create trigger to auto-disable pages when account is disabled
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

        console.log('\n🔍 Verifying setup...');
        
        // Check if table was created
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'ads_reporting' 
            AND TABLE_NAME = 'facebook_pages'
        `);
        
        if (tables.length > 0) {
            console.log('✅ Facebook pages table: EXISTS');
            
            // Check table structure
            const [columns] = await pool.query(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'ads_reporting' 
                AND TABLE_NAME = 'facebook_pages'
                ORDER BY ORDINAL_POSITION
            `);
            
            console.log('✅ Table structure:');
            columns.forEach(col => {
                console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'required'})`);
            });
        } else {
            console.log('❌ Facebook pages table: NOT FOUND');
        }
        
        // Check permissions
        const [permissionCount] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM permissions 
            WHERE name LIKE 'facebook_pages_%'
        `);
        console.log(`✅ Permissions created: ${permissionCount[0].count}`);
        
        if (permissionCount[0].count > 0) {
            const [permissionsList] = await pool.query(`
                SELECT name, display_name 
                FROM permissions 
                WHERE name LIKE 'facebook_pages_%'
                ORDER BY name
            `);
            
            permissionsList.forEach(perm => {
                console.log(`   - ${perm.name}: ${perm.display_name}`);
            });
        }
        
        // Check role assignments
        const [rolePermissions] = await pool.query(`
            SELECT r.name as role_name, p.name as permission_name
            FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE p.name LIKE 'facebook_pages_%'
            ORDER BY r.name, p.name
        `);
        
        console.log('✅ Role permissions assigned:');
        const rolePermsGrouped = {};
        rolePermissions.forEach(rp => {
            if (!rolePermsGrouped[rp.role_name]) {
                rolePermsGrouped[rp.role_name] = [];
            }
            rolePermsGrouped[rp.role_name].push(rp.permission_name);
        });
        
        Object.keys(rolePermsGrouped).forEach(roleName => {
            console.log(`   - ${roleName}: ${rolePermsGrouped[roleName].join(', ')}`);
        });

        console.log('\n🎉 Facebook Pages module setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Add Facebook Pages routes to your server.js');
        console.log('   2. Create frontend components for Facebook Pages management');
        console.log('   3. Test the auto-disable functionality by disabling a Facebook account');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('Stack trace:', error.stack);
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
setupFacebookPages();