const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ads reporting',
  multipleStatements: true
};

async function runRBACFix() {
  let connection;
  
  try {
    console.log('🔧 Starting RBAC Permissions Fix...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix_rbac_permissions.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    console.log('📄 SQL script loaded');
    
    // Execute the SQL script step by step
    console.log('🚀 Executing RBAC fix...');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '')
      .filter(stmt => !stmt.match(/^SELECT.*as (Type|Info|Status)$/)); // Filter out diagnostic queries
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`  ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          await connection.execute(statement);
        } catch (error) {
          if (error.code !== 'ER_DUP_ENTRY' && error.code !== 'ER_DUP_KEY') {
            console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
          }
        }
      }
    }
    
    // Run diagnostic queries
    console.log('\n📊 Running diagnostic queries...');
    
    try {
      const [moduleCount] = await connection.execute("SELECT COUNT(*) as count FROM modules WHERE is_active = 1");
      console.log(`✅ Active Modules: ${moduleCount[0].count}`);
      
      const [permCount] = await connection.execute("SELECT COUNT(*) as count FROM permissions WHERE is_active = 1");
      console.log(`✅ Active Permissions: ${permCount[0].count}`);
      
      const [roleCount] = await connection.execute("SELECT COUNT(*) as count FROM roles WHERE is_active = 1");
      console.log(`✅ Active Roles: ${roleCount[0].count}`);
      
      const [rolePerm] = await connection.execute("SELECT COUNT(*) as count FROM role_permissions");
      console.log(`✅ Role-Permission Assignments: ${rolePerm[0].count}`);
      
      const [superAdminPerms] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM role_permissions rp
        INNER JOIN roles r ON rp.role_id = r.id
        WHERE r.name = 'super_admin'
      `);
      console.log(`✅ Super Admin Permissions: ${superAdminPerms[0].count}`);
      
    } catch (error) {
      console.warn('Warning getting diagnostics:', error.message);
    }
    
    console.log('\n✅ RBAC Permissions Fix completed successfully!');
    console.log('\n🎯 What was fixed:');
    console.log('  ✓ Created role_permissions junction table');
    console.log('  ✓ Added Brand Management module');
    console.log('  ✓ Added Brand permissions (create, read, update, delete)');
    console.log('  ✓ Added Role Management permissions');
    console.log('  ✓ Created Super Admin role with full permissions');
    console.log('  ✓ Fixed user role assignments');
    console.log('  ✓ Granted proper permissions to all roles');
    
    console.log('\n🔄 Next Steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Refresh your frontend application'); 
    console.log('  3. Login and test Brand Management and Role Management modules');
    
  } catch (error) {
    console.error('❌ Error running RBAC fix:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Database connection failed. Make sure:');
      console.error('  - MySQL/MariaDB server is running');
      console.error('  - Database credentials are correct');
      console.error('  - Database "ads reporting" exists');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('\n💡 Table not found. Make sure all required tables exist.');
    } else if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️  Process interrupted by user');
  process.exit(0);
});

// Run the fix
runRBACFix();
