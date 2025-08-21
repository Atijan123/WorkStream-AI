import { WorkflowRepository } from '../../repositories/WorkflowRepository';
import { Workflow } from '../../types';
import { setupTestDatabase, TestDatabaseConnection } from '../../test-utils/testDb';

describe('WorkflowRepository', () => {
  let repository: WorkflowRepository;
  let testDb: TestDatabaseConnection;

  beforeEach(async () => {
    testDb = await setupTestDatabase();
    repository = new WorkflowRepository();
    // Override the database connection for testing
    (repository as any).db = testDb;
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
      },
      {
        type: 'log_result',
        parameters: { message: 'Data fetched successfully' }
      }
    ],
    status: 'active'
  });

  describe('create', () => {
    it('should create a new workflow', async () => {
      const workflowData = createSampleWorkflow();
      const created = await repository.create(workflowData);

      expect(created.id).toBeDefined();
      expect(created.name).toBe(workflowData.name);
      expect(created.description).toBe(workflowData.description);
      expect(created.trigger).toEqual(workflowData.trigger);
      expect(created.actions).toEqual(workflowData.actions);
      expect(created.status).toBe(workflowData.status);
    });

    it('should generate unique IDs for different workflows', async () => {
      const workflowData = createSampleWorkflow();
      const workflow1 = await repository.create(workflowData);
      const workflow2 = await repository.create({ ...workflowData, name: 'Another Workflow' });

      expect(workflow1.id).not.toBe(workflow2.id);
    });
  });

  describe('findById', () => {
    it('should find a workflow by ID', async () => {
      const workflowData = createSampleWorkflow();
      const created = await repository.create(workflowData);

      const found = await repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe(created.name);
    });

    it('should return null for non-existent workflow', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all workflows', async () => {
      const workflow1 = await repository.create(createSampleWorkflow());
      const workflow2 = await repository.create({ ...createSampleWorkflow(), name: 'Second Workflow' });

      const all = await repository.findAll();

      expect(all).toHaveLength(2);
      expect(all.map(w => w.id)).toContain(workflow1.id);
      expect(all.map(w => w.id)).toContain(workflow2.id);
    });

    it('should return empty array when no workflows exist', async () => {
      const all = await repository.findAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('findByStatus', () => {
    it('should find workflows by status', async () => {
      await repository.create({ ...createSampleWorkflow(), status: 'active' });
      await repository.create({ ...createSampleWorkflow(), name: 'Paused Workflow', status: 'paused' });
      await repository.create({ ...createSampleWorkflow(), name: 'Another Active', status: 'active' });

      const activeWorkflows = await repository.findByStatus('active');
      const pausedWorkflows = await repository.findByStatus('paused');

      expect(activeWorkflows).toHaveLength(2);
      expect(pausedWorkflows).toHaveLength(1);
      expect(pausedWorkflows[0].name).toBe('Paused Workflow');
    });
  });

  describe('update', () => {
    it('should update workflow fields', async () => {
      const created = await repository.create(createSampleWorkflow());

      const updated = await repository.update(created.id, {
        name: 'Updated Workflow',
        status: 'paused'
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Workflow');
      expect(updated!.status).toBe('paused');
      expect(updated!.description).toBe(created.description); // unchanged
    });

    it('should update workflow trigger and actions', async () => {
      const created = await repository.create(createSampleWorkflow());

      const newTrigger = { type: 'manual' as const };
      const newActions = [{ type: 'send_email' as const, parameters: { to: 'test@example.com' } }];

      const updated = await repository.update(created.id, {
        trigger: newTrigger,
        actions: newActions
      });

      expect(updated).not.toBeNull();
      expect(updated!.trigger).toEqual(newTrigger);
      expect(updated!.actions).toEqual(newActions);
    });

    it('should return null for non-existent workflow', async () => {
      const updated = await repository.update('non-existent-id', { name: 'Updated' });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a workflow', async () => {
      const created = await repository.create(createSampleWorkflow());

      const deleted = await repository.delete(created.id);
      expect(deleted).toBe(true);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent workflow', async () => {
      const deleted = await repository.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });
});