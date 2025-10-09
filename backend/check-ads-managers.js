const { pool } = require('./config/database');

async function checkAdsManagersData() {
    try {
        console.log('🔍 Checking existing Ads Managers data...\n');

        // Check all Business Managers
        console.log('📊 Business Managers:');
        const [bms] = await pool.query('SELECT id, bm_name, email, status FROM bm ORDER BY id');
        bms.forEach(bm => {
            console.log(`  - ID: ${bm.id}, Name: "${bm.bm_name}", Email: ${bm.email}, Status: ${bm.status}`);
        });

        console.log('\n📊 Ads Managers:');
        const [adsManagers] = await pool.query(`
            SELECT 
                am.id, 
                am.bm_id, 
                am.ads_manager_name, 
                am.email, 
                am.phone_number, 
                am.status,
                bm.bm_name
            FROM ads_managers am
            LEFT JOIN bm ON am.bm_id = bm.id
            ORDER BY am.bm_id, am.id
        `);

        if (adsManagers.length === 0) {
            console.log('  (No Ads Managers found)');
        } else {
            adsManagers.forEach(am => {
                console.log(`  - ID: ${am.id}, BM: "${am.bm_name}" (${am.bm_id}), Name: "${am.ads_manager_name}", Email: ${am.email || 'null'}, Status: ${am.status}`);
            });
        }

        // Check for potential duplicates
        console.log('\n🔍 Checking for potential name conflicts:');
        const [duplicates] = await pool.query(`
            SELECT 
                bm_id, 
                ads_manager_name, 
                COUNT(*) as count
            FROM ads_managers 
            GROUP BY bm_id, ads_manager_name
            HAVING count > 1
        `);

        if (duplicates.length === 0) {
            console.log('  ✅ No duplicate names found within BMs');
        } else {
            console.log('  ❌ Found duplicates:');
            duplicates.forEach(dup => {
                console.log(`    - BM ${dup.bm_id}: "${dup.ads_manager_name}" (${dup.count} times)`);
            });
        }

        // Check database constraints
        console.log('\n🔍 Checking database constraints:');
        const [constraints] = await pool.query(`
            SELECT 
                CONSTRAINT_NAME, 
                CONSTRAINT_TYPE, 
                TABLE_NAME,
                COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'ads_managers'
            AND CONSTRAINT_NAME LIKE '%unique%'
        `);

        if (constraints.length === 0) {
            console.log('  (No unique constraints found)');
        } else {
            constraints.forEach(constraint => {
                console.log(`  - ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME}`);
            });
        }

        console.log('\n✅ Data check completed.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        try {
            await pool.end();
        } catch (err) {
            console.warn('Warning: Could not close database connection');
        }
        process.exit(0);
    }
}

// Run the check
checkAdsManagersData();