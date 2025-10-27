const axios = require('axios');

async function testCardsAPI() {
  try {
    console.log('🧪 Testing Cards API directly...\n');
    
    // First, login to get a token
    console.log('1. Logging in as priyankjp...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'priyankjp',
      password: 'admin123'  // You may need to adjust this password
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, got token');
    
    // Test the cards/active endpoint
    console.log('\n2. Testing GET /api/cards/active...');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    try {
      const cardsResponse = await axios.get('http://localhost:5000/api/cards/active', { 
        headers 
      });
      
      console.log('✅ API call successful!');
      console.log('Status:', cardsResponse.status);
      console.log('Response:', JSON.stringify(cardsResponse.data, null, 2));
      
      if (cardsResponse.data.data && cardsResponse.data.data.cards) {
        console.log(`\n📊 Cards returned: ${cardsResponse.data.data.cards.length}`);
        cardsResponse.data.data.cards.forEach(card => {
          console.log(`   - Card ${card.id}: ${card.card_name} (••••${card.card_number_last4 || 'XXXX'})`);
        });
      }
      
    } catch (apiError) {
      console.log('❌ API call failed!');
      console.log('Status:', apiError.response?.status);
      console.log('Error:', apiError.response?.data || apiError.message);
      
      if (apiError.response?.status === 403) {
        console.log('\n🔍 403 Forbidden - This confirms the permission issue is in the backend');
        console.log('The RBAC middleware is blocking the request despite having cards_read permission');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testCardsAPI();
