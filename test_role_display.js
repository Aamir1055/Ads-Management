const mysql = require('mysql2/promise');
require('dotenv').config();

async function testRoleDisplayIssue() {
  let connection;
  
  try {
    // Create database connection using pool config
    const { pool } = require('./config/database');
    connection = pool;
    
    console.log('🔍 Testing Role Display Issue');
    console.log('==============================\n');
    
    // Test 1: Check current roles in database
    console.log('1. Current roles in database:');
    const [roles] = await connection.query('SELECT id, name, description FROM roles ORDER BY id');
    
    roles.forEach(role => {
      console.log(`   - ID: ${role.id}, Name: "${role.name}" (Length: ${role.name.length})`);
      
      // Check for any hidden characters
      const nameBytes = Buffer.from(role.name, 'utf8');
      const hexDump = nameBytes.toString('hex');
      console.log(`     Hex: ${hexDump}`);
      
      // Check if name contains parentheses
      if (role.name.includes('()')) {
        console.log('     ⚠️  WARNING: Role name contains "()"');
      }
    });
    
    console.log('\n2. Testing role creation:');
    
    // Test 2: Create a test role
    const testRoleName = 'TestDisplayRole';
    const [insertResult] = await connection.query(
      'INSERT INTO roles (name, description, is_active, created_at) VALUES (?, ?, 1, NOW())',
      [testRoleName, 'Test role for display verification']
    );
    
    console.log(`   ✅ Created role with ID: ${insertResult.insertId}`);
    
    // Test 3: Immediately retrieve the created role
    const [newRole] = await connection.query('SELECT * FROM roles WHERE id = ?', [insertResult.insertId]);
    const createdRole = newRole[0];
    
    console.log('   Retrieved role:');
    console.log(`     Name: "${createdRole.name}"`);
    console.log(`     Length: ${createdRole.name.length}`);
    console.log(`     Hex: ${Buffer.from(createdRole.name).toString('hex')}`);
    
    if (createdRole.name.includes('()')) {
      console.log('     ❌ ERROR: Created role name contains "()"');
    } else {
      console.log('     ✅ Created role name is clean');
    }
    
    // Test 4: Test API-style data processing (simulate frontend processing)
    console.log('\n3. Simulating frontend data processing:');
    
    const processedRole = {
      ...createdRole,
      name: createdRole.name ? createdRole.name.trim() : createdRole.name,
      role_name: createdRole.name ? createdRole.name.trim() : createdRole.name
    };
    
    console.log('   Processed role data:');
    console.log(`     name: "${processedRole.name}"`);
    console.log(`     role_name: "${processedRole.role_name}"`);
    
    // Test 5: Test display logic
    console.log('\n4. Testing display logic:');
    const displayName = processedRole.name || processedRole.role_name || processedRole.display_name || 'Unknown Role';
    console.log(`   Display name would be: "${displayName}"`);
    
    if (displayName.includes('()')) {
      console.log('     ❌ ERROR: Display name contains "()"');
    } else {
      console.log('     ✅ Display name is clean');
    }
    
    // Clean up
    await connection.query('DELETE FROM roles WHERE id = ?', [insertResult.insertId]);
    console.log('\n   🧹 Test role cleaned up');
    
    console.log('\n📊 CONCLUSION:');
    console.log('   The database and backend processing appear to be working correctly.');
    console.log('   If you see "()" being added to role names, it might be:');
    console.log('   1. A frontend JavaScript issue (check browser console)');
    console.log('   2. A CSS/styling issue in the UI');
    console.log('   3. Some other frontend processing step');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    // Pool connections are managed automatically
    console.log('\n✅ Test completed');
  }
}

// Run the test
testRoleDisplayIssue().catch(console.error);
