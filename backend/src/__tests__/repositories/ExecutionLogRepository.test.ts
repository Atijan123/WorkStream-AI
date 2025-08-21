import { ExecutionLogRepository } from '../../repositories/ExecutionLogRepository';
import { ExecutionLog } from '../../repositories/interfaces';
import { setupTestDatabase, TestDatabaseConnection } from '../../test-utils/testDb';

describe('ExecutionLogRepository', () => {
  let repository: ExecutionLogRepository;
  let testDb: TestDatabaseConnection;

  beforeEach(async () => {
    testDb = await setupTestDatabase();
    repository = new ExecutionLogRepository();
    // Override the database connection for testing
    (repository as any).db = testDb;
  });

  afterEach(async () => {
    await testDb.close();
  });

  const createSampleLog = (overrides: Partial<Omit<ExecutionLog, 'id'>> = {}): Omit<ExecutionLog, 'id'> => ({
    workflow_id: 'test-workflow-id',
    status: 'success',
    message: 'Workflow executed successfully',
    execution_time: new Date('2024-01-01T10:00:00Z'),
    duration_ms: 1500,
    ...overrides
  });

  describe('create', () => {
    it('should create a new execution log', async () => {
      const logData = createSampleLog();
      const created = await repository.create(logData);

      expect(created.id).toBeDefined();
      expect(created.workflow_id).toBe(logData.workflow_id);
      expect(created.status).toBe(logData.status);
      expect(created.message).toBe(logData.message);
      expect(created.execution_time).toEqual(logData.execution_time);
      expect(created.duration_ms).toBe(logData.duration_ms);
    });

    it('should create log without duration_ms', async () => {
      const logData = createSampleLog({ duration_ms: undefined });
      const created = await repository.create(logData);

      expect(created.id).toBeDefined();
      expect(created.duration_ms).toBeUndefined();
    });
  });

  describe('findByWorkflowId', () => {
    it('should find logs by workflow ID', async () => {
      const workflowId1 = 'workflow-1';
      const workflowId2 = 'workflow-2';

      await repository.create(createSampleLog({ workflow_id: workflowId1, message: 'Log 1' }));
      await repository.create(createSampleLog({ workflow_id: workflowId2, message: 'Log 2' }));
      await repository.create(createSampleLog({ workflow_id: workflowId1, message: 'Log 3' }));

      const logs = await repository.findByWorkflowId(workflowId1);

      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.workflow_id === workflowId1)).toBe(true);
      expect(logs.map(log => log.message)).toContain('Log 1');
      expect(logs.map(log => log.message)).toContain('Log 3');
    });

    it('should return empty array for workflow with no logs', async () => {
      const logs = await repository.findByWorkflowId('non-existent-workflow');
      expect(logs).toHaveLength(0);
    });

    it('should return logs in descending order by execution time', async () => {
      const workflowId = 'test-workflow';
      
      await repository.create(createSampleLog({ 
        workflow_id: workflowId, 
        execution_time: new Date('2024-01-01T10:00:00Z'),
        message: 'First'
      }));
      await repository.create(createSampleLog({ 
        workflow_id: workflowId, 
        execution_time: new Date('2024-01-01T12:00:00Z'),
        message: 'Third'
      }));
      await repository.create(createSampleLog({ 
        workflow_id: workflowId, 
        execution_time: new Date('2024-01-01T11:00:00Z'),
        message: 'Second'
      }));

      const logs = await repository.findByWorkflowId(workflowId);

      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe('Third');
      expect(logs[1].message).toBe('Second');
      expect(logs[2].message).toBe('First');
    });
  });

  describe('findByStatus', () => {
    it('should find logs by status', async () => {
      await repository.create(createSampleLog({ status: 'success', message: 'Success 1' }));
      await repository.create(createSampleLog({ status: 'error', message: 'Error 1' }));
      await repository.create(createSampleLog({ status: 'success', message: 'Success 2' }));
      await repository.create(createSampleLog({ status: 'running', message: 'Running 1' }));

      const successLogs = await repository.findByStatus('success');
      const errorLogs = await repository.findByStatus('error');
      const runningLogs = await repository.findByStatus('running');

      expect(successLogs).toHaveLength(2);
      expect(errorLogs).toHaveLength(1);
      expect(runningLogs).toHaveLength(1);

      expect(successLogs.every(log => log.status === 'success')).toBe(true);
      expect(errorLogs[0].message).toBe('Error 1');
      expect(runningLogs[0].message).toBe('Running 1');
    });
  });

  describe('findRecent', () => {
    it('should find recent logs with default limit', async () => {
      // Create more than 50 logs to test default limit
      for (let i = 0; i < 60; i++) {
        await repository.create(createSampleLog({ 
          message: `Log ${i}`,
          execution_time: new Date(Date.now() + i * 1000) // Different timestamps
        }));
      }

      const recentLogs = await repository.findRecent();

      expect(recentLogs).toHaveLength(50); // Default limit
    });

    it('should find recent logs with custom limit', async () => {
      for (let i = 0; i < 10; i++) {
        await repository.create(createSampleLog({ 
          message: `Log ${i}`,
          execution_time: new Date(Date.now() + i * 1000)
        }));
      }

      const recentLogs = await repository.findRecent(5);

      expect(recentLogs).toHaveLength(5);
    });

    it('should return logs in descending order by execution time', async () => {
      await repository.create(createSampleLog({ 
        execution_time: new Date('2024-01-01T10:00:00Z'),
        message: 'First'
      }));
      await repository.create(createSampleLog({ 
        execution_time: new Date('2024-01-01T12:00:00Z'),
        message: 'Latest'
      }));
      await repository.create(createSampleLog({ 
        execution_time: new Date('2024-01-01T11:00:00Z'),
        message: 'Middle'
      }));

      const recentLogs = await repository.findRecent(10);

      expect(recentLogs[0].message).toBe('Latest');
      expect(recentLogs[1].message).toBe('Middle');
      expect(recentLogs[2].message).toBe('First');
    });
  });

  describe('getWorkflowHistory', () => {
    it('should get workflow history with default limit', async () => {
      const workflowId = 'test-workflow';

      // Create more than 100 logs to test default limit
      for (let i = 0; i < 120; i++) {
        await repository.create(createSampleLog({ 
          workflow_id: workflowId,
          message: `Log ${i}`,
          execution_time: new Date(Date.now() + i * 1000)
        }));
      }

      const history = await repository.getWorkflowHistory(workflowId);

      expect(history).toHaveLength(100); // Default limit
      expect(history.every(log => log.workflow_id === workflowId)).toBe(true);
    });

    it('should get workflow history with custom limit', async () => {
      const workflowId = 'test-workflow';

      for (let i = 0; i < 20; i++) {
        await repository.create(createSampleLog({ 
          workflow_id: workflowId,
          message: `Log ${i}`,
          execution_time: new Date(Date.now() + i * 1000)
        }));
      }

      const history = await repository.getWorkflowHistory(workflowId, 10);

      expect(history).toHaveLength(10);
      expect(history.every(log => log.workflow_id === workflowId)).toBe(true);
    });

    it('should return history in descending order by execution time', async () => {
      const workflowId = 'test-workflow';

      await repository.create(createSampleLog({ 
        workflow_id: workflowId,
        execution_time: new Date('2024-01-01T10:00:00Z'),
        message: 'First'
      }));
      await repository.create(createSampleLog({ 
        workflow_id: workflowId,
        execution_time: new Date('2024-01-01T12:00:00Z'),
        message: 'Latest'
      }));
      await repository.create(createSampleLog({ 
        workflow_id: workflowId,
        execution_time: new Date('2024-01-01T11:00:00Z'),
        message: 'Middle'
      }));

      const history = await repository.getWorkflowHistory(workflowId, 10);

      expect(history[0].message).toBe('Latest');
      expect(history[1].message).toBe('Middle');
      expect(history[2].message).toBe('First');
    });

    it('should only return logs for the specified workflow', async () => {
      const workflowId1 = 'workflow-1';
      const workflowId2 = 'workflow-2';

      await repository.create(createSampleLog({ workflow_id: workflowId1, message: 'Workflow 1 Log' }));
      await repository.create(createSampleLog({ workflow_id: workflowId2, message: 'Workflow 2 Log' }));
      await repository.create(createSampleLog({ workflow_id: workflowId1, message: 'Another Workflow 1 Log' }));

      const history = await repository.getWorkflowHistory(workflowId1);

      expect(history).toHaveLength(2);
      expect(history.every(log => log.workflow_id === workflowId1)).toBe(true);
      expect(history.map(log => log.message)).toContain('Workflow 1 Log');
      expect(history.map(log => log.message)).toContain('Another Workflow 1 Log');
    });
  });
});