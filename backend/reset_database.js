const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function resetDatabase() {
    console.log('🔄 Starting database reset...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ads reporting',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('📝 Executing database cleanup...');
        
        // Disable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        
        // Drop existing tables and views
        console.log('🗑️  Dropping old tables...');
        await connection.execute('DROP TABLE IF EXISTS user_roles');
        await connection.execute('DROP TABLE IF EXISTS role_permissions');
        await connection.execute('DROP TABLE IF EXISTS permission_audit_log');
        await connection.execute('DROP TABLE IF EXISTS permissions');
        await connection.execute('DROP TABLE IF EXISTS modules');
        await connection.execute('DROP VIEW IF EXISTS role_permissions_summary');
        await connection.execute('DROP VIEW IF EXISTS user_permissions_view');
        
        // Clean up users table
        console.log('🧹 Cleaning users table...');
        try {
            await connection.execute('ALTER TABLE users DROP FOREIGN KEY users_ibfk_1');
        } catch (e) { /* Foreign key might not exist */ }
        
        try {
            await connection.execute('ALTER TABLE users DROP COLUMN role_id');
        } catch (e) { /* Column might not exist */ }
        
        // Drop and recreate roles table
        console.log('🔧 Creating roles table...');
        await connection.execute('DROP TABLE IF EXISTS roles');
        
        await connection.execute(`
            CREATE TABLE roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                display_name VARCHAR(100) NOT NULL,
                description TEXT,
                level INT DEFAULT 1 COMMENT '1=lowest, 10=highest permission level',
                is_active BOOLEAN DEFAULT TRUE,
                is_system_role BOOLEAN DEFAULT FALSE COMMENT 'Cannot be deleted if true',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Insert basic system roles
        console.log('➕ Inserting system roles...');
        await connection.execute(`
            INSERT INTO roles (name, display_name, description, level, is_system_role) VALUES
            ('super_admin', 'Super Administrator', 'Full system access with all permissions', 10, TRUE),
            ('admin', 'Administrator', 'Administrative access to most system functions', 8, TRUE),
            ('manager', 'Manager', 'Management access to assigned resources', 5, TRUE),
            ('user', 'User', 'Basic user access to own resources', 1, TRUE)
        `);
        
        // Create permissions table
        console.log('🛡️  Creating permissions table...');
        await connection.execute(`
            CREATE TABLE permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Internal permission name',
                display_name VARCHAR(100) NOT NULL COMMENT 'Human readable name',
                description TEXT,
                category VARCHAR(50) DEFAULT 'general' COMMENT 'Group permissions by category',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Insert permissions
        console.log('➕ Inserting permissions...');
        await connection.execute(`
            INSERT INTO permissions (name, display_name, description, category) VALUES
            ('users_create', 'Create Users', 'Create new user accounts', 'users'),
            ('users_read', 'View Users', 'View user accounts and details', 'users'),
            ('users_update', 'Update Users', 'Edit user account details', 'users'),
            ('users_delete', 'Delete Users', 'Delete user accounts', 'users'),
            ('users_manage_roles', 'Manage User Roles', 'Assign/remove roles from users', 'users'),
            ('campaigns_create', 'Create Campaigns', 'Create new campaigns', 'campaigns'),
            ('campaigns_read', 'View Campaigns', 'View campaign details', 'campaigns'),
            ('campaigns_update', 'Update Campaigns', 'Edit campaign details', 'campaigns'),
            ('campaigns_delete', 'Delete Campaigns', 'Delete campaigns', 'campaigns'),
            ('campaign_data_create', 'Add Campaign Data', 'Add performance data to campaigns', 'campaign_data'),
            ('campaign_data_read', 'View Campaign Data', 'View campaign performance data', 'campaign_data'),
            ('campaign_data_update', 'Update Campaign Data', 'Edit campaign performance data', 'campaign_data'),
            ('campaign_data_delete', 'Delete Campaign Data', 'Delete campaign performance data', 'campaign_data'),
            ('reports_create', 'Generate Reports', 'Create and generate reports', 'reports'),
            ('reports_read', 'View Reports', 'View existing reports', 'reports'),
            ('reports_export', 'Export Reports', 'Export reports to various formats', 'reports'),
            ('cards_create', 'Create Cards', 'Add new payment cards', 'cards'),
            ('cards_read', 'View Cards', 'View payment card details', 'cards'),
            ('cards_update', 'Update Cards', 'Edit payment card details', 'cards'),
            ('cards_delete', 'Delete Cards', 'Delete payment cards', 'cards'),
            ('system_settings', 'System Settings', 'Access system configuration', 'system'),
            ('role_management', 'Role Management', 'Create and manage roles and permissions', 'system')
        `);
        
        // Create role_permissions table
        console.log('🔗 Creating role_permissions table...');
        await connection.execute(`
            CREATE TABLE role_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_id INT NOT NULL,
                permission_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_role_permission (role_id, permission_id),
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Assign permissions to roles
        console.log('🎯 Assigning permissions to roles...');
        
        // Super Admin gets all permissions
        await connection.execute('INSERT INTO role_permissions (role_id, permission_id) SELECT 1, id FROM permissions');
        
        // Admin gets most permissions except system settings
        await connection.execute(`INSERT INTO role_permissions (role_id, permission_id) 
                                 SELECT 2, id FROM permissions 
                                 WHERE name NOT IN ('system_settings', 'role_management')`);
        
        // Manager gets read/update permissions for campaigns and reports
        await connection.execute(`INSERT INTO role_permissions (role_id, permission_id)
                                 SELECT 3, id FROM permissions 
                                 WHERE name IN ('campaigns_read', 'campaigns_update', 'campaign_data_create', 'campaign_data_read', 'campaign_data_update', 'reports_create', 'reports_read', 'reports_export', 'cards_read')`);
        
        // User gets basic read permissions
        await connection.execute(`INSERT INTO role_permissions (role_id, permission_id)
                                 SELECT 4, id FROM permissions 
                                 WHERE name IN ('campaigns_read', 'campaign_data_read', 'reports_read', 'cards_read')`);
        
        // Add role_id back to users table
        console.log('👥 Updating users table...');
        await connection.execute('ALTER TABLE users ADD COLUMN role_id INT DEFAULT 4');
        await connection.execute('ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE');
        
        // Update existing users to have appropriate roles
        await connection.execute("UPDATE users SET role_id = 1 WHERE username IN ('admin', 'aamir_test')"); // Super admins
        await connection.execute("UPDATE users SET role_id = 2 WHERE username IN ('aamir', 'ahmed', 'testuser2fa')"); // Admins
        await connection.execute("UPDATE users SET role_id = 3 WHERE username IN ('testadmin', 'saad', 'Imran')"); // Managers
        
        // Create audit table
        console.log('📋 Creating audit table...');
        await connection.execute(`
            CREATE TABLE permission_audit (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(50) NOT NULL COMMENT 'ROLE_ASSIGNED, ROLE_REMOVED, PERMISSION_GRANTED, etc.',
                target_user_id INT COMMENT 'User affected by the action',
                role_id INT COMMENT 'Role involved in the action',
                permission_id INT COMMENT 'Permission involved in the action',
                details JSON COMMENT 'Additional action details',
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Create views
        console.log('👁️  Creating views...');
        await connection.execute(`
            CREATE VIEW user_role_view AS
            SELECT 
                u.id as user_id,
                u.username,
                u.is_active as user_active,
                r.id as role_id,
                r.name as role_name,
                r.display_name as role_display_name,
                r.level as role_level
            FROM users u
            JOIN roles r ON u.role_id = r.id
        `);
        
        await connection.execute(`
            CREATE VIEW user_permissions_view AS
            SELECT 
                u.id as user_id,
                u.username,
                r.name as role_name,
                p.name as permission_name,
                p.display_name as permission_display_name,
                p.category as permission_category,
                p.description as permission_description
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE u.is_active = 1 AND r.is_active = 1 AND p.is_active = 1
        `);
        
        // Re-enable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        
        // Get summary
        console.log('📊 Getting summary...');
        const [rolesCount] = await connection.execute('SELECT COUNT(*) as count FROM roles');
        const [permissionsCount] = await connection.execute('SELECT COUNT(*) as count FROM permissions');
        const [rolePermsCount] = await connection.execute('SELECT COUNT(*) as count FROM role_permissions');
        const [usersCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role_id IS NOT NULL');
        
        console.log('✅ Database reset completed successfully!');
        console.log(`📈 Summary:`);
        console.log(`   - Roles created: ${rolesCount[0].count}`);
        console.log(`   - Permissions created: ${permissionsCount[0].count}`);
        console.log(`   - Role-Permission assignments: ${rolePermsCount[0].count}`);
        console.log(`   - Users updated: ${usersCount[0].count}`);
        
    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run the reset
resetDatabase()
    .then(() => {
        console.log('🎉 Role management system reset completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Reset failed:', error.message);
        process.exit(1);
    });
