// Frontend debugging script for campaign type validation errors
// Add this to your browser console or temporarily integrate into your code

// Enhanced logging for campaign types API calls
const debugCampaignTypeRequests = () => {
  console.log('🔧 Campaign Type Frontend Debug Mode Activated');
  console.log('================================================');
  
  // Store original fetch and XMLHttpRequest
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  // Debug fetch requests
  window.fetch = async function(url, options = {}) {
    if (url.includes('/campaign-types')) {
      console.log('\n🌐 FETCH REQUEST DEBUG');
      console.log('=====================');
      console.log('URL:', url);
      console.log('Method:', options.method || 'GET');
      console.log('Headers:', JSON.stringify(options.headers || {}, null, 2));
      
      if (options.body) {
        console.log('Body Type:', typeof options.body);
        console.log('Raw Body:', options.body);
        
        try {
          if (typeof options.body === 'string') {
            const parsedBody = JSON.parse(options.body);
            console.log('Parsed Body:', JSON.stringify(parsedBody, null, 2));
            
            // Validate each field
            if (parsedBody.type_name !== undefined) {
              console.log('📝 type_name validation:');
              console.log('  Value:', JSON.stringify(parsedBody.type_name));
              console.log('  Type:', typeof parsedBody.type_name);
              console.log('  Length:', parsedBody.type_name?.length || 0);
              
              if (typeof parsedBody.type_name === 'string') {
                const pattern = /^[a-zA-Z0-9\s\-_&]+$/;
                const isValid = pattern.test(parsedBody.type_name);
                console.log('  Pattern Valid:', isValid);
                
                if (!isValid) {
                  console.log('  🚨 INVALID CHARACTERS DETECTED:');
                  for (let i = 0; i < parsedBody.type_name.length; i++) {
                    const char = parsedBody.type_name[i];
                    const code = char.charCodeAt(0);
                    const valid = /[a-zA-Z0-9\s\-_&]/.test(char);
                    console.log(`    [${i}] "${char}" (${code}) ${valid ? '✅' : '❌'}`);
                  }
                }
              }
            }
            
            if (parsedBody.description !== undefined) {
              console.log('📝 description validation:');
              console.log('  Value:', JSON.stringify(parsedBody.description));
              console.log('  Type:', typeof parsedBody.description);
              console.log('  Length:', parsedBody.description?.length || 0);
              console.log('  Valid Length:', (parsedBody.description?.length || 0) <= 1000);
            }
            
            if (parsedBody.is_active !== undefined) {
              console.log('📝 is_active validation:');
              console.log('  Value:', parsedBody.is_active);
              console.log('  Type:', typeof parsedBody.is_active);
              console.log('  Is Boolean:', typeof parsedBody.is_active === 'boolean');
            }
          }
        } catch (e) {
          console.log('❌ Error parsing body:', e.message);
        }
      }
    }
    
    const response = await originalFetch.apply(this, arguments);
    
    if (url.includes('/campaign-types')) {
      console.log('\n📡 FETCH RESPONSE DEBUG');
      console.log('======================');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        try {
          const clonedResponse = response.clone();
          const errorData = await clonedResponse.json();
          console.log('❌ Error Response Body:', JSON.stringify(errorData, null, 2));
        } catch (e) {
          console.log('❌ Could not parse error response');
        }
      }
    }
    
    return response;
  };
  
  // Debug XMLHttpRequest (for axios)
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._debugUrl = url;
    this._debugMethod = method;
    return originalXHROpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function(data) {
    if (this._debugUrl && this._debugUrl.includes('/campaign-types')) {
      console.log('\n🔄 AXIOS REQUEST DEBUG');
      console.log('======================');
      console.log('Method:', this._debugMethod);
      console.log('URL:', this._debugUrl);
      console.log('Data:', data);
      
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          console.log('Parsed Data:', JSON.stringify(parsedData, null, 2));
        } catch (e) {
          console.log('Data (non-JSON):', data);
        }
      }
      
      // Log response
      this.addEventListener('load', () => {
        console.log('\n📡 AXIOS RESPONSE DEBUG');
        console.log('=======================');
        console.log('Status:', this.status);
        console.log('Response:', this.responseText);
        
        if (this.status >= 400) {
          try {
            const errorData = JSON.parse(this.responseText);
            console.log('❌ Parsed Error:', JSON.stringify(errorData, null, 2));
          } catch (e) {
            console.log('❌ Raw Error Text:', this.responseText);
          }
        }
      });
    }
    
    return originalXHRSend.apply(this, arguments);
  };
  
  console.log('✅ Debug hooks installed. Campaign type requests will be logged.');
  console.log('💡 To disable: Run debugCampaignTypeRequests.disable()');
  
  // Return disable function
  return {
    disable: () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
      XMLHttpRequest.prototype.send = originalXHRSend;
      console.log('🔧 Campaign type debugging disabled');
    }
  };
};

// Function to test current campaign type data
const testCampaignTypeData = (data) => {
  console.log('\n🧪 Testing Campaign Type Data');
  console.log('=============================');
  console.log('Input:', JSON.stringify(data, null, 2));
  
  const errors = [];
  
  // Test type_name
  if (data.type_name !== undefined) {
    if (typeof data.type_name !== 'string') {
      errors.push('type_name must be a string');
    } else if (data.type_name.length < 2) {
      errors.push('type_name must be at least 2 characters');
    } else if (data.type_name.length > 100) {
      errors.push('type_name must not exceed 100 characters');
    } else if (!/^[a-zA-Z0-9\s\-_&]+$/.test(data.type_name)) {
      errors.push('type_name contains invalid characters');
      console.log('Invalid characters in type_name:');
      for (let i = 0; i < data.type_name.length; i++) {
        const char = data.type_name[i];
        const valid = /[a-zA-Z0-9\s\-_&]/.test(char);
        if (!valid) {
          console.log(`  [${i}] "${char}" (${char.charCodeAt(0)})`);
        }
      }
    }
  }
  
  // Test description
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('description must be a string');
    } else if (data.description.length > 1000) {
      errors.push('description must not exceed 1000 characters');
    }
  }
  
  // Test is_active
  if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }
  
  // Test at least one field
  const hasFields = data.type_name !== undefined || data.description !== undefined || data.is_active !== undefined;
  if (!hasFields) {
    errors.push('At least one field must be provided');
  }
  
  if (errors.length > 0) {
    console.log('❌ Validation Errors:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  } else {
    console.log('✅ All validations passed');
  }
  
  return errors;
};

// Make functions available globally
window.debugCampaignTypeRequests = debugCampaignTypeRequests;
window.testCampaignTypeData = testCampaignTypeData;

console.log('🎯 Frontend debugging tools loaded!');
console.log('📋 Available functions:');
console.log('   - debugCampaignTypeRequests() - Enable request debugging');
console.log('   - testCampaignTypeData(data) - Test validation locally');
console.log('');
console.log('💡 Example usage:');
console.log('   const debug = debugCampaignTypeRequests();');
console.log('   testCampaignTypeData({ type_name: "Test", is_active: true });');
