import { PredefinedWorkflowService } from '../../services/PredefinedWorkflowService';
import { WorkflowService } from '../../services/WorkflowService';
import { WorkflowScheduler } from '../../scheduler/WorkflowScheduler';
import { Workflow } from '../../types';
import { setupTestDb, cleanupTestDb } from '../../test-utils/testDb';

// Mock the scheduler
jest.mock('../../scheduler/WorkflowScheduler');
const MockWorkflowScheduler = WorkflowScheduler as jest.MockedClass<typeof WorkflowScheduler>;

describe('PredefinedWorkflowService', () => {
  let predefinedService: PredefinedWorkflowService;
  let workflowService: WorkflowService;
  let mockScheduler: jest.Mocked<WorkflowScheduler>;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(async () => {
    // Create mock scheduler
    mockScheduler = {
      scheduleWorkflow: jest.fn().mockResolvedValue(true),
      unscheduleWorkflow: jest.fn().mockResolvedValue(true),
      rescheduleWorkflow: jest.fn().mockResolvedValue(true),
      triggerWorkflow: jest.fn().mockResolvedValue(true),
      getScheduledTasks: jest.fn().mockReturnValue([]),
      getScheduledTask: jest.fn().mockReturnValue(undefined),
      isRunning: jest.fn().mockReturnValue(true)
    } as any;

    predefinedService = new PredefinedWorkflowService(mockScheduler);
    workflowService = new WorkflowService();

    // Clean up any existing workflows
    const existingWorkflows = await workflowService.getAllWorkflows();
    for (const workflow of existingWorkflows) {
      await workflowService.deleteWorkflow(workflow.id);
    }
  });

  describe('getPredefinedWorkflows', () => {
    it('should return predefined workflow definitions', () => {
      const predefinedWorkflows = predefinedService.getPredefinedWorkflows();

      expect(predefinedWorkflows).toHaveLength(2);
      
      // Check Daily Sales Report workflow
      const salesReport = predefinedWorkflows.find(w => w.name === 'Daily Sales Report');
      expect(salesReport).toBeDefined();
      expect(salesReport!.trigger.type).toBe('cron');
      expect(salesReport!.trigger.schedule).toBe('0 8 * * *');
      expect(salesReport!.actions).toHaveLength(4);
      expect(salesReport!.status).toBe('active');

      // Check Hourly System Health Check workflow
      const healthCheck = predefinedWorkflows.find(w => w.name === 'Hourly System Health Check');
      expect(healthCheck).toBeDefined();
      expect(healthCheck!.trigger.type).toBe('cron');
      expect(healthCheck!.trigger.schedule).toBe('0 * * * *');
      expect(healthCheck!.actions).toHaveLength(2);
      expect(healthCheck!.status).toBe('active');
    });

    it('should have valid action types in predefined workflows', () => {
      const predefinedWorkflows = predefinedService.getPredefinedWorkflows();
      const validActionTypes = ['fetch_data', 'generate_report', 'send_email', 'check_system_metrics', 'log_result'];

      for (const workflow of predefinedWorkflows) {
        for (const action of workflow.actions) {
          expect(validActionTypes).toContain(action.type);
          expect(action.parameters).toBeDefined();
        }
      }
    });
  });

  describe('initializePredefinedWorkflows', () => {
    it('should create new predefined workflows when none exist', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await predefinedService.initializePredefinedWorkflows();

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify workflows were created
      const workflows = await workflowService.getAllWorkflows();
      expect(workflows).toHaveLength(2);

      const salesReport = workflows.find(w => w.name === 'Daily Sales Report');
      const healthCheck = workflows.find(w => w.name === 'Hourly System Health Check');

      expect(salesReport).toBeDefined();
      expect(healthCheck).toBeDefined();

      // Verify scheduler was called
      expect(mockScheduler.scheduleWorkflow).toHaveBeenCalledTimes(2);
      expect(mockScheduler.scheduleWorkflow).toHaveBeenCalledWith(salesReport);
      expect(mockScheduler.scheduleWorkflow).toHaveBeenCalledWith(healthCheck);

      consoleSpy.mockRestore();
    });

    it('should update existing predefined workflows', async () => {
      // Create an existing workflow with same name but different config
      const existingWorkflow = await workflowService.createWorkflow({
        name: 'Daily Sales Report',
        description: 'Old description',
        trigger: { type: 'manual' },
        actions: [{ type: 'log_result', parameters: { message: 'old' } }],
        status: 'paused'
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await predefinedService.initializePredefinedWorkflows();

      expect(result.created).toBe(1); // Only health check should be created
      expect(result.updated).toBe(1); // Sales report should be updated
      expect(result.errors).toHaveLength(0);

      // Verify the existing workflow was updated
      const updatedWorkflow = await workflowService.getWorkflow(existingWorkflow.id);
      expect(updatedWorkflow).toBeDefined();
      expect(updatedWorkflow!.description).toBe('Generate and email daily sales report at 8 AM');
      expect(updatedWorkflow!.trigger.type).toBe('cron');
      expect(updatedWorkflow!.trigger.schedule).toBe('0 8 * * *');
      expect(updatedWorkflow!.status).toBe('active');

      // Verify scheduler was called for rescheduling and new scheduling
      expect(mockScheduler.rescheduleWorkflow).toHaveBeenCalledWith(updatedWorkflow);
      expect(mockScheduler.scheduleWorkflow).toHaveBeenCalledTimes(1); // Only for health check

      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      // Mock the internal workflow service by replacing it
      const originalWorkflowService = (predefinedService as any).workflowService;
      const mockWorkflowService = {
        ...originalWorkflowService,
        createWorkflow: jest.fn().mockRejectedValue(new Error('Database error')),
        getAllWorkflows: jest.fn().mockResolvedValue([])
      };
      (predefinedService as any).workflowService = mockWorkflowService;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await predefinedService.initializePredefinedWorkflows();

      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('Failed to initialize workflow "Daily Sales Report"');
      expect(result.errors[1]).toContain('Failed to initialize workflow "Hourly System Health Check"');

      // Restore original service
      (predefinedService as any).workflowService = originalWorkflowService;
      consoleSpy.mockRestore();
    });
  });

  describe('resetPredefinedWorkflows', () => {
    it('should delete existing and create new predefined workflows', async () => {
      // Create some existing workflows
      const existingWorkflow1 = await workflowService.createWorkflow({
        name: 'Daily Sales Report',
        description: 'Old version',
        trigger: { type: 'manual' },
        actions: [],
        status: 'paused'
      });

      const existingWorkflow2 = await workflowService.createWorkflow({
        name: 'Other Workflow',
        description: 'Should not be deleted',
        trigger: { type: 'manual' },
        actions: [],
        status: 'active'
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await predefinedService.resetPredefinedWorkflows();

      expect(result.deleted).toBe(1); // Only Daily Sales Report should be deleted
      expect(result.created).toBe(2); // Both predefined workflows should be created
      expect(result.errors).toHaveLength(0);

      // Verify workflows
      const workflows = await workflowService.getAllWorkflows();
      expect(workflows).toHaveLength(3); // 2 predefined + 1 other

      const salesReport = workflows.find(w => w.name === 'Daily Sales Report');
      const healthCheck = workflows.find(w => w.name === 'Hourly System Health Check');
      const otherWorkflow = workflows.find(w => w.name === 'Other Workflow');

      expect(salesReport).toBeDefined();
      expect(salesReport!.id).not.toBe(existingWorkflow1.id); // Should be new workflow
      expect(healthCheck).toBeDefined();
      expect(otherWorkflow).toBeDefined();
      expect(otherWorkflow!.id).toBe(existingWorkflow2.id); // Should be unchanged

      // Verify scheduler calls
      expect(mockScheduler.unscheduleWorkflow).toHaveBeenCalledWith(existingWorkflow1.id);
      expect(mockScheduler.scheduleWorkflow).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it('should handle deletion errors gracefully', async () => {
      // Create existing workflow
      const existingWorkflow = await workflowService.createWorkflow({
        name: 'Daily Sales Report',
        description: 'Old version',
        trigger: { type: 'manual' },
        actions: [],
        status: 'active'
      });

      // Mock the internal workflow service to fail deletion
      const originalWorkflowService = (predefinedService as any).workflowService;
      const mockWorkflowService = {
        getAllWorkflows: jest.fn().mockResolvedValue([existingWorkflow]),
        deleteWorkflow: jest.fn().mockResolvedValue(false), // Simulate deletion failure
        createWorkflow: jest.fn().mockImplementation((workflow: any) => 
          originalWorkflowService.createWorkflow(workflow)
        )
      };
      (predefinedService as any).workflowService = mockWorkflowService;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await predefinedService.resetPredefinedWorkflows();

      expect(result.deleted).toBe(0);
      expect(result.created).toBe(2); // Should still create new ones
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to delete workflow "Daily Sales Report"');

      // Verify the mock was called
      expect(mockWorkflowService.deleteWorkflow).toHaveBeenCalledWith(existingWorkflow.id);

      // Restore original service
      (predefinedService as any).workflowService = originalWorkflowService;
      consoleSpy.mockRestore();
    });
  });

  describe('getPredefinedWorkflowStatuses', () => {
    it('should return status of all predefined workflows', async () => {
      // Create one predefined workflow
      const salesWorkflow = await workflowService.createWorkflow({
        name: 'Daily Sales Report',
        description: 'Sales report workflow',
        trigger: { type: 'cron', schedule: '0 8 * * *' },
        actions: [],
        status: 'active'
      });

      // Mock scheduler to show it's scheduled
      mockScheduler.getScheduledTasks.mockReturnValue([
        {
          workflowId: salesWorkflow.id,
          cronExpression: '0 8 * * *',
          task: {} as any,
          isRunning: false
        }
      ]);

      const statuses = await predefinedService.getPredefinedWorkflowStatuses();

      expect(statuses).toHaveLength(2);

      const salesStatus = statuses.find(s => s.name === 'Daily Sales Report');
      const healthStatus = statuses.find(s => s.name === 'Hourly System Health Check');

      expect(salesStatus).toBeDefined();
      expect(salesStatus!.exists).toBe(true);
      expect(salesStatus!.workflow).toBeDefined();
      expect(salesStatus!.scheduled).toBe(true);

      expect(healthStatus).toBeDefined();
      expect(healthStatus!.exists).toBe(false);
      expect(healthStatus!.workflow).toBeUndefined();
      expect(healthStatus!.scheduled).toBe(false);
    });

    it('should handle workflows that exist but are not scheduled', async () => {
      // Create workflow but don't schedule it
      const healthWorkflow = await workflowService.createWorkflow({
        name: 'Hourly System Health Check',
        description: 'Health check workflow',
        trigger: { type: 'manual' },
        actions: [],
        status: 'paused'
      });

      mockScheduler.getScheduledTasks.mockReturnValue([]); // No scheduled tasks

      const statuses = await predefinedService.getPredefinedWorkflowStatuses();

      const healthStatus = statuses.find(s => s.name === 'Hourly System Health Check');
      expect(healthStatus).toBeDefined();
      expect(healthStatus!.exists).toBe(true);
      expect(healthStatus!.workflow).toBeDefined();
      expect(healthStatus!.scheduled).toBe(false);
    });
  });

  describe('testPredefinedWorkflow', () => {
    it('should test a scheduled predefined workflow', async () => {
      // Create and schedule a workflow
      const workflow = await workflowService.createWorkflow({
        name: 'Daily Sales Report',
        description: 'Sales report workflow',
        trigger: { type: 'cron', schedule: '0 8 * * *' },
        actions: [],
        status: 'active'
      });

      // Mock scheduler to return scheduled task
      mockScheduler.getScheduledTask.mockReturnValue({
        workflowId: workflow.id,
        cronExpression: '0 8 * * *',
        task: {} as any,
        isRunning: false
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await predefinedService.testPredefinedWorkflow('Daily Sales Report');

      expect(result).toBe(true);
      expect(mockScheduler.triggerWorkflow).toHaveBeenCalledWith(workflow.id);
      expect(consoleSpy).toHaveBeenCalledWith('🧪 Testing predefined workflow: Daily Sales Report');

      consoleSpy.mockRestore();
    });

    it('should throw error for non-existent workflow', async () => {
      await expect(
        predefinedService.testPredefinedWorkflow('Non-existent Workflow')
      ).rejects.toThrow('Predefined workflow "Non-existent Workflow" not found');
    });

    it('should throw error for non-scheduled workflow', async () => {
      // Create workflow but don't schedule it
      await workflowService.createWorkflow({
        name: 'Daily Sales Report',
        description: 'Sales report workflow',
        trigger: { type: 'manual' },
        actions: [],
        status: 'active'
      });

      mockScheduler.getScheduledTask.mockReturnValue(undefined);

      await expect(
        predefinedService.testPredefinedWorkflow('Daily Sales Report')
      ).rejects.toThrow('Workflow "Daily Sales Report" is not scheduled and cannot be tested through scheduler');
    });
  });

  describe('Integration', () => {
    it('should handle complete workflow lifecycle', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // 1. Initialize predefined workflows
      const initResult = await predefinedService.initializePredefinedWorkflows();
      expect(initResult.created).toBe(2);

      // 2. Check statuses
      const statuses = await predefinedService.getPredefinedWorkflowStatuses();
      expect(statuses.every(s => s.exists)).toBe(true);

      // 3. Test a workflow
      mockScheduler.getScheduledTask.mockReturnValue({
        workflowId: 'test-id',
        cronExpression: '0 8 * * *',
        task: {} as any,
        isRunning: false
      });

      const testResult = await predefinedService.testPredefinedWorkflow('Daily Sales Report');
      expect(testResult).toBe(true);

      // 4. Reset workflows
      const resetResult = await predefinedService.resetPredefinedWorkflows();
      expect(resetResult.deleted).toBe(2);
      expect(resetResult.created).toBe(2);

      consoleSpy.mockRestore();
    });
  });
});