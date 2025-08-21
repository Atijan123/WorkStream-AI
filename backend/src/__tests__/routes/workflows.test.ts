import request from 'supertest';
import express from 'express';
import { Workflow } from '../../types';

// Create mock functions
const mockGetAllWorkflows = jest.fn();
const mockCreateWorkflow = jest.fn();
const mockGetWorkflow = jest.fn();
const mockGetWorkflowHistory = jest.fn();

// Mock the WorkflowService
jest.mock('../../services/WorkflowService', () => {
  return {
    WorkflowService: jest.fn().mockImplementation(() => ({
      getAllWorkflows: mockGetAllWorkflows,
      createWorkflow: mockCreateWorkflow,
      getWorkflow: mockGetWorkflow,
      getWorkflowHistory: mockGetWorkflowHistory,
    }))
  };
});

// Import routes after mocking
import workflowRoutes from '../../routes/workflows';

describe('Workflow Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/workflows', workflowRoutes);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/workflows', () => {
    it('should return all workflows', async () => {
      const mockWorkflows: Workflow[] = [
        {
          id: '1',
          name: 'Test Workflow 1',
          description: 'Test description 1',
          trigger: { type: 'cron', schedule: '0 8 * * *' },
          actions: [{ type: 'log_result', parameters: {} }],
          status: 'active'
        },
        {
          id: '2',
          name: 'Test Workflow 2',
          description: 'Test description 2',
          trigger: { type: 'manual' },
          actions: [{ type: 'check_system_metrics', parameters: {} }],
          status: 'paused'
        }
      ];

      mockGetAllWorkflows.mockResolvedValue(mockWorkflows);

      const response = await request(app)
        .get('/api/workflows')
        .expect(200);

      expect(response.body).toEqual(mockWorkflows);
      expect(mockGetAllWorkflows).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      mockGetAllWorkflows.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/workflows')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to fetch workflows',
        message: 'Database error'
      });
    });
  });

  describe('POST /api/workflows', () => {
    const validWorkflowData = {
      name: 'New Workflow',
      description: 'A new test workflow',
      trigger: { type: 'cron' as const, schedule: '0 9 * * *' },
      actions: [{ type: 'log_result' as const, parameters: { message: 'test' } }]
    };

    it('should create a new workflow with valid data', async () => {
      const createdWorkflow: Workflow = {
        id: 'new-id',
        ...validWorkflowData,
        status: 'active'
      };

      mockCreateWorkflow.mockResolvedValue(createdWorkflow);

      const response = await request(app)
        .post('/api/workflows')
        .send(validWorkflowData)
        .expect(201);

      expect(response.body).toEqual(createdWorkflow);
      expect(mockCreateWorkflow).toHaveBeenCalledWith({
        ...validWorkflowData,
        status: 'active'
      });
    });

    it('should create workflow with explicit status', async () => {
      const workflowWithStatus = {
        ...validWorkflowData,
        status: 'paused' as const
      };

      const createdWorkflow: Workflow = {
        id: 'new-id',
        ...workflowWithStatus
      };

      mockCreateWorkflow.mockResolvedValue(createdWorkflow);

      const response = await request(app)
        .post('/api/workflows')
        .send(workflowWithStatus)
        .expect(201);

      expect(response.body).toEqual(createdWorkflow);
      expect(mockCreateWorkflow).toHaveBeenCalledWith(workflowWithStatus);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        name: 'Test Workflow'
        // missing description, trigger, actions
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required fields',
        required: ['name', 'description', 'trigger', 'actions']
      });
      expect(mockCreateWorkflow).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid trigger type', async () => {
      const invalidData = {
        ...validWorkflowData,
        trigger: { type: 'invalid' as any }
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid trigger type',
        validTypes: ['cron', 'manual', 'event']
      });
    });

    it('should return 400 for cron trigger without schedule', async () => {
      const invalidData = {
        ...validWorkflowData,
        trigger: { type: 'cron' as const }
        // missing schedule
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Schedule is required for cron trigger type'
      });
    });

    it('should return 400 for empty actions array', async () => {
      const invalidData = {
        ...validWorkflowData,
        actions: []
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'At least one action is required'
      });
    });

    it('should return 400 for invalid action type', async () => {
      const invalidData = {
        ...validWorkflowData,
        actions: [{ type: 'invalid_action' as any, parameters: {} }]
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid action type: invalid_action',
        validTypes: ['fetch_data', 'generate_report', 'send_email', 'check_system_metrics', 'log_result']
      });
    });

    it('should handle service errors', async () => {
      mockCreateWorkflow.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/workflows')
        .send(validWorkflowData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to create workflow',
        message: 'Database error'
      });
    });
  });

  describe('GET /api/workflows/:id/logs', () => {
    const mockLogs = [
      {
        id: 1,
        workflow_id: 'workflow-1',
        status: 'success' as const,
        message: 'Workflow completed successfully',
        execution_time: '2023-01-01T10:00:00.000Z',
        duration_ms: 1500
      },
      {
        id: 2,
        workflow_id: 'workflow-1',
        status: 'error' as const,
        message: 'Workflow failed',
        execution_time: '2023-01-01T09:00:00.000Z',
        duration_ms: 500
      }
    ];

    it('should return workflow execution logs', async () => {
      const workflowId = 'workflow-1';
      const mockWorkflow: Workflow = {
        id: workflowId,
        name: 'Test Workflow',
        description: 'Test description',
        trigger: { type: 'cron', schedule: '0 8 * * *' },
        actions: [{ type: 'log_result', parameters: {} }],
        status: 'active'
      };

      mockGetWorkflow.mockResolvedValue(mockWorkflow);
      mockGetWorkflowHistory.mockResolvedValue(mockLogs);

      const response = await request(app)
        .get(`/api/workflows/${workflowId}/logs`)
        .expect(200);

      expect(response.body).toEqual(mockLogs);
      expect(mockGetWorkflow).toHaveBeenCalledWith(workflowId);
      expect(mockGetWorkflowHistory).toHaveBeenCalledWith(workflowId, undefined);
    });

    it('should return workflow logs with limit', async () => {
      const workflowId = 'workflow-1';
      const limit = 10;
      const mockWorkflow: Workflow = {
        id: workflowId,
        name: 'Test Workflow',
        description: 'Test description',
        trigger: { type: 'cron', schedule: '0 8 * * *' },
        actions: [{ type: 'log_result', parameters: {} }],
        status: 'active'
      };

      mockGetWorkflow.mockResolvedValue(mockWorkflow);
      mockGetWorkflowHistory.mockResolvedValue(mockLogs.slice(0, 1));

      const response = await request(app)
        .get(`/api/workflows/${workflowId}/logs?limit=${limit}`)
        .expect(200);

      expect(response.body).toEqual(mockLogs.slice(0, 1));
      expect(mockGetWorkflowHistory).toHaveBeenCalledWith(workflowId, limit);
    });

    it('should return 404 for non-existent workflow', async () => {
      const workflowId = 'non-existent';
      
      mockGetWorkflow.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/workflows/${workflowId}/logs`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Workflow not found'
      });
      expect(mockGetWorkflowHistory).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid limit parameter', async () => {
      const workflowId = 'workflow-1';

      const response = await request(app)
        .get(`/api/workflows/${workflowId}/logs?limit=invalid`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid limit parameter. Must be a positive integer.'
      });
    });

    it('should return 400 for negative limit parameter', async () => {
      const workflowId = 'workflow-1';

      const response = await request(app)
        .get(`/api/workflows/${workflowId}/logs?limit=-5`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid limit parameter. Must be a positive integer.'
      });
    });

    it('should handle service errors', async () => {
      const workflowId = 'workflow-1';
      const mockWorkflow: Workflow = {
        id: workflowId,
        name: 'Test Workflow',
        description: 'Test description',
        trigger: { type: 'cron', schedule: '0 8 * * *' },
        actions: [{ type: 'log_result', parameters: {} }],
        status: 'active'
      };

      mockGetWorkflow.mockResolvedValue(mockWorkflow);
      mockGetWorkflowHistory.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/workflows/${workflowId}/logs`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to fetch workflow logs',
        message: 'Database error'
      });
    });
  });
});