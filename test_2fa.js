const speakeasy = require('speakeasy');

// Test with a user who has 2FA enabled
const testUserId = 14; // Ahmed's user ID
const secret = 'NVZSY4TFOJIUOT2CLRQVQZDDNRSWMNTBL5VUKTZJIN2HE5TGMM6UWX3SO5JVE'; // This would be from database

// Generate a current TOTP token
const token = speakeasy.totp({
  secret: secret,
  encoding: 'base32'
});

console.log('Generated 2FA token:', token);
console.log('User ID:', testUserId);
console.log('Secret:', secret);

// You can use this token to test the verify endpoints
