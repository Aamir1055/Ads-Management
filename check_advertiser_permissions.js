const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ads reporting'
});

(async () => {
  try {
    const [roles] = await pool.execute('SELECT * FROM roles WHERE name = ?', ['Advertiser']);
    console.log('Advertiser Role:', roles[0]);
    
    if (roles[0]) {
      // First check permissions table structure
      const [tableInfo] = await pool.execute('DESCRIBE permissions');
      console.log('\nPermissions table structure:');
      tableInfo.forEach(col => console.log(`  ${col.Field}: ${col.Type}`));
      
      const [permissions] = await pool.execute(
        `SELECT p.* 
         FROM role_permissions rp 
         JOIN permissions p ON rp.permission_id = p.id 
         WHERE rp.role_id = ?
         ORDER BY p.name`,
        [roles[0].id]
      );
      
      console.log('\nAdvertiser All Permissions:');
      permissions.forEach(p => {
        console.log(`  ${p.name}: ${p.description}`);
      });
      
      // Filter cards-related permissions
      const cardsPermissions = permissions.filter(p => p.name && p.name.includes('card'));
      console.log('\nAdvertiser Cards-Related Permissions:');
      cardsPermissions.forEach(p => {
        console.log(`  ${p.name}: ${p.description}`);
      });
      
      if (permissions.length === 0) {
        console.log('  No cards permissions found for Advertiser role!');
      }
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
