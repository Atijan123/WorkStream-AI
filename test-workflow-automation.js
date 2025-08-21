const { AutomateWorkflowHook } = require('./backend/dist/hooks/automate-workflow');
const { WorkflowService } = require('./backend/dist/services/WorkflowService');

async function testWorkflowAutomation() {
  console.log('🧪 Testing Workflow Automation...');
  
  try {
    const workflowService = new WorkflowService();
    const hook = new AutomateWorkflowHook(workflowService);
    
    const testRequests = [
      'Send me a daily email with sales data at 9 AM',
      'Check system health every hour',
      'Fetch data from https://api.example.com/users every 30 minutes',
      'Generate a weekly report on Mondays'
    ];
    
    for (const request of testRequests) {
      console.log(`\n📝 Processing: "${request}"`);
      
      const result = await hook.execute({
        request,
        userId: 'test-user',
        timestamp: new Date()
      });
      
      if (result.success) {
        console.log('✅ Success:', result.message);
        if (result.changes) {
          result.changes.forEach(change => console.log('  -', change));
        }
      } else {
        console.log('❌ Failed:', result.message);
      }
    }
    
    // List all workflows
    console.log('\n📋 All Workflows:');
    const workflows = await workflowService.getAllWorkflows();
    workflows.forEach(workflow => {
      console.log(`  - ${workflow.name} (${workflow.trigger.type}${workflow.trigger.schedule ? ': ' + workflow.trigger.schedule : ''})`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWorkflowAutomation();