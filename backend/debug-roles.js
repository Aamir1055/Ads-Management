const { pool } = require('./config/database');

(async () => {
  try {
    console.log('Checking roles table structure and data...\n');
    
    // Get table structure
    const [structure] = await pool.query('DESCRIBE roles');
    console.log('Roles table structure:');
    structure.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Get all role data
    const [roles] = await pool.query('SELECT * FROM roles ORDER BY id');
    console.log('\nAll roles in database:');
    roles.forEach((role, index) => {
      console.log(`${index + 1}. ID: ${role.id}`);
      console.log(`   Name: "${role.name}" (type: ${typeof role.name}, length: ${role.name?.length})`);
      console.log(`   Description: "${role.description || 'NULL'}"`);
      console.log(`   Is System: ${role.is_system_role}`);
      console.log(`   Is Active: ${role.is_active}`);
      console.log(`   Created: ${role.created_at}`);
      
      // Check for invisible characters
      if (role.name) {
        const nameBytes = Buffer.from(role.name, 'utf8');
        console.log(`   Name as bytes: [${Array.from(nameBytes).join(', ')}]`);
        console.log(`   Name as chars: [${Array.from(role.name).join(', ')}]`);
      }
      console.log('');
    });
    
    // Count total records
    const [count] = await pool.query('SELECT COUNT(*) as total FROM roles');
    console.log(`Total records in roles table: ${count[0].total}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
