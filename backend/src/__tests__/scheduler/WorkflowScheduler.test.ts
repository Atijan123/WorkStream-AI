import { WorkflowScheduler, ScheduledTask } from '../../scheduler/WorkflowScheduler';
import { WorkflowService } from '../../services/WorkflowService';
import { WorkflowEngine } from '../../engine/WorkflowEngine';
import { Workflow } from '../../types';
import { setupTestDb, cleanupTestDb } from '../../test-utils/testDb';
import * as cron from 'node-cron';

// Mock node-cron
jest.mock('node-cron');
const mockCron = cron as jest.Mocked<typeof cron>;

describe('WorkflowScheduler', () => {
  let scheduler: WorkflowScheduler;
  let workflowService: WorkflowService;
  let mockScheduledTask: jest.Mocked<cron.ScheduledTask>;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock scheduled task
    mockScheduledTask = {
      start: jest.fn(),
      stop: jest.fn(),
      destroy: jest.fn(),
      getStatus: jest.fn().mockReturnValue('scheduled')
    } as any;

    // Mock cron.schedule to return our mock task
    mockCron.schedule.mockReturnValue(mockScheduledTask);
    mockCron.validate.mockReturnValue(true);

    scheduler = new WorkflowScheduler();
    workflowService = new WorkflowService();

    // Clean up any existing workflows from previous tests
    const existingWorkflows = await workflowService.getAllWorkflows();
    for (const workflow of existingWorkflows) {
      await workflowService.deleteWorkflow(workflow.id);
    }
  });

  afterEach(async () => {
    if (scheduler.isRunning()) {
      await scheduler.stop();
    }
  });

  describe('Scheduler Lifecycle', () => {
    it('should start successfully with no workflows', async () => {
      await scheduler.start();

      expect(scheduler.isRunning()).toBe(true);
      expect(scheduler.getScheduledTasks()).toHaveLength(0);
    });

    it('should start and schedule existing cron workflows', async () => {
      // Create test workflows
      const cronWorkflow: Omit<Workflow, 'id'> = {
        name: 'Daily Report',
        description: 'Generate daily report',
        trigger: { type: 'cron', schedule: '0 8 * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Daily report' } }],
        status: 'active'
      };

      const manualWorkflow: Omit<Workflow, 'id'> = {
        name: 'Manual Task',
        description: 'Manual task',
        trigger: { type: 'manual' },
        actions: [{ type: 'log_result', parameters: { message: 'Manual task' } }],
        status: 'active'
      };

      const createdCronWorkflow = await workflowService.createWorkflow(cronWorkflow);
      await workflowService.createWorkflow(manualWorkflow);

      await scheduler.start();

      expect(scheduler.isRunning()).toBe(true);
      expect(scheduler.getScheduledTasks()).toHaveLength(1);
      expect(mockCron.schedule).toHaveBeenCalledWith(
        '0 8 * * *',
        expect.any(Function),
        { scheduled: false, timezone: 'UTC' }
      );
      // The task should be started since scheduler is running
      expect(mockScheduledTask.start).toHaveBeenCalledTimes(1);
    });

    it('should stop successfully and cancel all tasks', async () => {
      const cronWorkflow: Omit<Workflow, 'id'> = {
        name: 'Hourly Check',
        description: 'Hourly system check',
        trigger: { type: 'cron', schedule: '0 * * * *' },
        actions: [{ type: 'check_system_metrics', parameters: {} }],
        status: 'active'
      };

      await workflowService.createWorkflow(cronWorkflow);
      await scheduler.start();

      expect(scheduler.getScheduledTasks()).toHaveLength(1);

      await scheduler.stop();

      expect(scheduler.isRunning()).toBe(false);
      expect(scheduler.getScheduledTasks()).toHaveLength(0);
      expect(mockScheduledTask.stop).toHaveBeenCalled();
    });

    it('should handle starting when already started', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await scheduler.start();
      await scheduler.start(); // Second start should warn

      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Scheduler is already started');
      consoleSpy.mockRestore();
    });

    it('should handle stopping when not running', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await scheduler.stop(); // Stop without starting should warn

      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Scheduler is not running');
      consoleSpy.mockRestore();
    });
  });

  describe('Workflow Scheduling', () => {
    beforeEach(async () => {
      await scheduler.start();
    });

    it('should schedule a valid cron workflow', async () => {
      const workflow: Omit<Workflow, 'id'> = {
        name: 'Test Cron Workflow',
        description: 'Test workflow',
        trigger: { type: 'cron', schedule: '*/5 * * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Test' } }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      const result = await scheduler.scheduleWorkflow(createdWorkflow);

      expect(result).toBe(true);
      expect(scheduler.getScheduledTasks()).toHaveLength(1);
      expect(mockCron.validate).toHaveBeenCalledWith('*/5 * * * *');
      expect(mockCron.schedule).toHaveBeenCalledWith(
        '*/5 * * * *',
        expect.any(Function),
        { scheduled: false, timezone: 'UTC' }
      );
    });

    it('should not schedule non-cron workflows', async () => {
      const workflow: Omit<Workflow, 'id'> = {
        name: 'Manual Workflow',
        description: 'Manual workflow',
        trigger: { type: 'manual' },
        actions: [{ type: 'log_result', parameters: { message: 'Manual' } }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      const result = await scheduler.scheduleWorkflow(createdWorkflow);

      expect(result).toBe(false);
      expect(scheduler.getScheduledTasks()).toHaveLength(0);
    });

    it('should not schedule inactive workflows', async () => {
      const workflow: Omit<Workflow, 'id'> = {
        name: 'Inactive Cron Workflow',
        description: 'Inactive workflow',
        trigger: { type: 'cron', schedule: '0 * * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Inactive' } }],
        status: 'paused'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      const result = await scheduler.scheduleWorkflow(createdWorkflow);

      expect(result).toBe(false);
      expect(scheduler.getScheduledTasks()).toHaveLength(0);
    });

    it('should not schedule workflows with invalid cron expressions', async () => {
      mockCron.validate.mockReturnValue(false);

      const workflow: Omit<Workflow, 'id'> = {
        name: 'Invalid Cron Workflow',
        description: 'Invalid cron workflow',
        trigger: { type: 'cron', schedule: 'invalid-cron' },
        actions: [{ type: 'log_result', parameters: { message: 'Invalid' } }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      const result = await scheduler.scheduleWorkflow(createdWorkflow);

      expect(result).toBe(false);
      expect(scheduler.getScheduledTasks()).toHaveLength(0);
      expect(mockCron.validate).toHaveBeenCalledWith('invalid-cron');
    });

    it('should replace existing schedule when rescheduling', async () => {
      const workflow: Omit<Workflow, 'id'> = {
        name: 'Rescheduled Workflow',
        description: 'Workflow to be rescheduled',
        trigger: { type: 'cron', schedule: '0 * * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Original' } }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      
      // Schedule initially
      await scheduler.scheduleWorkflow(createdWorkflow);
      expect(scheduler.getScheduledTasks()).toHaveLength(1);

      // Clear mock calls to focus on reschedule calls
      jest.clearAllMocks();

      // Update workflow with new schedule
      const updatedWorkflow = await workflowService.updateWorkflow(createdWorkflow.id, {
        trigger: { type: 'cron', schedule: '*/30 * * * *' }
      });

      // Reschedule
      const result = await scheduler.rescheduleWorkflow(updatedWorkflow!);

      expect(result).toBe(true);
      expect(scheduler.getScheduledTasks()).toHaveLength(1);
      expect(mockScheduledTask.stop).toHaveBeenCalled();
      expect(mockCron.schedule).toHaveBeenCalledWith(
        '*/30 * * * *',
        expect.any(Function),
        { scheduled: false, timezone: 'UTC' }
      );
    });
  });

  describe('Workflow Unscheduling', () => {
    beforeEach(async () => {
      await scheduler.start();
    });

    it('should unschedule existing workflow', async () => {
      const workflow: Omit<Workflow, 'id'> = {
        name: 'To Be Unscheduled',
        description: 'Workflow to unschedule',
        trigger: { type: 'cron', schedule: '0 * * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Unschedule me' } }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      await scheduler.scheduleWorkflow(createdWorkflow);

      expect(scheduler.getScheduledTasks()).toHaveLength(1);

      const result = await scheduler.unscheduleWorkflow(createdWorkflow.id);

      expect(result).toBe(true);
      expect(scheduler.getScheduledTasks()).toHaveLength(0);
      expect(mockScheduledTask.stop).toHaveBeenCalled();
    });

    it('should handle unscheduling non-existent workflow', async () => {
      const result = await scheduler.unscheduleWorkflow('non-existent-id');

      expect(result).toBe(false);
      expect(scheduler.getScheduledTasks()).toHaveLength(0);
    });
  });

  describe('Workflow Execution', () => {
    let mockWorkflowEngine: jest.Mocked<WorkflowEngine>;

    beforeEach(async () => {
      await scheduler.start();
      
      // Mock the workflow engine
      mockWorkflowEngine = {
        executeWorkflow: jest.fn(),
        getRunningExecutions: jest.fn().mockReturnValue([])
      } as any;
      
      // Replace the engine in scheduler
      (scheduler as any).workflowEngine = mockWorkflowEngine;
    });

    it('should execute scheduled workflow successfully', async () => {
      mockWorkflowEngine.executeWorkflow.mockResolvedValue({
        success: true,
        duration: 1000,
        data: { results: [] }
      });

      const workflow: Omit<Workflow, 'id'> = {
        name: 'Executable Workflow',
        description: 'Workflow to execute',
        trigger: { type: 'cron', schedule: '* * * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Execute me' } }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      await scheduler.scheduleWorkflow(createdWorkflow);

      // Get the scheduled function and call it manually
      const scheduleCalls = mockCron.schedule.mock.calls;
      const scheduleFunction = scheduleCalls[0][1] as Function;
      
      await scheduleFunction();

      expect(mockWorkflowEngine.executeWorkflow).toHaveBeenCalledWith(createdWorkflow.id);
    });

    it('should handle workflow execution failure', async () => {
      mockWorkflowEngine.executeWorkflow.mockResolvedValue({
        success: false,
        error: 'Test error',
        duration: 500
      });

      const workflow: Omit<Workflow, 'id'> = {
        name: 'Failing Workflow',
        description: 'Workflow that fails',
        trigger: { type: 'cron', schedule: '* * * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Fail me' } }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      await scheduler.scheduleWorkflow(createdWorkflow);

      // Get the scheduled function and call it manually
      const scheduleCalls = mockCron.schedule.mock.calls;
      const scheduleFunction = scheduleCalls[0][1] as Function;
      
      await scheduleFunction();

      expect(mockWorkflowEngine.executeWorkflow).toHaveBeenCalledWith(createdWorkflow.id);
    });

    it('should skip execution if workflow is already running', async () => {
      // Mock a long-running execution
      let resolveExecution: (value: any) => void;
      const executionPromise = new Promise(resolve => {
        resolveExecution = resolve;
      });
      
      mockWorkflowEngine.executeWorkflow.mockReturnValue(executionPromise as any);

      const workflow: Omit<Workflow, 'id'> = {
        name: 'Long Running Workflow',
        description: 'Long running workflow',
        trigger: { type: 'cron', schedule: '* * * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Long task' } }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      await scheduler.scheduleWorkflow(createdWorkflow);

      // Get the scheduled function
      const scheduleCalls = mockCron.schedule.mock.calls;
      const scheduleFunction = scheduleCalls[0][1] as Function;
      
      // Start first execution (don't await)
      const firstExecution = scheduleFunction();
      
      // Try to start second execution immediately
      await scheduleFunction();

      // The second call should be skipped, so executeWorkflow should only be called once
      expect(mockWorkflowEngine.executeWorkflow).toHaveBeenCalledTimes(1);

      // Resolve the first execution
      resolveExecution!({ success: true, duration: 1000 });
      await firstExecution;
    });

    it('should manually trigger scheduled workflow', async () => {
      mockWorkflowEngine.executeWorkflow.mockResolvedValue({
        success: true,
        duration: 800,
        data: { results: [] }
      });

      const workflow: Omit<Workflow, 'id'> = {
        name: 'Manually Triggered Workflow',
        description: 'Workflow to trigger manually',
        trigger: { type: 'cron', schedule: '0 0 * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Manual trigger' } }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      await scheduler.scheduleWorkflow(createdWorkflow);

      const result = await scheduler.triggerWorkflow(createdWorkflow.id);

      expect(result).toBe(true);
      expect(mockWorkflowEngine.executeWorkflow).toHaveBeenCalledWith(createdWorkflow.id);
    });

    it('should handle manual trigger of non-existent workflow', async () => {
      const result = await scheduler.triggerWorkflow('non-existent-id');

      expect(result).toBe(false);
      expect(mockWorkflowEngine.executeWorkflow).not.toHaveBeenCalled();
    });
  });

  describe('Scheduler Statistics and Management', () => {
    beforeEach(async () => {
      await scheduler.start();
    });

    it('should provide accurate statistics', async () => {
      const workflow1: Omit<Workflow, 'id'> = {
        name: 'Stats Workflow 1',
        description: 'First workflow for stats',
        trigger: { type: 'cron', schedule: '0 * * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Stats 1' } }],
        status: 'active'
      };

      const workflow2: Omit<Workflow, 'id'> = {
        name: 'Stats Workflow 2',
        description: 'Second workflow for stats',
        trigger: { type: 'cron', schedule: '*/30 * * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Stats 2' } }],
        status: 'active'
      };

      const createdWorkflow1 = await workflowService.createWorkflow(workflow1);
      const createdWorkflow2 = await workflowService.createWorkflow(workflow2);

      await scheduler.scheduleWorkflow(createdWorkflow1);
      await scheduler.scheduleWorkflow(createdWorkflow2);

      const stats = scheduler.getStats();

      expect(stats.totalScheduledWorkflows).toBe(2);
      expect(stats.activeScheduledWorkflows).toBe(2);
      expect(stats.runningExecutions).toBe(0);
      expect(stats.lastSchedulerStart).toBeDefined();
    });

    it('should reload workflows from database', async () => {
      // Create initial workflow
      const workflow1: Omit<Workflow, 'id'> = {
        name: 'Initial Workflow',
        description: 'Initial workflow',
        trigger: { type: 'cron', schedule: '0 * * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Initial' } }],
        status: 'active'
      };

      const createdWorkflow1 = await workflowService.createWorkflow(workflow1);
      await scheduler.scheduleWorkflow(createdWorkflow1);

      expect(scheduler.getScheduledTasks()).toHaveLength(1);

      // Create another workflow directly in database (simulating external change)
      const workflow2: Omit<Workflow, 'id'> = {
        name: 'New Workflow',
        description: 'New workflow added externally',
        trigger: { type: 'cron', schedule: '*/15 * * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'New' } }],
        status: 'active'
      };

      await workflowService.createWorkflow(workflow2);

      // Reload workflows
      await scheduler.reloadWorkflows();

      expect(scheduler.getScheduledTasks()).toHaveLength(2);
    });

    it('should handle reload when scheduler is not running', async () => {
      await scheduler.stop();

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await scheduler.reloadWorkflows();

      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Scheduler is not running, cannot reload workflows');
      consoleSpy.mockRestore();
    });

    it('should get scheduled task by workflow ID', async () => {
      const workflow: Omit<Workflow, 'id'> = {
        name: 'Findable Workflow',
        description: 'Workflow to find',
        trigger: { type: 'cron', schedule: '0 12 * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'Find me' } }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      await scheduler.scheduleWorkflow(createdWorkflow);

      const scheduledTask = scheduler.getScheduledTask(createdWorkflow.id);

      expect(scheduledTask).toBeDefined();
      expect(scheduledTask!.workflowId).toBe(createdWorkflow.id);
      expect(scheduledTask!.cronExpression).toBe('0 12 * * *');
    });

    it('should return undefined for non-existent scheduled task', async () => {
      const scheduledTask = scheduler.getScheduledTask('non-existent-id');

      expect(scheduledTask).toBeUndefined();
    });
  });
});