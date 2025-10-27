const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function addReportsModule() {
  let connection;
  
  try {
    console.log('🔄 Adding Reports module to database...');
    
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    // Read the SQL file
    const sqlScript = fs.readFileSync(path.join(__dirname, 'add_reports_module.sql'), 'utf8');
    
    // Split the SQL script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const [result] = await connection.execute(statement);
          
          // Log results for SELECT statements
          if (statement.trim().toUpperCase().startsWith('SELECT')) {
            console.log(`✅ Statement ${i + 1}:`, result);
          } else {
            console.log(`✅ Statement ${i + 1}: Executed successfully`);
          }
        } catch (statementError) {
          // Log warning for non-critical errors (like duplicate key)
          if (statementError.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️  Statement ${i + 1}: Duplicate entry (already exists)`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, statementError.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }
    
    // Verify the module was added
    const [modules] = await connection.execute(
      "SELECT * FROM modules WHERE name = 'Reports'"
    );
    
    const [permissions] = await connection.execute(
      "SELECT * FROM permissions WHERE category = 'Reports'"
    );
    
    const [rolePermissions] = await connection.execute(`
      SELECT 
          r.name as role_name,
          r.display_name as role_display_name,
          COUNT(p.id) as permissions_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.category = 'Reports'
      GROUP BY r.id, r.name, r.display_name
      HAVING permissions_count > 0
      ORDER BY r.name
    `);
    
    console.log('\n🎉 Reports Module Setup Complete!');
    console.log('📊 Module Details:', modules[0] || 'Not found');
    console.log(`🔐 Permissions Created: ${permissions.length}`);
    console.log('👥 Role Permissions:');
    rolePermissions.forEach(rp => {
      console.log(`   - ${rp.role_display_name}: ${rp.permissions_count} permissions`);
    });
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Refresh your frontend application');
    console.log('2. Log out and log back in');
    console.log('3. The Reports module should now appear in the sidebar');
    
    return { success: true, modules, permissions, rolePermissions };
    
  } catch (error) {
    console.error('❌ Failed to add Reports module:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Alternative function to add reports to all roles
async function addReportsToAllRoles() {
  let connection;
  
  try {
    console.log('🔄 Adding Reports permissions to all roles...');
    
    connection = await pool.getConnection();
    
    const [result] = await connection.execute(`
      INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
      SELECT r.id, p.id, NOW(), NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE p.category = 'Reports' AND r.is_active = 1
    `);
    
    console.log(`✅ Added Reports permissions to all active roles. Affected rows: ${result.affectedRows}`);
    
  } catch (error) {
    console.error('❌ Failed to add Reports to all roles:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Run the script
if (require.main === module) {
  addReportsModule()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addReportsModule, addReportsToAllRoles };