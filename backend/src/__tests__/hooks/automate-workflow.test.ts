import { AutomateWorkflowHook } from '../../hooks/automate-workflow';
import { WorkflowService } from '../../services/WorkflowService';
import { WorkflowScheduler } from '../../scheduler/WorkflowScheduler';
import { HookContext } from '../../hooks';
import { setupTestDb, cleanupTestDb } from '../../test-utils/testDb';

// Mock the scheduler
jest.mock('../../scheduler/WorkflowScheduler');
const MockWorkflowScheduler = WorkflowScheduler as jest.MockedClass<typeof WorkflowScheduler>;

describe('AutomateWorkflowHook', () => {
  let hook: AutomateWorkflowHook;
  let workflowService: WorkflowService;
  let mockScheduler: jest.Mocked<WorkflowScheduler>;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(async () => {
    // Clean up any existing workflows before each test
    workflowService = new WorkflowService();
    const existingWorkflows = await workflowService.getAllWorkflows();
    for (const workflow of existingWorkflows) {
      await workflowService.deleteWorkflow(workflow.id);
    }
    
    mockScheduler = {
      scheduleWorkflow: jest.fn().mockResolvedValue(true),
      unscheduleWorkflow: jest.fn().mockResolvedValue(true),
      rescheduleWorkflow: jest.fn().mockResolvedValue(true),
      triggerWorkflow: jest.fn().mockResolvedValue(true),
      getScheduledTasks: jest.fn().mockReturnValue([]),
      getScheduledTask: jest.fn().mockReturnValue(undefined),
      isRunning: jest.fn().mockReturnValue(true)
    } as any;

    hook = new AutomateWorkflowHook(workflowService, mockScheduler);
  });

  describe('execute', () => {
    it('should create a daily email workflow', async () => {
      const context: HookContext = {
        request: 'Send me a daily email with sales data at 9 AM',
        userId: 'test-user',
        timestamp: new Date()
      };

      const result = await hook.execute(context);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully created workflow');
      expect(result.changes).toBeDefined();
      expect(result.changes!.length).toBeGreaterThan(0);

      // Verify workflow was created
      const workflows = await workflowService.getAllWorkflows();
      expect(workflows).toHaveLength(1);
      
      const workflow = workflows[0];
      expect(workflow.name).toContain('Send Me A Daily Email');
      expect(workflow.trigger.type).toBe('cron');
      expect(workflow.trigger.schedule).toBe('0 9 * * *');
      expect(workflow.actions).toHaveLength(2); // send_email + log_result
      expect(workflow.actions[0].type).toBe('send_email');
    });

    it('should create an hourly system monitoring workflow', async () => {
      const context: HookContext = {
        request: 'Check system health every hour and log the results',
        userId: 'test-user',
        timestamp: new Date()
      };

      const result = await hook.execute(context);

      expect(result.success).toBe(true);
      
      const workflows = await workflowService.getAllWorkflows();
      expect(workflows).toHaveLength(1);
      
      const workflow = workflows[0];
      expect(workflow.trigger.type).toBe('cron');
      expect(workflow.trigger.schedule).toBe('0 * * * *');
      expect(workflow.actions.some(a => a.type === 'check_system_metrics')).toBe(true);
    });

    it('should create a data fetching workflow', async () => {
      const context: HookContext = {
        request: 'Fetch data from https://api.example.com/users every 30 minutes',
        userId: 'test-user',
        timestamp: new Date()
      };

      const result = await hook.execute(context);

      expect(result.success).toBe(true);
      
      const workflows = await workflowService.getAllWorkflows();
      expect(workflows).toHaveLength(1);
      
      const workflow = workflows[0];
      expect(workflow.trigger.type).toBe('cron');
      expect(workflow.trigger.schedule).toBe('*/30 * * * *');
      expect(workflow.actions.some(a => a.type === 'fetch_data')).toBe(true);
      
      const fetchAction = workflow.actions.find(a => a.type === 'fetch_data');
      expect(fetchAction?.parameters.url).toBe('https://api.example.com/users');
    });

    it('should create a manual workflow when no schedule is specified', async () => {
      const context: HookContext = {
        request: 'Generate a report with current data',
        userId: 'test-user',
        timestamp: new Date()
      };

      const result = await hook.execute(context);

      expect(result.success).toBe(true);
      
      const workflows = await workflowService.getAllWorkflows();
      expect(workflows).toHaveLength(1);
      
      const workflow = workflows[0];
      expect(workflow.trigger.type).toBe('manual');
      expect(workflow.actions.some(a => a.type === 'generate_report')).toBe(true);
    });

    it('should schedule cron workflows with the scheduler', async () => {
      const context: HookContext = {
        request: 'Send daily report at 8 AM',
        userId: 'test-user',
        timestamp: new Date()
      };

      const result = await hook.execute(context);

      expect(result.success).toBe(true);
      expect(mockScheduler.scheduleWorkflow).toHaveBeenCalledTimes(1);
    });

    it('should not schedule manual workflows', async () => {
      const context: HookContext = {
        request: 'Generate a one-time report',
        userId: 'test-user',
        timestamp: new Date()
      };

      const result = await hook.execute(context);

      expect(result.success).toBe(true);
      expect(mockScheduler.scheduleWorkflow).not.toHaveBeenCalled();
    });

    it('should handle workflow creation errors', async () => {
      // Mock workflow service to throw an error
      jest.spyOn(workflowService, 'createWorkflow').mockRejectedValueOnce(new Error('Database error'));

      const context: HookContext = {
        request: 'Create a failing workflow',
        userId: 'test-user',
        timestamp: new Date()
      };

      const result = await hook.execute(context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to create workflow');
      expect(result.message).toContain('Database error');
    });
  });

  describe('natural language parsing', () => {
    it('should extract workflow names correctly', async () => {
      const testCases = [
        {
          request: 'Create a workflow called "Daily Sales Report"',
          expectedName: 'Daily Sales Report'
        },
        {
          request: 'Send email notifications every day at 10 AM',
          expectedName: 'Send Email Notifications Every'
        },
        {
          request: 'Monitor system performance hourly',
          expectedName: 'Monitor System Performance Hourly'
        }
      ];

      for (const testCase of testCases) {
        const context: HookContext = {
          request: testCase.request,
          userId: 'test-user',
          timestamp: new Date()
        };

        await hook.execute(context);
        
        const workflows = await workflowService.getAllWorkflows();
        const workflow = workflows[workflows.length - 1]; // Get the last created workflow
        
        expect(workflow.name).toContain(testCase.expectedName.split(' ')[0]);
      }
    });

    it('should parse different time schedules correctly', async () => {
      const testCases = [
        {
          request: 'Run daily at 6 AM',
          expectedSchedule: '0 6 * * *'
        },
        {
          request: 'Execute every hour',
          expectedSchedule: '0 * * * *'
        },
        {
          request: 'Run every 15 minutes',
          expectedSchedule: '*/15 * * * *'
        },
        {
          request: 'Execute weekly',
          expectedSchedule: '0 9 * * 1'
        }
      ];

      for (const testCase of testCases) {
        const context: HookContext = {
          request: testCase.request,
          userId: 'test-user',
          timestamp: new Date()
        };

        await hook.execute(context);
        
        const workflows = await workflowService.getAllWorkflows();
        const workflow = workflows[workflows.length - 1];
        
        expect(workflow.trigger.schedule).toBe(testCase.expectedSchedule);
      }
    });

    it('should detect multiple action types in complex requests', async () => {
      const context: HookContext = {
        request: 'Fetch data from API, generate a report, and email it to admin@company.com daily at 9 AM',
        userId: 'test-user',
        timestamp: new Date()
      };

      const result = await hook.execute(context);

      expect(result.success).toBe(true);
      
      const workflows = await workflowService.getAllWorkflows();
      const workflow = workflows[workflows.length - 1];
      
      const actionTypes = workflow.actions.map(a => a.type);
      expect(actionTypes).toContain('fetch_data');
      expect(actionTypes).toContain('generate_report');
      expect(actionTypes).toContain('send_email');
      expect(actionTypes).toContain('log_result');
    });
  });
});