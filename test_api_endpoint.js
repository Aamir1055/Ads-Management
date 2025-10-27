const jwt = require('jsonwebtoken');

// Create a test JWT token for user priyankjp (ID: 56)
const testUser = {
    id: 56,
    username: 'priyankjp',
    role: { 
        id: 7,
        name: 'Advertiser',
        level: 1
    }
};

const token = jwt.sign(testUser, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });

console.log('🔑 Generated test JWT token for priyankjp:');
console.log(token);
console.log('\n📡 Test this API call:');
console.log(`curl -H "Authorization: Bearer ${token}" "http://localhost:5000/api/cards/active" | jq .`);

process.exit(0);
