const axios = require('axios');

async function testFastFeatureRequest() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🚀 Testing Fast Feature Request Processing...\n');
  
  try {
    // Test a simple widget request
    console.log('1️⃣ Submitting feature request...');
    const startTime = Date.now();
    
    const response = await axios.post(`${baseURL}/api/features/request`, {
      description: 'I want a simple counter widget that shows a number and increment button'
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Request submitted in ${responseTime}ms`);
    console.log(`   Request ID: ${response.data.featureRequest.id}`);
    console.log(`   Status: ${response.data.featureRequest.status}`);
    console.log(`   Processing: ${response.data.processing.message}`);
    
    // Wait a moment for background processing
    console.log('\n2️⃣ Waiting for background processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if component was generated
    console.log('\n3️⃣ Checking for generated components...');
    const fs = require('fs');
    const path = require('path');
    
    const componentsDir = path.join(__dirname, 'frontend', 'src', 'components', 'generated');
    
    try {
      const files = fs.readdirSync(componentsDir);
      const newComponents = files.filter(file => file.includes('Counter') || file.includes('Simple'));
      
      if (newComponents.length > 0) {
        console.log(`✅ Generated components found: ${newComponents.join(', ')}`);
      } else {
        console.log('⚠️ No new components found yet (may still be processing)');
      }
    } catch (dirError) {
      console.log('⚠️ Components directory not accessible');
    }
    
    // Check updated request status
    console.log('\n4️⃣ Checking request status...');
    const statusResponse = await axios.get(`${baseURL}/api/features/requests?limit=1`);
    const latestRequest = statusResponse.data[0];
    
    console.log(`   Latest request status: ${latestRequest.status}`);
    if (latestRequest.generatedComponents) {
      console.log(`   Generated files: ${latestRequest.generatedComponents.join(', ')}`);
    }
    
    console.log('\n🎉 Fast feature request test completed!');
    console.log(`Total response time: ${responseTime}ms (should be < 500ms for good UX)`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testFastFeatureRequest();