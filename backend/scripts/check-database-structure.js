const { pool } = require('../config/database');

async function checkDatabaseStructure() {
    try {
        console.log('🔍 Checking database structure...');

        // Check roles table
        console.log('\n🎭 Checking roles table:');
        const [roles] = await pool.query('SELECT * FROM roles');
        if (roles.length > 0) {
            roles.forEach(role => {
                console.log(`   - ID: ${role.id}, Name: ${role.name}, Description: ${role.description || 'N/A'}`);
            });
        } else {
            console.log('   ⚠️ No roles found');
        }

        // Check modules table structure
        console.log('\n📋 Checking modules table structure:');
        const [moduleColumns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'modules'
            ORDER BY ORDINAL_POSITION
        `);
        
        if (moduleColumns.length > 0) {
            console.log('   Columns:');
            moduleColumns.forEach(col => {
                console.log(`     - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'required'}) ${col.COLUMN_DEFAULT ? `[default: ${col.COLUMN_DEFAULT}]` : ''}`);
            });
        } else {
            console.log('   ⚠️ Modules table not found');
        }

        // Check existing modules
        console.log('\n📦 Checking existing modules:');
        const [modules] = await pool.query('SELECT * FROM modules');
        if (modules.length > 0) {
            modules.forEach(module => {
                console.log(`   - ID: ${module.id}, Name: ${module.name}, Display: ${module.display_name || module.name}, Route: ${module.route || 'N/A'}`);
            });
        } else {
            console.log('   ⚠️ No modules found');
        }

        // Check if Facebook Pages permissions were added
        console.log('\n🔐 Checking Facebook Pages permissions:');
        const [fbPermissions] = await pool.query(
            'SELECT * FROM permissions WHERE name LIKE "facebook_pages%"'
        );
        if (fbPermissions.length > 0) {
            fbPermissions.forEach(permission => {
                console.log(`   ✅ ${permission.name}: ${permission.description}`);
            });
        } else {
            console.log('   ⚠️ No Facebook Pages permissions found');
        }

        console.log('\n✅ Database structure check completed');

    } catch (error) {
        console.error('❌ Error checking database structure:', error);
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
checkDatabaseStructure();