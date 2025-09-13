const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'ads reporting'
  });
  
  const [columns] = await conn.execute('DESCRIBE users');
  console.log('Users table structure:');
  columns.forEach(col => {
    console.log(`- ${col.Field}: ${col.Type}`);
  });
  
  await conn.end();
})().catch(console.error);
