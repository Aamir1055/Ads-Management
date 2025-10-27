const { pool } = require('./config/database');

async function debugUserCards() {
    try {
        console.log('🔍 Debugging user cards for priyankjp...\n');
        
        // First, let's see all users
        const [allUsers] = await pool.query(`
            SELECT u.id, u.username, u.role_id, r.name as role_name, r.level as role_level 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            ORDER BY u.id
        `);
        
        console.log(`👥 All Users in Database (${allUsers.length} total):`);
        allUsers.forEach(u => {
            console.log(`   User ${u.id}: "${u.username}" (Role: ${u.role_name}, Level: ${u.role_level})`);
        });
        console.log('');
        
        // Check specific user info
        const [users] = await pool.query(`
            SELECT u.id, u.username, u.role_id, r.name as role_name, r.level as role_level 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.username = 'priyankjp'
        `);
        
        if (!users.length) {
            console.log('❌ User "priyankjp" not found!');
            console.log('💡 Maybe the username is different? Check the list above.');
            return;
        }
        
        const user = users[0];
        console.log('👤 User Info:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role ID: ${user.role_id}`);
        console.log(`   Role Name: ${user.role_name}`);
        console.log(`   Role Level: ${user.role_level}`);
        
        const isAdmin = user.role_level >= 8 || user.role_name === 'super_admin' || user.role_name === 'admin';
        console.log(`   Is Admin: ${isAdmin}\n`);
        
        // Check all active cards
        const [allCards] = await pool.query(`
            SELECT id, card_name, created_by, current_balance, is_active 
            FROM cards 
            WHERE is_active = 1
            ORDER BY created_at DESC
        `);
        
        console.log(`📋 All Active Cards (${allCards.length} total):`);
        allCards.forEach(card => {
            console.log(`   Card ${card.id}: "${card.card_name}" (Balance: ${card.current_balance}, Created by: ${card.created_by})`);
        });
        console.log('');
        
        // Check cards owned by this user
        const [userCards] = await pool.query(`
            SELECT id, card_name, created_by, current_balance, is_active 
            FROM cards 
            WHERE is_active = 1 AND created_by = ?
            ORDER BY created_at DESC
        `, [user.id]);
        
        console.log(`🎯 Cards Owned by ${user.username} (${userCards.length} total):`);
        if (userCards.length === 0) {
            console.log('   ❌ No cards owned by this user!');
        } else {
            userCards.forEach(card => {
                console.log(`   Card ${card.id}: "${card.card_name}" (Balance: ${card.current_balance})`);
            });
        }
        console.log('');
        
        // Simulate what the getActiveCards endpoint would return
        console.log('🔄 Simulating getActiveCards endpoint response:');
        
        let query, params = [];
        if (isAdmin) {
            query = `
                SELECT id, card_name, card_number_last4, card_type, current_balance, created_by 
                FROM cards 
                WHERE is_active = 1 
                ORDER BY created_at DESC
            `;
        } else {
            query = `
                SELECT id, card_name, card_number_last4, card_type, current_balance, created_by 
                FROM cards 
                WHERE is_active = 1 AND created_by = ? 
                ORDER BY created_at DESC
            `;
            params.push(user.id);
        }
        
        const [availableCards] = await pool.query(query, params);
        console.log(`   Available cards for dropdown: ${availableCards.length}`);
        if (availableCards.length === 0) {
            console.log('   ❌ No cards available in dropdown for this user!');
            console.log('   💡 This explains why the dropdown is empty.');
        } else {
            availableCards.forEach(card => {
                console.log(`   ✅ Card ${card.id}: "${card.card_name}" (Balance: ${card.current_balance})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

debugUserCards();
