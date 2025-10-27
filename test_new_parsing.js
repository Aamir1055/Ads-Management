// Test the new age parsing logic
function parseAgeRange(ageString) {
  let ageRange = { min: '', max: '' };
  
  if (ageString) {
    const ageStr = String(ageString).trim();
    
    if (ageStr.includes('-')) {
      // Range format: "18-25" or "24-40"
      const [min, max] = ageStr.split('-');
      ageRange = { min: min.trim(), max: max.trim() };
    } else if (ageStr.endsWith('+')) {
      // Minimum only format: "24+"
      const minAge = ageStr.replace('+', '').trim();
      ageRange = { min: minAge, max: '' };
    } else if (ageStr.toLowerCase().startsWith('up to ')) {
      // Maximum only format: "up to 40"
      const maxAge = ageStr.toLowerCase().replace('up to ', '').trim();
      ageRange = { min: '', max: maxAge };
    } else {
      // Single age format: "40" - treat as minimum age
      ageRange = { min: ageStr, max: '' };
    }
  }
  
  return ageRange;
}

// Test different age formats
const testCases = [
  '24-40',
  '18+',
  'up to 65',
  '40',
  '18-25',
  '30+',
  'up to 50',
  '20',
  '24'
];

console.log('Testing NEW age parsing logic:');
console.log('=' .repeat(50));

testCases.forEach(testAge => {
  const result = parseAgeRange(testAge);
  console.log(`Input: "${testAge}" -> Output: { min: "${result.min}", max: "${result.max}" }`);
  
  // Test the reverse: format back to string
  let ageString = null;
  if (result.min && result.max) {
    if (result.min === result.max) {
      ageString = result.min;
    } else {
      ageString = `${result.min}-${result.max}`;
    }
  } else if (result.min) {
    ageString = `${result.min}+`;
  } else if (result.max) {
    ageString = `up to ${result.max}`;
  }
  
  console.log(`         -> Format back: "${ageString}"`);
  console.log('');
});

console.log('Key changes:');
console.log('- Single ages (like "20", "24") now parse as minimum age only');
console.log('- This means min="20", max="" instead of min="20", max="20"');
console.log('- When saved, they become "20+" in the database');
console.log('- Ranges like "24-40" continue to work as before');
