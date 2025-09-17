const { pool } = require('./config/database')

// Test function to verify campaign schema
async function testCampaignSchema() {
  try {
    console.log('🧪 Testing Campaign API Schema Compatibility...\n')
    
    // Test 1: Check current table structure
    console.log('1. Checking campaigns table structure...')
    const [columns] = await pool.execute("DESCRIBE campaigns")
    
    console.log('Current table columns:')
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`)
    })
    
    // Test 2: Check if we have both age fields
    const hasAgeField = columns.find(col => col.Field === 'age')
    const hasMinAge = columns.find(col => col.Field === 'min_age')
    const hasMaxAge = columns.find(col => col.Field === 'max_age')
    
    console.log('\n2. Age field availability:')
    console.log(`  - age field: ${hasAgeField ? '✅ Present' : '❌ Missing'}`)
    console.log(`  - min_age field: ${hasMinAge ? '✅ Present' : '❌ Missing'}`)
    console.log(`  - max_age field: ${hasMaxAge ? '✅ Present' : '❌ Missing'}`)
    
    // Test 3: Check existing campaigns
    console.log('\n3. Checking existing campaigns...')
    const [campaigns] = await pool.execute("SELECT COUNT(*) as count FROM campaigns")
    console.log(`  Found ${campaigns[0].count} existing campaigns`)
    
    if (campaigns[0].count > 0) {
      const [sampleCampaign] = await pool.execute("SELECT * FROM campaigns LIMIT 1")
      console.log('\nSample campaign structure:')
      console.log(JSON.stringify(sampleCampaign[0], null, 2))
    }
    
    // Test 4: Test a sample insert to verify compatibility
    console.log('\n4. Testing campaign creation compatibility...')
    
    const testCampaign = {
      name: 'Test Campaign Schema Check',
      persona: JSON.stringify(['Young Adults', 'Professionals']),
      gender: JSON.stringify(['male', 'female']),
      age: '25-35',
      min_age: 25,
      max_age: 35,
      location: JSON.stringify(['Delhi', 'Mumbai']),
      creatives: 'image',
      campaign_type_id: 1, // Assuming campaign type 1 exists
      brand: 'Test Brand',
      is_enabled: 1,
      created_by: 1
    }
    
    try {
      const insertQuery = `
        INSERT INTO campaigns (
          name, persona, gender, age, min_age, max_age, location, 
          creatives, campaign_type_id, brand, is_enabled, created_by,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `
      
      const [result] = await pool.execute(insertQuery, [
        testCampaign.name,
        testCampaign.persona,
        testCampaign.gender,
        testCampaign.age,
        testCampaign.min_age,
        testCampaign.max_age,
        testCampaign.location,
        testCampaign.creatives,
        testCampaign.campaign_type_id,
        testCampaign.brand,
        testCampaign.is_enabled,
        testCampaign.created_by
      ])
      
      console.log(`✅ Test campaign created successfully (ID: ${result.insertId})`)
      
      // Clean up test data
      await pool.execute('DELETE FROM campaigns WHERE id = ?', [result.insertId])
      console.log('✅ Test campaign cleaned up')
      
    } catch (insertError) {
      console.log(`❌ Test campaign creation failed: ${insertError.message}`)
      
      // Try without min_age, max_age in case they don't exist
      const fallbackQuery = `
        INSERT INTO campaigns (
          name, persona, gender, age, location, 
          creatives, campaign_type_id, brand, is_enabled, created_by,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `
      
      try {
        const [fallbackResult] = await pool.execute(fallbackQuery, [
          testCampaign.name,
          testCampaign.persona,
          testCampaign.gender,
          testCampaign.age,
          testCampaign.location,
          testCampaign.creatives,
          testCampaign.campaign_type_id,
          testCampaign.brand,
          testCampaign.is_enabled,
          testCampaign.created_by
        ])
        
        console.log(`✅ Fallback test campaign created successfully (ID: ${fallbackResult.insertId})`)
        await pool.execute('DELETE FROM campaigns WHERE id = ?', [fallbackResult.insertId])
        console.log('✅ Fallback test campaign cleaned up')
        
      } catch (fallbackError) {
        console.log(`❌ Fallback test also failed: ${fallbackError.message}`)
      }
    }
    
    console.log('\n🎉 Schema compatibility test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await pool.end()
  }
}

// Run the test
testCampaignSchema().catch(console.error)
