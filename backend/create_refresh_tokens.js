const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createRefreshTokensTable() {
    console.log('🔄 Creating refresh tokens table...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ads reporting',
        port: process.env.DB_PORT || 3306
    });

    try {
        // Read and execute the SQL file
        const sqlPath = path.join(__dirname, 'database_reset', 'create_refresh_tokens_table.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📝 Executing SQL script...');
        await connection.execute(sqlContent);
        
        console.log('✅ Refresh tokens table created successfully!');
        
    } catch (error) {
        console.error('❌ Failed to create refresh tokens table:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run the script
createRefreshTokensTable()
    .then(() => {
        console.log('🎉 Setup completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Setup failed:', error.message);
        process.exit(1);
    });
