import { WorkflowService } from '../../services/WorkflowService';
import { Workflow } from '../../types';
import { setupTestDatabase, TestDatabaseConnection } from '../../test-utils/testDb';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let testDb: TestDatabaseConnection;

  beforeEach(async () => {
    testDb = await setupTestDatabase();
    service = new WorkflowService();
    // Override the database connections for testing
    (service as any).workflowRepo.db = testDb;
    (service as any).executionLogRepo.db = testDb;
  });

  afterEach(async () => {
    await testDb.close();
  });

  const createSampleWorkflow = (): Omit<Workflow, 'id'> => ({
    name: 'Test Workflow',
    description: 'A test workflow',
    trigger: {
      type: 'cron',
      schedule: '0 8 * * *'
    },
    actions: [
      {
        type: 'fetch_data',
        parameters: { url: 'https://api.example.com/data' }
      }
    ],
    status: 'active'
  });

  describe('workflow management', () => {
    it('should create and retrieve a workflow', async () => {
      const workflowData = createSampleWorkflow();
      const created = await service.createWorkflow(workflowData);

      expect(created.id).toBeDefined();
      expect(created.name).toBe(workflowData.name);

      const retrieved = await service.getWorkflow(created.id);
      expect(retrieved).toEqual(created);
    });

    it('should get all workflows', async () => {
      await service.createWorkflow(createSampleWorkflow());
      await service.createWorkflow({ ...createSampleWorkflow(), name: 'Second Workflow' });

      const allWorkflows = await service.getAllWorkflows();
      expect(allWorkflows).toHaveLength(2);
    });

    it('should get active workflows only', async () => {
      await service.createWorkflow({ ...createSampleWorkflow(), status: 'active' });
      await service.createWorkflow({ ...createSampleWorkflow(), name: 'Paused', status: 'paused' });

      const activeWorkflows = await service.getActiveWorkflows();
      expect(activeWorkflows).toHaveLength(1);
      expect(activeWorkflows[0].status).toBe('active');
    });

    it('should update a workflow', async () => {
      const created = await service.createWorkflow(createSampleWorkflow());
      
      const updated = await service.updateWorkflow(created.id, {
        name: 'Updated Workflow',
        status: 'paused'
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Workflow');
      expect(updated!.status).toBe('paused');
    });

    it('should delete a workflow', async () => {
      const created = await service.createWorkflow(createSampleWorkflow());
      
      const deleted = await service.deleteWorkflow(created.id);
      expect(deleted).toBe(true);

      const retrieved = await service.getWorkflow(created.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('workflow status and history', () => {
    it('should get workflow status with execution data', async () => {
      const workflow = await service.createWorkflow(createSampleWorkflow());

      // Add some execution logs
      await service.logWorkflowExecution({
        workflow_id: workflow.id,
        status: 'success',
        message: 'Execution 1',
        execution_time: new Date('2024-01-01T10:00:00Z')
      });

      await service.logWorkflowExecution({
        workflow_id: workflow.id,
        status: 'error',
        message: 'Execution 2',
        execution_time: new Date('2024-01-01T11:00:00Z')
      });

      const status = await service.getWorkflowStatus(workflow.id);

      expect(status).not.toBeNull();
      expect(status!.workflow.id).toBe(workflow.id);
      expect(status!.executionCount).toBe(2);
      expect(status!.successRate).toBe(50); // 1 success out of 2 executions
      expect(status!.lastExecution!.message).toBe('Execution 2'); // Most recent
    });

    it('should get workflow status with no executions', async () => {
      const workflow = await service.createWorkflow(createSampleWorkflow());

      const status = await service.getWorkflowStatus(workflow.id);

      expect(status).not.toBeNull();
      expect(status!.workflow.id).toBe(workflow.id);
      expect(status!.executionCount).toBe(0);
      expect(status!.successRate).toBe(0);
      expect(status!.lastExecution).toBeUndefined();
    });

    it('should get all workflow statuses', async () => {
      const workflow1 = await service.createWorkflow(createSampleWorkflow());
      const workflow2 = await service.createWorkflow({ ...createSampleWorkflow(), name: 'Second' });

      await service.logWorkflowExecution({
        workflow_id: workflow1.id,
        status: 'success',
        message: 'Success',
        execution_time: new Date()
      });

      const statuses = await service.getAllWorkflowStatuses();

      expect(statuses).toHaveLength(2);
      expect(statuses.find(s => s.workflow.id === workflow1.id)!.executionCount).toBe(1);
      expect(statuses.find(s => s.workflow.id === workflow2.id)!.executionCount).toBe(0);
    });

    it('should get workflow history', async () => {
      const workflow = await service.createWorkflow(createSampleWorkflow());

      await service.logWorkflowExecution({
        workflow_id: workflow.id,
        status: 'success',
        message: 'First',
        execution_time: new Date('2024-01-01T10:00:00Z')
      });

      await service.logWorkflowExecution({
        workflow_id: workflow.id,
        status: 'success',
        message: 'Second',
        execution_time: new Date('2024-01-01T11:00:00Z')
      });

      const history = await service.getWorkflowHistory(workflow.id, 10);

      expect(history).toHaveLength(2);
      expect(history[0].message).toBe('Second'); // Most recent first
      expect(history[1].message).toBe('First');
    });
  });

  describe('execution logging and querying', () => {
    it('should log workflow execution', async () => {
      const workflow = await service.createWorkflow(createSampleWorkflow());

      const log = await service.logWorkflowExecution({
        workflow_id: workflow.id,
        status: 'success',
        message: 'Test execution',
        execution_time: new Date(),
        duration_ms: 1500
      });

      expect(log.id).toBeDefined();
      expect(log.workflow_id).toBe(workflow.id);
      expect(log.status).toBe('success');
      expect(log.duration_ms).toBe(1500);
    });

    it('should get recent executions', async () => {
      const workflow = await service.createWorkflow(createSampleWorkflow());

      await service.logWorkflowExecution({
        workflow_id: workflow.id,
        status: 'success',
        message: 'Recent 1',
        execution_time: new Date()
      });

      await service.logWorkflowExecution({
        workflow_id: workflow.id,
        status: 'error',
        message: 'Recent 2',
        execution_time: new Date()
      });

      const recent = await service.getRecentExecutions(10);

      expect(recent).toHaveLength(2);
    });

    it('should get failed executions', async () => {
      const workflow = await service.createWorkflow(createSampleWorkflow());

      await service.logWorkflowExecution({
        workflow_id: workflow.id,
        status: 'success',
        message: 'Success',
        execution_time: new Date()
      });

      await service.logWorkflowExecution({
        workflow_id: workflow.id,
        status: 'error',
        message: 'Error',
        execution_time: new Date()
      });

      const failed = await service.getFailedExecutions();

      expect(failed).toHaveLength(1);
      expect(failed[0].status).toBe('error');
      expect(failed[0].message).toBe('Error');
    });

    it('should get running executions', async () => {
      const workflow = await service.createWorkflow(createSampleWorkflow());

      await service.logWorkflowExecution({
        workflow_id: workflow.id,
        status: 'running',
        message: 'In progress',
        execution_time: new Date()
      });

      const running = await service.getRunningExecutions();

      expect(running).toHaveLength(1);
      expect(running[0].status).toBe('running');
    });
  });

  describe('workflow state management', () => {
    it('should pause a workflow', async () => {
      const workflow = await service.createWorkflow(createSampleWorkflow());

      const paused = await service.pauseWorkflow(workflow.id);

      expect(paused).not.toBeNull();
      expect(paused!.status).toBe('paused');
    });

    it('should resume a workflow', async () => {
      const workflow = await service.createWorkflow({ ...createSampleWorkflow(), status: 'paused' });

      const resumed = await service.resumeWorkflow(workflow.id);

      expect(resumed).not.toBeNull();
      expect(resumed!.status).toBe('active');
    });

    it('should mark workflow as error', async () => {
      const workflow = await service.createWorkflow(createSampleWorkflow());

      const errorWorkflow = await service.markWorkflowAsError(workflow.id);

      expect(errorWorkflow).not.toBeNull();
      expect(errorWorkflow!.status).toBe('error');
    });
  });
});