const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCampaignCreation() {
    try {
        console.log('Testing campaign creation APIs...\n');
        
        // Step 1: Login to get token
        console.log('1. Logging in as ahmed...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'ahmed',
            password: 'Admin123!'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login successful');
            
            const token = loginResponse.data.data.token;
            const headers = { Authorization: `Bearer ${token}` };
            
            // Step 2: Test campaign type creation
            console.log('\n2. Testing campaign type creation...');
            try {
                const campaignTypeData = {
                    type_name: `Test Campaign Type ${Date.now()}`,
                    description: 'Testing campaign type creation',
                    is_active: true
                };
                
                const campaignTypeResponse = await axios.post(`${BASE_URL}/campaign-types`, campaignTypeData, { headers });
                console.log('✅ Campaign type created successfully:', campaignTypeResponse.data.data);
                
                // Step 3: Test duplicate campaign type (should return 409)
                console.log('\n3. Testing duplicate campaign type creation...');
                try {
                    const duplicateResponse = await axios.post(`${BASE_URL}/campaign-types`, campaignTypeData, { headers });
                    console.log('❌ Duplicate should have failed but succeeded');
                } catch (error) {
                    if (error.response?.status === 409) {
                        console.log('✅ Duplicate correctly rejected with 409:', error.response.data.message);
                    } else {
                        console.log('❌ Unexpected error:', error.response?.data || error.message);
                    }
                }
                
            } catch (error) {
                console.log('❌ Campaign type creation failed:', error.response?.data || error.message);
            }
            
            // Step 4: Test campaign data creation
            console.log('\n4. Testing campaign data creation...');
            try {
                const campaignDataEntry = {
                    campaign_id: 1, // Assuming campaign with ID 1 exists
                    facebook_result: 100,
                    zoho_result: 50,
                    spent: 25.50,
                    data_date: new Date().toISOString().split('T')[0], // Today's date
                    card_name: 'Test Card'
                };
                
                const campaignDataResponse = await axios.post(`${BASE_URL}/campaign-data`, campaignDataEntry, { headers });
                console.log('✅ Campaign data created successfully:', campaignDataResponse.data.data);
                
            } catch (error) {
                console.log('❌ Campaign data creation failed:', error.response?.data || error.message);
            }
            
        } else {
            console.log('❌ Login failed:', loginResponse.data);
        }
        
        console.log('\n✅ Campaign creation testing completed!');
        
    } catch (error) {
        console.error('❌ Error testing campaign creation:', error.response?.data || error.message);
    }
}

// Run the test
testCampaignCreation();
