const axios = require('axios');

// Test the cards API directly with the token from the frontend
async function testCardsAPI() {
  try {
    console.log('🧪 Testing Cards API directly...\n');
    
    // Extract token from the frontend logs (you'll need to copy it)
    // Look for the token in the browser console logs that start with "🔑 Token being sent:"
    console.log('⚠️  You need to copy the token from the browser console logs');
    console.log('   Look for: "🔑 Token being sent: eyJhbGciOiJIUzI1NiIs..."');
    console.log('   Copy the full token and paste it in this script\n');
    
    // TODO: Replace this with the actual token from browser console
    // Copy the FULL token from browser console after "🔑 Token being sent:"
    const token = 'eyJhbGciOiJIUzI1NiIs'; // <-- PASTE THE COMPLETE TOKEN HERE
    
    if (token === 'PASTE_TOKEN_HERE') {
      console.log('❌ Please update this script with the actual token from browser console');
      return;
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('📡 Testing GET /api/cards/active');
    const response = await axios.get('http://localhost:5000/api/cards/active', { 
      headers,
      params: { limit: 100 }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data?.cards) {
      console.log(`\n📊 Cards returned: ${response.data.data.cards.length}`);
      response.data.data.cards.forEach(card => {
        console.log(`   - Card ${card.id}: ${card.card_name} (Balance: $${card.current_balance})`);
      });
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.status);
    console.error('❌ Error Message:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('\n🔍 403 Forbidden - Permission denied');
      console.log('This confirms the RBAC middleware is blocking the request');
    }
  }
}

testCardsAPI();
