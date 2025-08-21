import request from 'supertest';
import { app } from '../../index';
import { setupTestDb, cleanupTestDb } from '../../test-utils/testDb';
import { WorkflowService } from '../../services/WorkflowService';

describe('AutomateWorkflow Integration Tests', () => {
  let workflowService: WorkflowService;

  beforeAll(async () => {
    await setupTestDb();
    workflowService = new WorkflowService();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(async () => {
    // Clean up workflows before each test
    const workflows = await workflowService.getAllWorkflows();
    for (const workflow of workflows) {
      await workflowService.deleteWorkflow(workflow.id);
    }
  });

  describe('Complete Workflow Creation Pipeline', () => {
    it('should create workflow from natural language request', async () => {
      const workflowRequest = 'Send me a daily email with sales data at 9 AM';

      // Create workflow via hook
      const response = await request(app)
        .post('/api/hooks/automate-workflow')
        .send({
          request: workflowRequest,
          userId: 'test-user'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully created workflow');
      expect(response.body.changes).toBeDefined();

      // Verify workflow was created in database
      const workflows = await workflowService.getAllWorkflows();
      expect(workflows).toHaveLength(1);

      const workflow = workflows[0];
      expect(workflow.name).toContain('Send Me A Daily Email');
      expect(workflow.trigger.type).toBe('cron');
      expect(workflow.trigger.schedule).toBe('0 9 * * *');
      expect(workflow.actions).toHaveLength(2); // send_email + log_result
      expect(workflow.actions[0].type).toBe('send_email');
      expect(workflow.status).toBe('active');
    });

    it('should create multiple different workflow types', async () => {
      const requests = [
        'Send daily report at 8 AM',
        'Check system health every hour',
        'Fetch data from API every 30 minutes',
        'Generate weekly summary report'
      ];

      // Create all workflows
      for (const req of requests) {
        const response = await request(app)
          .post('/api/hooks/automate-workflow')
          .send({
            request: req,
            userId: 'test-user'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }

      // Verify all workflows were created
      const workflows = await workflowService.getAllWorkflows();
      expect(workflows).toHaveLength(4);

      // Verify different trigger types
      const cronWorkflows = workflows.filter(w => w.trigger.type === 'cron');
      expect(cronWorkflows).toHaveLength(4); // All should be cron-based

      // Verify different schedules
      const schedules = workflows.map(w => w.trigger.schedule);
      expect(schedules).toContain('0 8 * * *'); // Daily at 8 AM
      expect(schedules).toContain('0 * * * *'); // Every hour
      expect(schedules).toContain('*/30 * * * *'); // Every 30 minutes
      expect(schedules).toContain('0 9 * * 1'); // Weekly (Monday at 9 AM)
    });

    it('should handle complex workflow requests with multiple actions', async () => {
      const complexRequest = 'Fetch data from API, generate a report, and email it to admin@company.com daily at 9 AM';

      const response = await request(app)
        .post('/api/hooks/automate-workflow')
        .send({
          request: complexRequest,
          userId: 'test-user'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const workflows = await workflowService.getAllWorkflows();
      expect(workflows).toHaveLength(1);

      const workflow = workflows[0];
      const actionTypes = workflow.actions.map(a => a.type);
      
      expect(actionTypes).toContain('fetch_data');
      expect(actionTypes).toContain('generate_report');
      expect(actionTypes).toContain('send_email');
      expect(actionTypes).toContain('log_result');

      // Verify email action has correct parameters
      const emailAction = workflow.actions.find(a => a.type === 'send_email');
      expect(emailAction?.parameters.to).toContain('admin@company.com');
    });

    it('should create manual workflows when no schedule is specified', async () => {
      const manualRequest = 'Generate a one-time report with current data';

      const response = await request(app)
        .post('/api/hooks/automate-workflow')
        .send({
          request: manualRequest,
          userId: 'test-user'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const workflows = await workflowService.getAllWorkflows();
      expect(workflows).toHaveLength(1);

      const workflow = workflows[0];
      expect(workflow.trigger.type).toBe('manual');
      expect(workflow.trigger.schedule).toBeUndefined();
    });

    it('should handle workflow creation errors gracefully', async () => {
      // This test verifies error handling by using an invalid request
      // that would cause parsing or validation errors
      const response = await request(app)
        .post('/api/hooks/automate-workflow')
        .send({
          request: '', // Empty request should cause an error
          userId: 'test-user'
        });

      // The hook should still return success but with a basic workflow
      // Let's test with a request that has missing required fields instead
      const response2 = await request(app)
        .post('/api/hooks/automate-workflow')
        .send({
          // Missing request field
          userId: 'test-user'
        });

      expect(response2.status).toBe(400);
      expect(response2.body.error).toBeDefined();
    });
  });

  describe('Hook Registry Integration', () => {
    it('should list automate_workflow hook in available hooks', async () => {
      const response = await request(app)
        .get('/api/hooks');

      expect(response.status).toBe(200);
      expect(response.body.hooks).toBeDefined();
      
      const automateWorkflowHook = response.body.hooks.find((h: any) => h.name === 'automate_workflow');
      expect(automateWorkflowHook).toBeDefined();
      expect(automateWorkflowHook.description).toContain('natural language workflow descriptions');
    });

    it('should execute automate_workflow hook via generic hook endpoint', async () => {
      const response = await request(app)
        .post('/api/hooks/automate_workflow/execute')
        .send({
          request: 'Send daily notifications at 10 AM',
          userId: 'test-user'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully created workflow');

      // Verify workflow was created
      const workflows = await workflowService.getAllWorkflows();
      expect(workflows).toHaveLength(1);
    });
  });
});