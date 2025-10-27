const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabase() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ads reporting',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // 1. Add 2FA columns to users table
        console.log('🔄 Adding 2FA columns to users table...');
        try {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN is_2fa_enabled BOOLEAN DEFAULT FALSE
            `);
            console.log('✅ Added is_2fa_enabled column');
        } catch (error) {
            if (!error.message.includes('Duplicate column name')) {
                console.log('⚠️ Error adding is_2fa_enabled:', error.message);
            } else {
                console.log('ℹ️ is_2fa_enabled column already exists');
            }
        }

        try {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN two_factor_secret VARCHAR(32) NULL
            `);
            console.log('✅ Added two_factor_secret column');
        } catch (error) {
            if (!error.message.includes('Duplicate column name')) {
                console.log('⚠️ Error adding two_factor_secret:', error.message);
            } else {
                console.log('ℹ️ two_factor_secret column already exists');
            }
        }

        try {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN two_factor_backup_codes TEXT NULL
            `);
            console.log('✅ Added two_factor_backup_codes column');
        } catch (error) {
            if (!error.message.includes('Duplicate column name')) {
                console.log('⚠️ Error adding two_factor_backup_codes:', error.message);
            } else {
                console.log('ℹ️ two_factor_backup_codes column already exists');
            }
        }

        // 2. Update roles table column name
        console.log('🔄 Updating roles table...');
        try {
            await connection.execute(`
                ALTER TABLE roles 
                CHANGE COLUMN role_name name VARCHAR(100) NOT NULL UNIQUE
            `);
            console.log('✅ Updated roles table column name');
        } catch (error) {
            if (!error.message.includes("Unknown column 'role_name'")) {
                console.log('⚠️ Error updating roles table:', error.message);
            } else {
                console.log('ℹ️ roles table already has correct column name');
            }
        }

        // 3. Insert default roles
        console.log('🔄 Inserting default roles...');
        const roles = [
            [1, 'Admin', 'System Administrator with full access'],
            [2, 'Manager', 'Manager with limited administrative access'],
            [3, 'User', 'Standard user with basic access']
        ];

        for (const [id, name, description] of roles) {
            try {
                await connection.execute(`
                    INSERT IGNORE INTO roles (id, name, description, is_active) 
                    VALUES (?, ?, ?, TRUE)
                `, [id, name, description]);
                console.log(`✅ Inserted role: ${name}`);
            } catch (error) {
                console.log(`⚠️ Error inserting role ${name}:`, error.message);
            }
        }

        // 4. Test the schema
        console.log('🔄 Testing updated schema...');
        const [users] = await connection.execute(`
            SELECT u.id, u.username, u.role_id, u.is_2fa_enabled, u.is_active, 
                   r.name as role_name
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            LIMIT 5
        `);
        
        console.log(`✅ Schema test successful! Found ${users.length} users:`);
        console.table(users);

        // 5. Create a test user if none exist
        if (users.length === 0) {
            console.log('🔄 Creating test admin user...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            
            await connection.execute(`
                INSERT INTO users (username, hashed_password, role_id, is_active, is_2fa_enabled) 
                VALUES (?, ?, ?, TRUE, FALSE)
            `, ['admin', hashedPassword, 1]);
            
            console.log('✅ Created test admin user (username: admin, password: Password123!)');
        }

        console.log('🎉 Database setup completed successfully!');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        if (error.sql) {
            console.error('SQL:', error.sql);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

fixDatabase();
