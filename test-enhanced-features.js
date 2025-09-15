const axios = require('axios');

async function testFeatureRequest() {
  try {
    console.log('🚀 Testing Enhanced Feature Request System...\n');
    
    // Test different types of feature requests
    const requests = [
      "I want a sales performance chart showing monthly revenue",
      "Create a user management table with sorting functionality", 
      "Add a contact form for customer inquiries",
      "Build a notification counter button"
    ];
    
    for (const request of requests) {
      console.log(`📝 Submitting request: "${request}"`);
      
      try {
        const response = await axios.post('http://localhost:3001/api/hooks/evolve-ui', {
          request: request,
          userId: 'test-user'
        });
        
        if (response.data.success) {
          console.log(`✅ Success: ${response.data.message}`);
          if (response.data.generatedFiles) {
            console.log(`📁 Generated files: ${response.data.generatedFiles.join(', ')}`);
          }
        } else {
          console.log(`❌ Failed: ${response.data.message}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
      }
      
      console.log('---');
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 Feature request testing complete!');
    console.log('Check your frontend dashboard to see the new components!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testFeatureRequest();