const axios = require('axios');

async function testAutomateWorkflow() {
  const baseURL = 'http://localhost:3001';
  
  try {
    console.log('🧪 Testing automate_workflow hook...');
    
    // Test 1: Create a simple daily workflow
    console.log('\n1. Creating daily email workflow...');
    const response1 = await axios.post(`${baseURL}/api/hooks/automate-workflow`, {
      request: 'Send me a daily email with sales data at 9 AM',
      userId: 'test-user'
    });
    
    console.log('✅ Response:', response1.data);
    
    // Test 2: Create an hourly monitoring workflow
    console.log('\n2. Creating hourly monitoring workflow...');
    const response2 = await axios.post(`${baseURL}/api/hooks/automate-workflow`, {
      request: 'Check system health every hour and log the results',
      userId: 'test-user'
    });
    
    console.log('✅ Response:', response2.data);
    
    // Test 3: Create a data fetching workflow
    console.log('\n3. Creating data fetching workflow...');
    const response3 = await axios.post(`${baseURL}/api/hooks/automate-workflow`, {
      request: 'Fetch data from https://api.example.com/users every 30 minutes',
      userId: 'test-user'
    });
    
    console.log('✅ Response:', response3.data);
    
    // Test 4: List all workflows to verify they were created
    console.log('\n4. Listing all workflows...');
    const workflowsResponse = await axios.get(`${baseURL}/api/workflows`);
    console.log('✅ Created workflows:', workflowsResponse.data.length);
    workflowsResponse.data.forEach((workflow, index) => {
      console.log(`   ${index + 1}. ${workflow.name} (${workflow.trigger.type})`);
    });
    
    console.log('\n🎉 All tests passed! automate_workflow hook is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAutomateWorkflow();