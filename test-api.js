const fetch = require('node-fetch');

async function testWorkflowAPI() {
  console.log('🧪 Testing Workflow Automation API...');
  
  const testRequests = [
    'Send me a notification email every morning at 8 AM',
    'Monitor CPU usage every 15 minutes and alert if over 80%',
    'Generate a monthly sales report on the first day of each month'
  ];
  
  for (const request of testRequests) {
    console.log(`\n📝 Testing: "${request}"`);
    
    try {
      const response = await fetch('http://localhost:3001/api/hooks/automate-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request: request,
          userId: 'test-user'
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Success:', result.message);
        if (result.changes) {
          result.changes.forEach(change => console.log('  -', change));
        }
      } else {
        console.log('❌ Failed:', result.message || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ API Error:', error.message);
    }
  }
  
  // Test listing workflows
  console.log('\n📋 Listing all workflows...');
  try {
    const response = await fetch('http://localhost:3001/api/workflows');
    const workflows = await response.json();
    
    console.log(`Found ${workflows.length} workflows:`);
    workflows.slice(-3).forEach(workflow => {
      console.log(`  - ${workflow.name} (${workflow.trigger.type}${workflow.trigger.schedule ? ': ' + workflow.trigger.schedule : ''})`);
    });
  } catch (error) {
    console.log('❌ Failed to list workflows:', error.message);
  }
}

testWorkflowAPI();