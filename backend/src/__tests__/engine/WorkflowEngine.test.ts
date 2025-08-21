import { WorkflowEngine, WorkflowExecutionContext, ActionResult } from '../../engine/WorkflowEngine';
import { WorkflowService } from '../../services/WorkflowService';
import { SystemMetricsRepository } from '../../repositories/SystemMetricsRepository';
import { Workflow, WorkflowAction } from '../../types';
import { setupTestDb, cleanupTestDb } from '../../test-utils/testDb';

// Mock fetch globally
global.fetch = jest.fn();

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined)
}));

// Mock os module
jest.mock('os', () => ({
  cpus: jest.fn(() => [
    { times: { user: 1000, nice: 0, sys: 500, idle: 8500, irq: 0 } },
    { times: { user: 1200, nice: 0, sys: 600, idle: 8200, irq: 0 } }
  ]),
  totalmem: jest.fn(() => 8589934592), // 8GB
  freemem: jest.fn(() => 4294967296)   // 4GB
}));

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let workflowService: WorkflowService;
  let systemMetricsRepo: SystemMetricsRepository;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(() => {
    engine = new WorkflowEngine();
    workflowService = new WorkflowService();
    systemMetricsRepo = new SystemMetricsRepository();
    
    // Reset mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('executeWorkflow', () => {
    it('should execute a simple workflow successfully', async () => {
      // Create a test workflow
      const workflow: Omit<Workflow, 'id'> = {
        name: 'Test Workflow',
        description: 'A simple test workflow',
        trigger: { type: 'manual' },
        actions: [
          {
            type: 'log_result',
            parameters: { message: 'Hello World', level: 'info' }
          }
        ],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      
      // Execute the workflow
      const result = await engine.executeWorkflow(createdWorkflow.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].success).toBe(true);
    });

    it('should handle workflow not found', async () => {
      const result = await engine.executeWorkflow('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle inactive workflow', async () => {
      const workflow: Omit<Workflow, 'id'> = {
        name: 'Inactive Workflow',
        description: 'An inactive workflow',
        trigger: { type: 'manual' },
        actions: [],
        status: 'paused'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      const result = await engine.executeWorkflow(createdWorkflow.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });

    it('should handle action failure and stop execution', async () => {
      const workflow: Omit<Workflow, 'id'> = {
        name: 'Failing Workflow',
        description: 'A workflow with failing action',
        trigger: { type: 'manual' },
        actions: [
          {
            type: 'fetch_data',
            parameters: {} // Missing required URL parameter
          },
          {
            type: 'log_result',
            parameters: { message: 'This should not execute' }
          }
        ],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);
      const result = await engine.executeWorkflow(createdWorkflow.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('URL parameter is required');
    });
  });

  describe('Action Handlers', () => {
    let testWorkflow: Workflow;

    beforeEach(async () => {
      const workflow: Omit<Workflow, 'id'> = {
        name: 'Action Test Workflow',
        description: 'Testing individual actions',
        trigger: { type: 'manual' },
        actions: [],
        status: 'active'
      };
      testWorkflow = await workflowService.createWorkflow(workflow);
    });

    describe('fetch_data action', () => {
      it('should fetch data successfully', async () => {
        const mockResponse = { data: 'test data' };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse)
        });

        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'fetch_data',
            parameters: {
              url: 'https://api.example.com/data',
              method: 'GET',
              storeAs: 'apiData'
            }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/data', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: undefined
        });
      });

      it('should handle HTTP errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        });

        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'fetch_data',
            parameters: { url: 'https://api.example.com/notfound' }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(false);
        expect(result.error).toContain('HTTP 404: Not Found');
      });

      it('should require URL parameter', async () => {
        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'fetch_data',
            parameters: {}
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(false);
        expect(result.error).toContain('URL parameter is required');
      });
    });

    describe('generate_report action', () => {
      it('should generate JSON report', async () => {
        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'generate_report',
            parameters: {
              data: { name: 'Test Report', value: 123 },
              format: 'json',
              storeAs: 'report'
            }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(true);
        expect(result.data.results[0].data.format).toBe('json');
        expect(result.data.results[0].data.content).toContain('Test Report');
      });

      it('should generate CSV report from array data', async () => {
        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'generate_report',
            parameters: {
              data: [
                { name: 'Item 1', value: 100 },
                { name: 'Item 2', value: 200 }
              ],
              format: 'csv'
            }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(true);
        expect(result.data.results[0].data.format).toBe('csv');
        expect(result.data.results[0].data.content).toContain('name,value');
        expect(result.data.results[0].data.content).toContain('Item 1');
      });

      it('should generate text report with template', async () => {
        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'generate_report',
            parameters: {
              data: { title: 'My Report', count: 42 },
              format: 'text',
              template: 'Report: {{title}} - Count: {{count}}'
            }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(true);
        expect(result.data.results[0].data.content).toBe('Report: My Report - Count: 42');
      });
    });

    describe('send_email action', () => {
      it('should send email successfully', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'send_email',
            parameters: {
              to: 'test@example.com',
              subject: 'Test Email',
              body: 'This is a test email',
              storeAs: 'emailResult'
            }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('📧 Email sent:', expect.objectContaining({
          to: ['test@example.com'],
          subject: 'Test Email',
          body: 'This is a test email'
        }));

        consoleSpy.mockRestore();
      });

      it('should handle multiple recipients', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'send_email',
            parameters: {
              to: ['test1@example.com', 'test2@example.com'],
              subject: 'Test Email',
              body: 'This is a test email'
            }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('📧 Email sent:', expect.objectContaining({
          to: ['test1@example.com', 'test2@example.com']
        }));

        consoleSpy.mockRestore();
      });

      it('should require to, subject, and body parameters', async () => {
        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'send_email',
            parameters: {
              to: 'test@example.com'
              // Missing subject and body
            }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(false);
        expect(result.error).toContain('to, subject, and body parameters are required');
      });
    });

    describe('check_system_metrics action', () => {
      it('should collect system metrics', async () => {
        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'check_system_metrics',
            parameters: { storeAs: 'metrics' }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(true);
        expect(result.data.results[0].data).toHaveProperty('cpu_usage');
        expect(result.data.results[0].data).toHaveProperty('memory_usage');
        expect(result.data.results[0].data).toHaveProperty('timestamp');
        expect(typeof result.data.results[0].data.cpu_usage).toBe('number');
        expect(typeof result.data.results[0].data.memory_usage).toBe('number');
      });

      it('should check thresholds and generate alerts', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'check_system_metrics',
            parameters: {
              thresholds: {
                cpu: 1, // Very low threshold to trigger alert
                memory: 1
              }
            }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(true);
        expect(result.data.results[0].data).toHaveProperty('alerts');
        expect(Array.isArray(result.data.results[0].data.alerts)).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('⚠️ System alerts:', expect.any(Array));

        consoleSpy.mockRestore();
      });
    });

    describe('log_result action', () => {
      it('should log info message', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'log_result',
            parameters: {
              message: 'Test info message',
              level: 'info',
              data: { key: 'value' }
            }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('🔵', expect.objectContaining({
          level: 'info',
          message: 'Test info message',
          data: { key: 'value' }
        }));

        consoleSpy.mockRestore();
      });

      it('should log error message', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'log_result',
            parameters: {
              message: 'Test error message',
              level: 'error'
            }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('🔴', expect.objectContaining({
          level: 'error',
          message: 'Test error message'
        }));

        consoleSpy.mockRestore();
      });

      it('should log warn message', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
          actions: [{
            type: 'log_result',
            parameters: {
              message: 'Test warning message',
              level: 'warn'
            }
          }]
        });

        const result = await engine.executeWorkflow(workflow!.id);

        expect(result.success).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('🟡', expect.objectContaining({
          level: 'warn',
          message: 'Test warning message'
        }));

        consoleSpy.mockRestore();
      });
    });

    it('should handle unknown action type', async () => {
      const workflow = await workflowService.updateWorkflow(testWorkflow.id, {
        actions: [{
          type: 'unknown_action' as any,
          parameters: {}
        }]
      });

      const result = await engine.executeWorkflow(workflow!.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action type: unknown_action');
    });
  });

  describe('Error Recovery', () => {
    it('should mark workflow as error after repeated failures', async () => {
      const workflow: Omit<Workflow, 'id'> = {
        name: 'Failing Workflow',
        description: 'A workflow that always fails',
        trigger: { type: 'manual' },
        actions: [{
          type: 'fetch_data',
          parameters: {} // Missing URL to cause failure
        }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);

      // Execute workflow multiple times to trigger error state
      // Need at least 3 failures to trigger error state
      for (let i = 0; i < 5; i++) {
        await engine.executeWorkflow(createdWorkflow.id);
        // Small delay to ensure logs are written
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Additional delay to ensure all database operations complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if workflow was marked as error
      const updatedWorkflow = await workflowService.getWorkflow(createdWorkflow.id);
      expect(updatedWorkflow?.status).toBe('error');
    });
  });

  describe('Execution Management', () => {
    it('should track running executions', async () => {
      // Mock a slow action to simulate long-running execution
      const originalHandleLogResult = (engine as any).handleLogResult;
      (engine as any).handleLogResult = jest.fn().mockImplementation(async (params: any, context: any) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        return originalHandleLogResult.call(engine, params, context);
      });

      const workflow: Omit<Workflow, 'id'> = {
        name: 'Long Running Workflow',
        description: 'A workflow that takes time',
        trigger: { type: 'manual' },
        actions: [{
          type: 'log_result',
          parameters: { message: 'Starting long task' }
        }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);

      // Start execution (don't await to simulate long-running)
      const executionPromise = engine.executeWorkflow(createdWorkflow.id);

      // Small delay to ensure execution has started
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check running executions
      const runningExecutions = engine.getRunningExecutions();
      expect(runningExecutions.length).toBeGreaterThan(0);

      // Wait for completion
      await executionPromise;

      // Check that execution is no longer running
      const runningExecutionsAfter = engine.getRunningExecutions();
      expect(runningExecutionsAfter.length).toBe(0);

      // Restore original method
      (engine as any).handleLogResult = originalHandleLogResult;
    });

    it('should allow stopping executions', async () => {
      // Mock a slow action to simulate long-running execution
      const originalHandleLogResult = (engine as any).handleLogResult;
      (engine as any).handleLogResult = jest.fn().mockImplementation(async (params: any, context: any) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        return originalHandleLogResult.call(engine, params, context);
      });

      const workflow: Omit<Workflow, 'id'> = {
        name: 'Stoppable Workflow',
        description: 'A workflow that can be stopped',
        trigger: { type: 'manual' },
        actions: [{
          type: 'log_result',
          parameters: { message: 'This should be stopped' }
        }],
        status: 'active'
      };

      const createdWorkflow = await workflowService.createWorkflow(workflow);

      // Start execution
      const executionPromise = engine.executeWorkflow(createdWorkflow.id);
      
      // Small delay to ensure execution has started
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Get execution ID
      const runningExecutions = engine.getRunningExecutions();
      expect(runningExecutions.length).toBe(1);
      
      const executionId = runningExecutions[0].executionId;

      // Stop execution
      const stopped = await engine.stopExecution(executionId);
      expect(stopped).toBe(true);

      // Wait for execution to complete
      await executionPromise;

      // Verify execution is no longer running
      const runningExecutionsAfter = engine.getRunningExecutions();
      expect(runningExecutionsAfter.length).toBe(0);

      // Restore original method
      (engine as any).handleLogResult = originalHandleLogResult;
    });
  });
});