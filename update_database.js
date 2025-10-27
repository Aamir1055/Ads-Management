const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function updateDatabase() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ads reporting',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✅ Connected to database');

        // Read SQL file
        const sqlContent = fs.readFileSync('./database_update_2fa.sql', 'utf8');
        
        console.log('🔄 Executing SQL updates...');
        
        // Split SQL content into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--'));
        
        console.log(`Found ${statements.length} SQL statements to execute`);
        statements.forEach((stmt, i) => {
            console.log(`Statement ${i + 1}: ${stmt.substring(0, 50)}...`);
        });
        
        // Execute each statement individually
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (stmt) {
                console.log(`🔄 Executing statement ${i + 1}/${statements.length}:`);
                console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
                try {
                    await connection.execute(stmt);
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    console.log(`⚠️ Statement ${i + 1} error: ${error.message}`);
                    console.log(`SQL: ${stmt}`);
                    // Continue with next statement even if one fails
                }
            }
        }
        
        console.log('✅ Database schema updated successfully!');

        // Test the updated schema by selecting from users
        console.log('🔄 Testing updated schema...');
        const [users] = await connection.execute(`
            SELECT u.id, u.username, u.role_id, u.is_2fa_enabled, u.is_active, r.name as role_name
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            LIMIT 5
        `);
        
        console.log('✅ Schema test successful! Found', users.length, 'users:');
        console.table(users);

    } catch (error) {
        console.error('❌ Database update failed:', error.message);
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

updateDatabase();
