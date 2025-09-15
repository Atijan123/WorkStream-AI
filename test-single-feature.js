const axios = require('axios');

async function testSingleFeature() {
  try {
    console.log('🚀 Testing Single Feature Request...\n');
    
    const request = "I want a weather widget showing current temperature and conditions";
    
    console.log(`📝 Submitting request: "${request}"`);
    
    const response = await axios.post('http://localhost:3001/api/hooks/evolve-ui', {
      request: request,
      userId: 'test-user'
    });
    
    if (response.data.success) {
      console.log(`✅ Success: ${response.data.message}`);
      if (response.data.generatedFiles) {
        console.log(`📁 Generated files:`);
        response.data.generatedFiles.forEach(file => {
          console.log(`   - ${file}`);
        });
      }
    } else {
      console.log(`❌ Failed: ${response.data.message}`);
    }
    
    console.log('\n🎉 Test complete! Check your dashboard to see the new weather widget!');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data?.message || error.message);
  }
}

testSingleFeature();