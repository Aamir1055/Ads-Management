const mysql = require('mysql2/promise');

async function checkPermissionsSchema() {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'ads reporting',
      port: 3306
    });
    
    console.log('📋 Checking permissions table structure...');
    const [structure] = await pool.execute('DESCRIBE permissions');
    console.log('Permissions table columns:', structure.map(col => col.Field));
    
    console.log('\n📋 Checking role_permissions table structure...');
    const [rpStructure] = await pool.execute('DESCRIBE role_permissions');
    console.log('Role_permissions table columns:', rpStructure.map(col => col.Field));
    
    console.log('\n📋 Sample data from permissions table:');
    const [samplePerms] = await pool.execute('SELECT * FROM permissions LIMIT 3');
    console.log(samplePerms);
    
    // Test the permissions query
    console.log('\n🧪 Testing permissions query...');
    try {
      const [testResult] = await pool.query(`
        SELECT 
          rp.id as assignment_id,
          r.id as role_id,
          r.name as role_name,
          p.id as permission_id,
          p.permission_name,
          p.permission_key,
          p.description,
          m.module_name,
          rp.granted_by,
          rp.granted_at
        FROM role_permissions rp
        LEFT JOIN roles r ON rp.role_id = r.id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        LEFT JOIN modules m ON p.module_id = m.id
        ORDER BY r.name ASC, m.module_name ASC, p.permission_name ASC
        LIMIT 5
      `);
      console.log('✅ Permissions query successful, sample results:');
      console.log(testResult);
    } catch (queryError) {
      console.log('❌ Permissions query failed:', queryError.message);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

checkPermissionsSchema();
