#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

const DB_NAME = process.env.DB_NAME || 'ads_reporting';

async function createDatabase() {
  console.log('🔄 Creating database if it doesn\'t exist...');
  
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    console.log(`✅ Database '${DB_NAME}' created or already exists`);
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  const connection = await mysql.createConnection({
    ...DB_CONFIG,
    database: DB_NAME
  });
  
  try {
    // Check if SQL file exists
    const sqlFilePath = path.join(__dirname, '..', '..', 'ads_reporting.sql');
    
    try {
      const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
      console.log(`📄 Loaded SQL file: ${sqlFilePath}`);
      
      // Execute the SQL content
      await connection.execute(sqlContent);
      console.log('✅ Database schema created successfully');
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('⚠️  SQL file not found, assuming database is already set up');
        
        // Test basic connection by checking if users table exists
        const [tables] = await connection.execute(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
        `, [DB_NAME]);
        
        if (tables.length === 0) {
          throw new Error('Users table not found. Please ensure the database is properly set up.');
        }
        
        console.log('✅ Database appears to be properly configured');
      } else {
        throw error;
      }
    }
    
    // Test connection with a simple query
    const [result] = await connection.execute('SELECT 1 as test');
    if (result[0].test === 1) {
      console.log('✅ Database connection test passed');
    }
    
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function createDirectories() {
  console.log('🔄 Creating required directories...');
  
  const directories = [
    'logs',
    'uploads',
    'public'
  ];
  
  for (const dir of directories) {
    const dirPath = path.join(__dirname, '..', dir);
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`✅ Directory created: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`❌ Error creating directory ${dir}:`, error.message);
      }
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting database setup...');
    
    await createDatabase();
    await runMigrations();
    await createDirectories();
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your .env file with correct database credentials');
    console.log('2. Run: npm start');
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
main();
