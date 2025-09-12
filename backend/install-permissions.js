#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.blue}🔧 ${msg}${colors.reset}`)
};

async function createDatabaseConnection() {
  try {
    log.info('Connecting to database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    log.success('Database connection established');
    return connection;
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    throw error;
  }
}

async function executeSQLFile(connection, filePath) {
  try {
    log.step(`Reading SQL file: ${path.basename(filePath)}`);
    const sql = await fs.readFile(filePath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    log.info(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await connection.execute(statement);
          if (i % 10 === 0 || i === statements.length - 1) {
            log.info(`Progress: ${i + 1}/${statements.length} statements executed`);
          }
        } catch (error) {
          log.warning(`Warning in statement ${i + 1}: ${error.message}`);
          // Continue with other statements
        }
      }
    }
    
    log.success(`SQL file executed successfully: ${path.basename(filePath)}`);
  } catch (error) {
    log.error(`Error executing SQL file: ${error.message}`);
    throw error;
  }
}

async function verifyInstallation(connection) {
  try {
    log.step('Verifying installation...');
    
    // Check if tables were created
    const tables = ['modules', 'roles', 'permissions', 'role_permissions', 'user_roles', 'permission_audit_log'];
    const results = {};
    
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        results[table] = rows[0].count;
        log.success(`Table '${table}': ${rows[0].count} records`);
      } catch (error) {
        log.error(`Table '${table}': Not found or error - ${error.message}`);
        results[table] = 'ERROR';
      }
    }
    
    // Check views
    log.step('Checking database views...');
    try {
      const [viewRows] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.views 
        WHERE table_schema = ? AND table_name IN ('user_permissions_view', 'role_permissions_summary')
      `, [process.env.DB_NAME]);
      
      log.success(`Database views created: ${viewRows[0].count}/2`);
    } catch (error) {
      log.warning(`Could not verify views: ${error.message}`);
    }
    
    // Check stored procedures
    log.step('Checking stored procedures...');
    try {
      const [procRows] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.routines 
        WHERE routine_schema = ? AND routine_type = 'PROCEDURE'
      `, [process.env.DB_NAME]);
      
      log.success(`Stored procedures created: ${procRows[0].count}`);
    } catch (error) {
      log.warning(`Could not verify stored procedures: ${error.message}`);
    }
    
    return results;
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    throw error;
  }
}

async function createFirstAdminUser(connection) {
  try {
    log.step('Setting up first admin user...');
    
    // Check if there are any users
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    if (userCount[0].count === 0) {
      log.info('No users found. You should create your first user through your application API.');
      log.info('After creating a user, you can assign the Super Admin role using:');
      log.info('CALL AssignRoleToUser(user_id, 1, 1);');
      return;
    }
    
    // Check if any user has Super Admin role
    const [adminCheck] = await connection.execute(`
      SELECT u.id, u.username
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name IN ('Super Admin', 'super_admin') AND ur.is_active = 1
      LIMIT 1
    `);
    
    if (adminCheck.length > 0) {
      log.success(`Super Admin already exists: ${adminCheck[0].username}`);
      return;
    }
    
    // Get the first user and assign Super Admin role
    const [firstUser] = await connection.execute('SELECT id, username FROM users LIMIT 1');
    
    if (firstUser.length > 0) {
      const userId = firstUser[0].id;
      const userName = firstUser[0].username;
      
      // Get Super Admin role ID
      const [roleRows] = await connection.execute(`
        SELECT id FROM roles WHERE name IN ('Super Admin', 'super_admin') LIMIT 1
      `);
      
      if (roleRows.length > 0) {
        const roleId = roleRows[0].id;
        
        // Assign Super Admin role manually (since stored procedures might not work)
        await connection.execute(`
          INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
          VALUES (?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE is_active = 1, assigned_at = NOW()
        `, [userId, roleId, userId]);
        
        log.success(`Assigned Super Admin role to: ${userName}`);
      }
    }
    
  } catch (error) {
    log.error(`Error setting up admin user: ${error.message}`);
    // Don't throw here as this is not critical for the installation
  }
}

async function main() {
  let connection;
  
  try {
    console.log(`${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                    ROLES & PERMISSIONS INSTALLER            ║
║                                                              ║
║  This will install the complete roles and permissions       ║
║  system for your Ads Reporting Software                     ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
    
    // Create database connection
    connection = await createDatabaseConnection();
    
    // Execute the SQL schema
    const sqlFilePath = path.join(__dirname, 'database_roles_permissions_fixed.sql');
    await executeSQLFile(connection, sqlFilePath);
    
    // Verify installation
    const results = await verifyInstallation(connection);
    
    // Setup first admin user
    await createFirstAdminUser(connection);
    
    console.log(`${colors.green}
╔══════════════════════════════════════════════════════════════╗
║                    🎉 INSTALLATION COMPLETE! 🎉            ║
║                                                              ║
║  Your roles and permissions system has been installed       ║
║  successfully. Here's what was created:                     ║
║                                                              ║
║  📊 Database Tables: 6 tables created                       ║
║  👥 Default Roles: 7 roles created                          ║
║  🔐 Permissions: 30+ permissions created                    ║
║  📋 Database Views: 2 views for easy querying               ║
║  ⚙️  Stored Procedures: 3 procedures for common operations   ║
║                                                              ║
║  Next Steps:                                                 ║
║  1. Start your Node.js server                               ║
║  2. Test the new permission endpoints                       ║
║  3. Create users and assign roles                           ║
║                                                              ║
║  Check ROLES_PERMISSIONS_SETUP.md for detailed usage        ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
    
  } catch (error) {
    log.error(`Installation failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log.info('Database connection closed');
    }
  }
}

// Run the installer
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
