const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function debugLogin() {
    try {
        console.log('🔍 Debugging login issues...\n');
        
        // Check what users exist and their exact usernames
        console.log('1. Checking all users in database:');
        const [allUsers] = await pool.query('SELECT id, username, is_active FROM users ORDER BY id');
        allUsers.forEach(user => {
            console.log(`   - ID: ${user.id}, Username: "${user.username}", Active: ${user.is_active}`);
        });
        
        // Test different variations of ahmed
        const testUsernames = ['ahmed', 'Ahmed', 'AHMED'];
        
        for (const testUsername of testUsernames) {
            console.log(`\n2. Testing username: "${testUsername}"`);
            
            // Test exact match
            const [exactMatch] = await pool.query('SELECT id, username, hashed_password FROM users WHERE username = ?', [testUsername]);
            console.log(`   Exact match found: ${exactMatch.length > 0}`);
            
            if (exactMatch.length > 0) {
                const user = exactMatch[0];
                console.log(`   Found user: ID=${user.id}, Username="${user.username}"`);
                
                // Test password verification
                const testPassword = 'Admin123!';
                const isMatch = await bcrypt.compare(testPassword, user.hashed_password);
                console.log(`   Password "${testPassword}" matches: ${isMatch}`);
                
                // Show hash info
                console.log(`   Hash starts with: ${user.hashed_password.substring(0, 20)}...`);
            }
            
            // Test case-insensitive match
            const [caseInsensitive] = await pool.query('SELECT id, username FROM users WHERE LOWER(username) = LOWER(?)', [testUsername]);
            console.log(`   Case-insensitive match found: ${caseInsensitive.length > 0}`);
        }
        
        // Check if User model exists and how it's searching
        console.log('\n3. Testing User model findByUsername method:');
        try {
            const User = require('./models/User');
            
            for (const testUsername of testUsernames) {
                console.log(`\n   Testing User.findByUsername("${testUsername}"):`);
                const user = await User.findByUsername(testUsername);
                if (user) {
                    console.log(`   ✅ Found: ID=${user.id}, Username="${user.username}"`);
                } else {
                    console.log(`   ❌ Not found`);
                }
            }
        } catch (error) {
            console.log('   ❌ Error testing User model:', error.message);
        }
        
        console.log('\n✅ Debug completed!');
        
    } catch (error) {
        console.error('❌ Error during debug:', error);
    } finally {
        process.exit(0);
    }
}

debugLogin();
