const { pool } = require('../config/database');

/**
 * Comprehensive script to add created_by columns to all relevant tables for data privacy
 */

const tablesToUpdate = [
  {
    table: 'campaign_types',
    description: 'Campaign Types module'
  },
  {
    table: 'reports', 
    description: 'Reports module'
  },
  {
    table: 'card_users',
    description: 'Card Users module'
  },
  // Note: users table is special - we'll handle it separately since users don't "create themselves"
];

const addCreatedByToAllTables = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('🚀 Adding created_by columns to all relevant tables...\n');
    
    // Get admin user to assign existing records to
    const [adminUsers] = await connection.query(`
      SELECT u.id, u.username, r.display_name, r.name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.display_name IN ('Super Admin', 'Admin') OR r.name IN ('super_admin', 'admin') 
      ORDER BY r.level DESC, u.id ASC 
      LIMIT 1
    `);
    
    let defaultOwnerId = null;
    if (adminUsers.length > 0) {
      defaultOwnerId = adminUsers[0].id;
      console.log(`👤 Found admin user: ${adminUsers[0].username} (${adminUsers[0].display_name})`);
      console.log(`📋 Existing records will be assigned to this admin user\n`);
    } else {
      console.log('⚠️  No admin users found. Existing records will remain unassigned.\n');
    }
    
    let totalUpdates = 0;
    
    for (const tableInfo of tablesToUpdate) {
      const { table, description } = tableInfo;
      
      try {
        console.log(`📋 Processing ${table} (${description})...`);
        
        // Check if created_by column already exists
        const [columns] = await connection.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = ? 
            AND COLUMN_NAME = 'created_by'
        `, [table]);
        
        if (columns.length > 0) {
          console.log(`   ✅ created_by column already exists in ${table}`);
          continue;
        }
        
        await connection.beginTransaction();
        
        // Add created_by column
        await connection.query(`
          ALTER TABLE ${table} 
          ADD COLUMN created_by INT NULL 
          COMMENT 'User who created this record'
        `);
        console.log(`   ✅ Added created_by column to ${table}`);
        
        // Add foreign key constraint
        const constraintName = `fk_${table}_created_by`;
        await connection.query(`
          ALTER TABLE ${table} 
          ADD CONSTRAINT ${constraintName} 
          FOREIGN KEY (created_by) REFERENCES users(id) 
          ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log(`   ✅ Added foreign key constraint ${constraintName}`);
        
        // Update existing records if we have a default owner
        if (defaultOwnerId) {
          const [updateResult] = await connection.query(`
            UPDATE ${table} 
            SET created_by = ? 
            WHERE created_by IS NULL
          `, [defaultOwnerId]);
          
          if (updateResult.affectedRows > 0) {
            console.log(`   ✅ Assigned ${updateResult.affectedRows} existing records to admin`);
            totalUpdates += updateResult.affectedRows;
          } else {
            console.log(`   ℹ️  No existing records to assign in ${table}`);
          }
        }
        
        await connection.commit();
        console.log(`   🎉 Successfully updated ${table}\n`);
        
      } catch (tableError) {
        await connection.rollback();
        console.error(`   ❌ Error updating ${table}:`, tableError.message);
        throw tableError;
      }
    }
    
    console.log('='.repeat(60));
    console.log('📊 MIGRATION SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Tables updated: ${tablesToUpdate.length}`);
    console.log(`📝 Total records assigned: ${totalUpdates}`);
    console.log(`👤 Default owner: ${adminUsers.length > 0 ? adminUsers[0].username : 'None'}`);
    
    // Show final status
    console.log('\n📋 Final status of all key tables:');
    const finalCheck = ['campaign_data', 'campaigns', 'cards', ...tablesToUpdate.map(t => t.table)];
    
    for (const tableName of finalCheck) {
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ? 
          AND COLUMN_NAME = 'created_by'
      `, [tableName]);
      
      const [count] = await connection.query(`SELECT COUNT(*) as total, COUNT(created_by) as assigned FROM ${tableName}`);
      const stats = count[0];
      
      const status = columns.length > 0 ? '✅' : '❌';
      console.log(`   ${status} ${tableName}: ${stats.assigned}/${stats.total} records assigned`);
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Run if called directly
if (require.main === module) {
  addCreatedByToAllTables()
    .then(() => {
      console.log('\n🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addCreatedByToAllTables;
