require('dotenv').config();
const { pool } = require('./config/database');

async function debugRoleIssues() {
    console.log('🔍 Debugging Role Management Issues...\n');
    
    try {
        // 1. Check current roles and their names
        console.log('📋 Current Roles in Database:');
        const [roles] = await pool.query('SELECT * FROM roles ORDER BY created_at DESC');
        roles.forEach((role, index) => {
            console.log(`  ${index + 1}. ID: ${role.id}, Name: "${role.name}", Created: ${role.created_at}`);
        });
        console.log('');

        // 2. Check users and their role assignments
        console.log('👥 Users and their roles:');
        const [users] = await pool.query(`
            SELECT 
                u.id, u.username, u.created_at,
                r.id as role_id, r.name as role_name
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            ORDER BY u.created_at DESC 
            LIMIT 10
        `);
        users.forEach((user, index) => {
            console.log(`  ${index + 1}. User: ${user.username}, Role: "${user.role_name}" (ID: ${user.role_id}), Created: ${user.created_at}`);
        });
        console.log('');

        // 3. Check for any roles with parentheses in names
        console.log('🔍 Checking for roles with parentheses:');
        const [rolesWithParens] = await pool.query("SELECT * FROM roles WHERE name LIKE '%(%' OR name LIKE '%)%'");
        if (rolesWithParens.length > 0) {
            rolesWithParens.forEach((role) => {
                console.log(`  ❌ Found role with parentheses: ID ${role.id}, Name: "${role.name}"`);
            });
        } else {
            console.log('  ✅ No roles found with parentheses in their names');
        }
        console.log('');

        // 4. Check role permissions table structure
        console.log('🔧 Role Permissions Structure:');
        const [permissions] = await pool.query(`
            SELECT 
                rp.role_id, r.name as role_name,
                p.name as permission_name, p.permission_key
            FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.id
            JOIN permissions p ON rp.permission_id = p.id
            ORDER BY r.name, p.name
            LIMIT 20
        `);
        permissions.forEach((perm) => {
            console.log(`  Role: "${perm.role_name}" -> Permission: ${perm.permission_name} (${perm.permission_key})`);
        });
        console.log('');

        // 5. Test date formatting in database
        console.log('📅 Testing Date Formatting:');
        const [dateTest] = await pool.query(`
            SELECT 
                created_at,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as formatted_datetime,
                DATE_FORMAT(created_at, '%Y-%m-%d') as formatted_date
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        dateTest.forEach((row, index) => {
            console.log(`  ${index + 1}. Raw: ${row.created_at}, Formatted DateTime: ${row.formatted_datetime}, Formatted Date: ${row.formatted_date}`);
        });
        console.log('');

        // 6. Check if there are any specific issues with role name retrieval
        console.log('🔍 Testing Role Name Retrieval (like frontend does):');
        const [frontendStyleQuery] = await pool.query(`
            SELECT 
                u.id, u.username,
                u.role_id, r.name as role_name
            FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.is_active = 1
            ORDER BY u.created_at DESC
            LIMIT 5
        `);
        frontendStyleQuery.forEach((user) => {
            console.log(`  User: ${user.username}, Role Name: "${user.role_name}" (Type: ${typeof user.role_name})`);
        });

    } catch (error) {
        console.error('❌ Error during debugging:', error);
    }
}

async function fixRoleParenthesesIssue() {
    console.log('\n🔧 Attempting to fix role name parentheses issue...\n');
    
    try {
        // Find and fix any roles with parentheses
        const [rolesWithParens] = await pool.query("SELECT * FROM roles WHERE name LIKE '%(%' OR name LIKE '%)%'");
        
        if (rolesWithParens.length > 0) {
            console.log(`Found ${rolesWithParens.length} roles with parentheses:`);
            
            for (const role of rolesWithParens) {
                const cleanName = role.name.replace(/[()]/g, '').trim();
                console.log(`  Fixing: "${role.name}" -> "${cleanName}"`);
                
                await pool.query('UPDATE roles SET name = ? WHERE id = ?', [cleanName, role.id]);
                console.log(`  ✅ Updated role ID ${role.id}`);
            }
        } else {
            console.log('✅ No roles with parentheses found');
        }
        
        console.log('\n✅ Role parentheses fix completed!');
        
    } catch (error) {
        console.error('❌ Error fixing roles:', error);
    }
}

// Main execution
(async () => {
    await debugRoleIssues();
    
    // Ask user if they want to fix the parentheses issue
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.question('\nDo you want to attempt to fix any role parentheses issues found? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            await fixRoleParenthesesIssue();
        }
        
        await pool.end();
        readline.close();
        process.exit(0);
    });
})();
