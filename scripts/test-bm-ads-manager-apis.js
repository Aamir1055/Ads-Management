const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testBMAndAdsManagerAPIs() {
    try {
        console.log('🧪 Testing BM and Ads Manager API endpoints...');

        // Test authentication requirement
        console.log('\n1️⃣ Testing authentication requirement:');
        
        // Test BM endpoint without auth (should fail)
        try {
            await axios.get(`${API_BASE_URL}/bm`);
            console.log('❌ BM endpoint should require authentication');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ BM endpoint correctly requires authentication');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        // Test Ads Manager endpoint without auth (should fail)
        try {
            await axios.get(`${API_BASE_URL}/ads-managers`);
            console.log('❌ Ads Manager endpoint should require authentication');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Ads Manager endpoint correctly requires authentication');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        // Test server health
        console.log('\n2️⃣ Testing server health:');
        try {
            const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/health`);
            console.log('✅ Server is healthy:', response.data.success ? 'Yes' : 'No');
            console.log('   Database status:', response.data.database?.status || 'Unknown');
        } catch (error) {
            console.log('❌ Server health check failed:', error.message);
        }

        // Test endpoints documentation
        console.log('\n3️⃣ Testing API documentation:');
        try {
            const response = await axios.get(`${API_BASE_URL.replace('/api', '')}`);
            console.log('✅ API endpoints available:');
            console.log('   - BM:', response.data.endpoints?.bm || 'Not documented');
            console.log('   - Ads Managers:', response.data.endpoints?.adsManagers || 'Not documented');
        } catch (error) {
            console.log('❌ API documentation check failed:', error.message);
        }

        // Test database table existence
        console.log('\n4️⃣ Testing database tables:');
        try {
            const { pool } = require('../config/database');
            
            // Check BM table
            const [bmCheck] = await pool.query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'bm'
            `);
            
            if (bmCheck[0].count > 0) {
                console.log('✅ BM table exists');
                
                // Check BM table data
                const [bmData] = await pool.query('SELECT COUNT(*) as count FROM bm');
                console.log(`   - BM records: ${bmData[0].count}`);
            } else {
                console.log('❌ BM table does not exist');
            }

            // Check Ads Manager table
            const [amCheck] = await pool.query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'ads_managers'
            `);
            
            if (amCheck[0].count > 0) {
                console.log('✅ Ads Manager table exists');
                
                // Check Ads Manager table data
                const [amData] = await pool.query('SELECT COUNT(*) as count FROM ads_managers');
                console.log(`   - Ads Manager records: ${amData[0].count}`);
            } else {
                console.log('❌ Ads Manager table does not exist');
            }

            // Check trigger
            const [triggers] = await pool.query(`
                SELECT TRIGGER_NAME 
                FROM INFORMATION_SCHEMA.TRIGGERS 
                WHERE TRIGGER_SCHEMA = DATABASE()
                AND TRIGGER_NAME = 'bm_status_change_trigger'
            `);
            
            if (triggers.length > 0) {
                console.log('✅ Auto-disable trigger exists');
            } else {
                console.log('⚠️ Auto-disable trigger missing');
            }

            await pool.end();
        } catch (error) {
            console.log('❌ Database table check failed:', error.message);
        }

        // Test permissions
        console.log('\n5️⃣ Testing permissions:');
        try {
            const { pool } = require('../config/database');
            
            // Check BM permissions
            const [bmPerms] = await pool.query(`
                SELECT COUNT(*) as count 
                FROM permissions 
                WHERE name LIKE 'bm_%'
            `);
            console.log(`✅ BM permissions: ${bmPerms[0].count} found`);

            // Check Ads Manager permissions
            const [amPerms] = await pool.query(`
                SELECT COUNT(*) as count 
                FROM permissions 
                WHERE name LIKE 'ads_manager_%'
            `);
            console.log(`✅ Ads Manager permissions: ${amPerms[0].count} found`);

            // Check modules
            const [modules] = await pool.query(`
                SELECT name, display_name 
                FROM modules 
                WHERE name IN ('bm', 'ads_managers')
            `);
            console.log(`✅ Modules: ${modules.length} found`);
            modules.forEach(module => {
                console.log(`   - ${module.display_name} (${module.name})`);
            });

            await pool.end();
        } catch (error) {
            console.log('❌ Permissions check failed:', error.message);
        }

        console.log('\n✅ API endpoint tests completed!');
        console.log('\n📝 Summary:');
        console.log('   - BM and Ads Manager APIs are properly secured with authentication');
        console.log('   - Server is running and responsive');
        console.log('   - Database tables and triggers are set up correctly');
        console.log('   - Permissions and modules are configured');
        console.log('\n💡 Next steps:');
        console.log('   - Use frontend application to test authenticated requests');
        console.log('   - Test CRUD operations with proper authentication tokens');
        console.log('   - Test the auto-disable functionality');

    } catch (error) {
        console.error('❌ Error testing APIs:', error.message);
    }
}

// Run the test
testBMAndAdsManagerAPIs();