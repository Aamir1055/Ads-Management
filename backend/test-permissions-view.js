const { pool } = require('./config/database');

async function testPermissionsView() {
    try {
        console.log('Testing user_permissions_view...');
        
        // Check if the view exists and can be queried
        console.log('\n1. Testing if view can be queried:');
        try {
            const [testQuery] = await pool.query('SELECT COUNT(*) as total FROM user_permissions_view');
            console.log('View exists and can be queried. Total rows:', testQuery[0].total);
        } catch (error) {
            console.error('View query failed:', error.message);
            return;
        }
        
        // First, let's see what columns the view actually has
        console.log('\n2. Checking view structure:');
        const [viewColumns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'ads_reporting' AND TABLE_NAME = 'user_permissions_view'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('View columns:', viewColumns.map(col => col.COLUMN_NAME));
        
        // Get sample data from the view
        console.log('\n3. Sample data from view:');
        const [sampleData] = await pool.query('SELECT * FROM user_permissions_view LIMIT 5');
        console.log('Sample rows:', sampleData);
        
        // Get user ID for ahmed first
        console.log('\n4. Getting ahmed user ID:');
        const [userInfo] = await pool.query('SELECT id, username FROM users WHERE username = ?', ['ahmed']);
        const userId = userInfo[0]?.id;
        console.log('User ID:', userId);
        
        if (userId) {
            // Test the specific user permission check using user_id
            console.log('\n5. Testing specific permission for ahmed (users.read):');
            const [userPermCheck] = await pool.query(`
                SELECT *
                FROM user_permissions_view
                WHERE user_id = ? AND permission_key = 'users.read'
            `, [userId]);
            console.log('Permission check result:', userPermCheck);
            
            // Get all permissions for ahmed
            console.log('\n6. All permissions for ahmed:');
            const [allPerms] = await pool.query(`
                SELECT permission_key, permission_name, module_name
                FROM user_permissions_view
                WHERE user_id = ?
                ORDER BY module_name, permission_key
            `, [userId]);
            console.log('All permissions:', allPerms);
            
            // Test the exact hasPermission query
            console.log('\n7. Testing exact hasPermission query:');
            const [permResult] = await pool.query(`
                SELECT COUNT(*) as count
                FROM user_permissions_view
                WHERE user_id = ? AND permission_key = ?
            `, [userId, 'users.read']);
            console.log('Permission count:', permResult[0].count);
        }
        
        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing permissions view:', error);
    } finally {
        process.exit(0);
    }
}

testPermissionsView();
