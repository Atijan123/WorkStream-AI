import { WorkflowEngine } from '../../engine/WorkflowEngine';
import { WorkflowScheduler } from '../../scheduler/WorkflowScheduler';
import { PredefinedWorkflowService } from '../../services/PredefinedWorkflowService';
import { WorkflowService } from '../../services/WorkflowService';
import { setupTestDb, cleanupTestDb } from '../../test-utils/testDb';

describe('Predefined Workflows Integration', () => {
  let workflowEngine: WorkflowEngine;
  let scheduler: WorkflowScheduler;
  let predefinedService: PredefinedWorkflowService;
  let workflowService: WorkflowService;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(async () => {
    workflowEngine = new WorkflowEngine();
    scheduler = new WorkflowScheduler();
    predefinedService = new PredefinedWorkflowService(scheduler);
    workflowService = new WorkflowService();

    // Clean up any existing workflows
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

  describe('Complete Workflow Lifecycle', () => {
    it('should initialize, schedule, and execute predefined workflows', async () => {
      // 1. Initialize predefined workflows
      const initResult = await predefinedService.initializePredefinedWorkflows();
      expect(initResult.created).toBe(2);
      expect(initResult.updated).toBe(0);
      expect(initResult.errors).toHaveLength(0);

      // 2. Start scheduler
      await scheduler.start();
      expect(scheduler.isRunning()).toBe(true);

      // 3. Verify workflows are scheduled
      const scheduledTasks = scheduler.getScheduledTasks();
      expect(scheduledTasks).toHaveLength(2);

      const salesReportTask = scheduledTasks.find(task => 
        task.cronExpression === '0 8 * * *'
      );
      const healthCheckTask = scheduledTasks.find(task => 
        task.cronExpression === '0 * * * *'
      );

      expect(salesReportTask).toBeDefined();
      expect(healthCheckTask).toBeDefined();

      // 4. Test manual execution of workflows
      const salesReportResult = await scheduler.triggerWorkflow(salesReportTask!.workflowId);
      expect(salesReportResult).toBe(true);

      const healthCheckResult = await scheduler.triggerWorkflow(healthCheckTask!.workflowId);
      expect(healthCheckResult).toBe(true);

      // 5. Verify execution logs were created
      const salesWorkflow = await workflowService.getWorkflow(salesReportTask!.workflowId);
      const healthWorkflow = await workflowService.getWorkflow(healthCheckTask!.workflowId);

      expect(salesWorkflow).toBeDefined();
      expect(healthWorkflow).toBeDefined();

      const salesLogs = await workflowService.getWorkflowHistory(salesWorkflow!.id, 5);
      const healthLogs = await workflowService.getWorkflowHistory(healthWorkflow!.id, 5);

      expect(salesLogs.length).toBeGreaterThan(0);
      expect(healthLogs.length).toBeGreaterThan(0);

      // 6. Check workflow statuses
      const statuses = await predefinedService.getPredefinedWorkflowStatuses();
      expect(statuses).toHaveLength(2);
      expect(statuses.every(s => s.exists)).toBe(true);
      expect(statuses.every(s => s.scheduled)).toBe(true);
    });

    it('should handle workflow updates correctly', async () => {
      // 1. Initialize predefined workflows
      await predefinedService.initializePredefinedWorkflows();
      await scheduler.start();

      const initialWorkflows = await workflowService.getAllWorkflows();
      expect(initialWorkflows).toHaveLength(2);

      // 2. Modify one of the workflows manually
      const salesWorkflow = initialWorkflows.find(w => w.name === 'Daily Sales Report');
      expect(salesWorkflow).toBeDefined();

      await workflowService.updateWorkflow(salesWorkflow!.id, {
        description: 'Modified description',
        status: 'paused'
      });

      // 3. Re-initialize (should update the modified workflow)
      const updateResult = await predefinedService.initializePredefinedWorkflows();
      expect(updateResult.created).toBe(0);
      expect(updateResult.updated).toBe(2); // Both should be updated to match predefined specs
      expect(updateResult.errors).toHaveLength(0);

      // 4. Verify the workflow was restored to predefined state
      const updatedWorkflow = await workflowService.getWorkflow(salesWorkflow!.id);
      expect(updatedWorkflow).toBeDefined();
      expect(updatedWorkflow!.description).toBe('Generate and email daily sales report at 8 AM');
      expect(updatedWorkflow!.status).toBe('active');
    });

    it('should reset workflows correctly', async () => {
      // 1. Initialize predefined workflows
      await predefinedService.initializePredefinedWorkflows();
      await scheduler.start();

      const initialWorkflows = await workflowService.getAllWorkflows();
      const initialIds = initialWorkflows.map(w => w.id);

      // 2. Create a non-predefined workflow
      const customWorkflow = await workflowService.createWorkflow({
        name: 'Custom Workflow',
        description: 'User created workflow',
        trigger: { type: 'manual' },
        actions: [{ type: 'log_result', parameters: { message: 'custom' } }],
        status: 'active'
      });

      // 3. Reset predefined workflows
      const resetResult = await predefinedService.resetPredefinedWorkflows();
      expect(resetResult.deleted).toBe(2); // Only predefined workflows should be deleted
      expect(resetResult.created).toBe(2);
      expect(resetResult.errors).toHaveLength(0);

      // 4. Verify new workflows were created with different IDs
      const finalWorkflows = await workflowService.getAllWorkflows();
      const predefinedWorkflows = finalWorkflows.filter(w => 
        w.name === 'Daily Sales Report' || w.name === 'Hourly System Health Check'
      );
      const customWorkflows = finalWorkflows.filter(w => w.name === 'Custom Workflow');

      expect(predefinedWorkflows).toHaveLength(2);
      expect(customWorkflows).toHaveLength(1);
      expect(customWorkflows[0].id).toBe(customWorkflow.id); // Custom workflow should be unchanged

      // New predefined workflows should have different IDs
      const newIds = predefinedWorkflows.map(w => w.id);
      expect(newIds.every(id => !initialIds.includes(id))).toBe(true);
    });
  });

  describe('Workflow Execution', () => {
    it('should execute Daily Sales Report workflow actions', async () => {
      // Mock fetch for the sales API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          date: '2025-08-11',
          totalSales: 15000,
          totalOrders: 45,
          topProduct: 'Widget Pro'
        })
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Initialize and start
      await predefinedService.initializePredefinedWorkflows();
      await scheduler.start();

      // Find and execute the sales report workflow
      const workflows = await workflowService.getAllWorkflows();
      const salesWorkflow = workflows.find(w => w.name === 'Daily Sales Report');
      expect(salesWorkflow).toBeDefined();

      // Execute the workflow directly using the engine
      const result = await workflowEngine.executeWorkflow(salesWorkflow!.id);

      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(4); // 4 actions in the workflow

      // Verify each action executed successfully
      result.data.results.forEach((actionResult: any) => {
        expect(actionResult.success).toBe(true);
      });

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.company.com/sales/daily',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer ${SALES_API_TOKEN}',
            'Content-Type': 'application/json'
          })
        })
      );

      // Verify email was "sent" (logged)
      expect(consoleSpy).toHaveBeenCalledWith(
        '📧 Email sent:',
        expect.objectContaining({
          to: ['sales@company.com', 'management@company.com'],
          subject: 'Daily Sales Report - {{date}}'
        })
      );

      consoleSpy.mockRestore();
      (global.fetch as jest.Mock).mockRestore();
    });

    it('should execute Hourly System Health Check workflow', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Initialize and start
      await predefinedService.initializePredefinedWorkflows();
      await scheduler.start();

      // Find and execute the health check workflow
      const workflows = await workflowService.getAllWorkflows();
      const healthWorkflow = workflows.find(w => w.name === 'Hourly System Health Check');
      expect(healthWorkflow).toBeDefined();

      // Execute the workflow directly using the engine
      const result = await workflowEngine.executeWorkflow(healthWorkflow!.id);

      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(2); // 2 actions in the workflow

      // Verify each action executed successfully
      result.data.results.forEach((actionResult: any) => {
        expect(actionResult.success).toBe(true);
      });

      // Verify system metrics were collected
      const metricsResult = result.data.results[0];
      expect(metricsResult.data).toHaveProperty('cpu_usage');
      expect(metricsResult.data).toHaveProperty('memory_usage');
      expect(metricsResult.data).toHaveProperty('timestamp');

      // Verify log was created
      const logResult = result.data.results[1];
      expect(logResult.data).toHaveProperty('level', 'info');
      expect(logResult.data.message).toContain('System health check completed');

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle workflow execution failures gracefully', async () => {
      // Mock fetch to fail
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Initialize and start
      await predefinedService.initializePredefinedWorkflows();
      await scheduler.start();

      // Find and execute the sales report workflow (which will fail on fetch)
      const workflows = await workflowService.getAllWorkflows();
      const salesWorkflow = workflows.find(w => w.name === 'Daily Sales Report');
      expect(salesWorkflow).toBeDefined();

      // Execute the workflow - should fail but not crash
      const result = await workflowEngine.executeWorkflow(salesWorkflow!.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');

      // Verify error was logged
      const logs = await workflowService.getWorkflowHistory(salesWorkflow!.id, 5);
      const errorLog = logs.find(log => log.status === 'error');
      expect(errorLog).toBeDefined();
      expect(errorLog!.message).toContain('Network error');

      consoleSpy.mockRestore();
      (global.fetch as jest.Mock).mockRestore();
    });
  });
});