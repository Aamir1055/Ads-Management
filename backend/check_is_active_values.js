const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ads reporting'
};

async function checkIsActiveValues() {
  let connection;
  
  try {
    console.log('🔍 Checking is_active values in key tables...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    const tables = ['users', 'campaigns', 'cards', 'brands', 'campaign_types'];
    
    for (const table of tables) {
      try {
        console.log(`📊 ${table.toUpperCase()} table:`);
        
        // Check if is_active column exists
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        const hasIsActive = columns.some(col => col.Field === 'is_active');
        
        if (hasIsActive) {
          // Count by is_active value
          const [counts] = await connection.execute(`
            SELECT 
              is_active,
              COUNT(*) as count
            FROM ${table} 
            GROUP BY is_active
            ORDER BY is_active
          `);
          
          console.log(`   Has is_active column: YES`);
          counts.forEach(row => {
            console.log(`   is_active = ${row.is_active}: ${row.count} records`);
          });
          
          // Show sample records
          const [samples] = await connection.execute(`SELECT * FROM ${table} LIMIT 3`);
          if (samples.length > 0) {
            console.log(`   Sample records:`);
            samples.forEach((record, index) => {
              const isActiveValue = record.is_active !== undefined ? record.is_active : 'NO COLUMN';
              console.log(`     Record ${index + 1}: id=${record.id}, is_active=${isActiveValue}`);
            });
          }
        } else {
          console.log(`   Has is_active column: NO`);
          // Count all records
          const [totalCount] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   Total records: ${totalCount[0].count}`);
        }
        
        console.log(''); // spacing
        
      } catch (error) {
        console.log(`   ❌ Error checking ${table}: ${error.message}\n`);
      }
    }
    
    // Specific check for user login issues
    console.log('🔐 Checking user login compatibility...\n');
    
    try {
      const [users] = await connection.execute(`
        SELECT 
          u.id, u.username, u.is_active, 
          r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.id
      `);
      
      console.log('👥 All users in database:');
      users.forEach(user => {
        console.log(`   ID: ${user.id}, Username: ${user.username}, Active: ${user.is_active}, Role: ${user.role_name || 'Unknown'}`);
      });
      
    } catch (error) {
      console.log(`❌ Error checking users: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkIsActiveValues();
