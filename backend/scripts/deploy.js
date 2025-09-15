#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Starting production deployment setup...\n');

const runCommand = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      stdio: 'inherit', 
      shell: true,
      ...options 
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
};

const checkEnvironment = async () => {
  console.log('🔍 Checking environment configuration...');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    await fs.access(envPath);
    console.log('✅ .env file found');
    
    const envContent = await fs.readFile(envPath, 'utf8');
    const requiredVars = [
      'NODE_ENV',
      'PORT',
      'DB_HOST',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
      'JWT_SECRET',
      'REFRESH_TOKEN_SECRET'
    ];
    
    const missingVars = [];
    requiredVars.forEach(varName => {
      if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`)) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      console.log('⚠️  The following environment variables need to be configured:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
      console.log('\n📝 Please update your .env file with production values\n');
    } else {
      console.log('✅ All required environment variables are configured');
    }
    
  } catch (error) {
    console.log('❌ .env file not found');
    console.log('📄 Please copy .env.production to .env and update with your values');
    throw new Error('Environment configuration missing');
  }
};

const installDependencies = async () => {
  console.log('\n📦 Installing production dependencies...');
  await runCommand('npm', ['ci', '--only=production']);
  console.log('✅ Dependencies installed');
};

const createDirectories = async () => {
  console.log('\n📁 Creating required directories...');
  
  const directories = ['logs', 'uploads', 'public'];
  
  for (const dir of directories) {
    const dirPath = path.join(__dirname, '..', dir);
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`❌ Failed to create directory ${dir}:`, error.message);
      }
    }
  }
};

const runMigrations = async () => {
  console.log('\n🗄️  Setting up database...');
  try {
    await runCommand('node', ['scripts/migrate.js']);
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  }
};

const startApplication = async () => {
  console.log('\n🎯 Starting application with PM2...');
  try {
    // Stop any existing instance
    try {
      await runCommand('pm2', ['stop', 'ads-reporting-api']);
    } catch (error) {
      // Ignore if no existing instance
    }
    
    // Start new instance
    await runCommand('npm', ['run', 'pm2:start']);
    console.log('✅ Application started successfully');
    
    // Show status
    setTimeout(async () => {
      console.log('\n📊 Application Status:');
      await runCommand('pm2', ['status']);
      
      console.log('\n🔗 Useful PM2 Commands:');
      console.log('  - View logs: npm run pm2:logs');
      console.log('  - Monitor: npm run pm2:monit');
      console.log('  - Restart: npm run pm2:restart');
      console.log('  - Stop: npm run pm2:stop');
    }, 2000);
    
  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    throw error;
  }
};

const main = async () => {
  try {
    await checkEnvironment();
    await installDependencies();
    await createDirectories();
    await runMigrations();
    await startApplication();
    
    console.log('\n🎉 Production deployment completed successfully!');
    console.log('\n🌐 Your application should be running at:');
    console.log(`   http://localhost:${process.env.PORT || 5000}`);
    console.log('\n📊 Health check endpoint:');
    console.log(`   http://localhost:${process.env.PORT || 5000}/api/health`);
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    process.exit(1);
  }
};

main();
