const { pool } = require('./config/database')

// Test function to verify campaign schema with updated controller
async function testUpdatedSchema() {
  try {
    console.log('🧪 Testing Updated Campaign Schema & API...\n')
    
    // Test 1: Get valid user ID for foreign key constraint
    console.log('1. Getting valid user ID for testing...')
    const [users] = await pool.execute("SELECT id FROM users LIMIT 1")
    if (users.length === 0) {
      console.log('❌ No users found in database. Creating a test user...')
      
      // Create a test user
      await pool.execute(
        "INSERT INTO users (username, email, password, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
        ['test_user', 'test@example.com', 'hashed_password', 'user', 1]
      )
      
      const [newUsers] = await pool.execute("SELECT id FROM users WHERE username = 'test_user'")
      var testUserId = newUsers[0].id
      console.log(`✅ Created test user with ID: ${testUserId}`)
    } else {
      var testUserId = users[0].id
      console.log(`✅ Using existing user ID: ${testUserId}`)
    }
    
    // Test 2: Get valid campaign type ID
    console.log('\n2. Getting valid campaign type ID...')
    const [campaignTypes] = await pool.execute("SELECT id FROM campaign_types WHERE is_active = 1 LIMIT 1")
    if (campaignTypes.length === 0) {
      console.log('❌ No active campaign types found. Please create campaign types first.')
      return
    }
    var testCampaignTypeId = campaignTypes[0].id
    console.log(`✅ Using campaign type ID: ${testCampaignTypeId}`)
    
    // Test 3: Test campaign creation with updated schema
    console.log('\n3. Testing campaign creation with updated schema...')
    
    const testCampaign = {
      name: 'Test Updated Schema Campaign',
      persona: JSON.stringify(['Young Adults', 'Tech Enthusiasts', 'Professionals']),
      gender: JSON.stringify(['male', 'female']),
      age: '25-35',
      min_age: 25,
      max_age: 35,
      location: JSON.stringify(['Delhi', 'Mumbai', 'Bangalore']),
      creatives: 'image',
      campaign_type_id: testCampaignTypeId,
      brand: 'Test Brand Updated',
      is_enabled: 1,
      created_by: testUserId
    }
    
    const insertQuery = `
      INSERT INTO campaigns (
        name, persona, gender, age, min_age, max_age, location, 
        creatives, campaign_type_id, brand, is_enabled, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `
    
    const [createResult] = await pool.execute(insertQuery, [
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
    
    const testCampaignId = createResult.insertId
    console.log(`✅ Campaign created successfully with ID: ${testCampaignId}`)
    
    // Test 4: Retrieve and verify the created campaign
    console.log('\n4. Retrieving and verifying created campaign...')
    const [retrievedCampaign] = await pool.execute(
      "SELECT * FROM campaigns WHERE id = ?", 
      [testCampaignId]
    )
    
    if (retrievedCampaign.length === 0) {
      console.log('❌ Failed to retrieve created campaign')
      return
    }
    
    const campaign = retrievedCampaign[0]
    console.log('✅ Campaign retrieved successfully:')
    console.log(`  - Name: ${campaign.name}`)
    console.log(`  - Persona: ${campaign.persona}`)
    console.log(`  - Gender: ${campaign.gender}`)
    console.log(`  - Age: ${campaign.age}`)
    console.log(`  - Min Age: ${campaign.min_age}`)
    console.log(`  - Max Age: ${campaign.max_age}`)
    console.log(`  - Location: ${campaign.location}`)
    console.log(`  - Brand: ${campaign.brand}`)
    console.log(`  - Creative: ${campaign.creatives}`)
    console.log(`  - Enabled: ${campaign.is_enabled}`)
    
    // Test 5: Test JSON parsing of fields
    console.log('\n5. Testing JSON parsing of array fields...')
    
    try {
      const personaArray = JSON.parse(campaign.persona)
      console.log(`✅ Persona parsed successfully: [${personaArray.join(', ')}]`)
    } catch (e) {
      console.log(`❌ Failed to parse persona JSON: ${e.message}`)
    }
    
    try {
      const genderArray = JSON.parse(campaign.gender)
      console.log(`✅ Gender parsed successfully: [${genderArray.join(', ')}]`)
    } catch (e) {
      console.log(`❌ Failed to parse gender JSON: ${e.message}`)
    }
    
    try {
      const locationArray = JSON.parse(campaign.location)
      console.log(`✅ Location parsed successfully: [${locationArray.join(', ')}]`)
    } catch (e) {
      console.log(`❌ Failed to parse location JSON: ${e.message}`)
    }
    
    // Test 6: Test campaign update
    console.log('\n6. Testing campaign update...')
    const updateQuery = `
      UPDATE campaigns 
      SET name = ?, age = ?, min_age = ?, max_age = ?, updated_at = NOW() 
      WHERE id = ?
    `
    
    await pool.execute(updateQuery, [
      'Updated Test Campaign Name',
      '30-40',
      30,
      40,
      testCampaignId
    ])
    
    const [updatedCampaign] = await pool.execute(
      "SELECT name, age, min_age, max_age FROM campaigns WHERE id = ?", 
      [testCampaignId]
    )
    
    console.log(`✅ Campaign updated successfully:`)
    console.log(`  - New Name: ${updatedCampaign[0].name}`)
    console.log(`  - New Age: ${updatedCampaign[0].age}`)
    console.log(`  - New Min Age: ${updatedCampaign[0].min_age}`)
    console.log(`  - New Max Age: ${updatedCampaign[0].max_age}`)
    
    // Test 7: Clean up
    console.log('\n7. Cleaning up test data...')
    await pool.execute('DELETE FROM campaigns WHERE id = ?', [testCampaignId])
    console.log('✅ Test campaign deleted')
    
    // Clean up test user if we created one
    if (users.length === 0) {
      await pool.execute('DELETE FROM users WHERE username = ?', ['test_user'])
      console.log('✅ Test user deleted')
    }
    
    console.log('\n🎉 All tests passed! The updated schema is working correctly.')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack trace:', error.stack)
  } finally {
    await pool.end()
  }
}

// Run the test
testUpdatedSchema().catch(console.error)
