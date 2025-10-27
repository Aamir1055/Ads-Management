const { pool } = require('./config/database');

async function checkConstraints() {
    try {
        console.log('🔍 Checking unique constraints...\n');

        const [constraints] = await pool.query('SHOW INDEX FROM ads_managers');
        console.log('📊 All indexes on ads_managers table:');
        constraints.forEach(constraint => {
            console.log(`  - ${constraint.Key_name}: ${constraint.Column_name} (Non_unique: ${constraint.Non_unique})`);
        });

        console.log('\n🎯 Unique constraints only:');
        const uniqueConstraints = constraints.filter(c => c.Non_unique === 0);
        if (uniqueConstraints.length === 0) {
            console.log('  (None found)');
        } else {
            uniqueConstraints.forEach(constraint => {
                console.log(`  - ${constraint.Key_name}: ${constraint.Column_name}`);
            });
        }

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

checkConstraints();