// Simple test script for the hooks
const fetch = require('node-fetch');

async function testEvolveUIHook() {
  console.log('Testing evolve_ui hook...');
  
  try {
    const response = await fetch('http://localhost:3001/api/hooks/evolve-ui', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request: 'Create a blue chart showing monthly sales data with title "Sales Overview"',
        userId: 'test-user'
      })
    });
    
    const result = await response.json();
    console.log('evolve_ui result:', result);
    
  } catch (error) {
    console.error('Error testing evolve_ui:', error.message);
  }
}

async function testAutomateWorkflowHook() {
  console.log('Testing automate_workflow hook...');
  
  try {
    const response = await fetch('http://localhost:3001/api/hooks/automate-workflow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request: 'Send daily email reports at 9 AM with system health data',
        userId: 'test-user'
      })
    });
    
    const result = await response.json();
    console.log('automate_workflow result:', result);
    
  } catch (error) {
    console.error('Error testing automate_workflow:', error.message);
  }
}

// Run tests
async function runTests() {
  await testEvolveUIHook();
  console.log('---');
  await testAutomateWorkflowHook();
}

runTests();