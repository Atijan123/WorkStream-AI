import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from '../../database/init';
import workflowRoutes from '../../routes/workflows';
import { setupTestDb, cleanupTestDb } from '../../test-utils/testDb';

describe('Workflow API Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Setup test database
    await setupTestDb();
    await initializeDatabase();

    // Setup Express app
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/workflows', workflowRoutes);
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe('GET /api/workflows', () => {
    it('should return empty array initially', async () => {
      const response = await request(app)
        .get('/api/workflows')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('POST /api/workflows', () => {
    it('should create a new workflow', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'A test workflow',
        trigger: { type: 'cron', schedule: '0 9 * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'test' } }]
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Test Workflow',
        description: 'A test workflow',
        trigger: { type: 'cron', schedule: '0 9 * * *' },
        actions: [{ type: 'log_result', parameters: { message: 'test' } }],
        status: 'active'
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for invalid workflow data', async () => {
      const invalidData = {
        name: 'Invalid Workflow'
        // missing required fields
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('GET /api/workflows/:id/logs', () => {
    let workflowId: string;

    beforeEach(async () => {
      // Create a test workflow
      const workflowData = {
        name: 'Log Test Workflow',
        description: 'A workflow for testing logs',
        trigger: { type: 'manual' },
        actions: [{ type: 'log_result', parameters: { message: 'test log' } }]
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData)
        .expect(201);

      workflowId = response.body.id;
    });

    it('should return empty logs for new workflow', async () => {
      const response = await request(app)
        .get(`/api/workflows/${workflowId}/logs`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 404 for non-existent workflow', async () => {
      const response = await request(app)
        .get('/api/workflows/non-existent-id/logs')
        .expect(404);

      expect(response.body.error).toBe('Workflow not found');
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get(`/api/workflows/${workflowId}/logs?limit=invalid`)
        .expect(400);

      expect(response.body.error).toBe('Invalid limit parameter. Must be a positive integer.');
    });
  });

  describe('Full workflow lifecycle', () => {
    it('should create workflow and retrieve it in list', async () => {
      // Create workflow
      const workflowData = {
        name: 'Lifecycle Test Workflow',
        description: 'Testing full lifecycle',
        trigger: { type: 'cron', schedule: '0 12 * * *' },
        actions: [
          { type: 'check_system_metrics', parameters: {} },
          { type: 'log_result', parameters: { message: 'lifecycle test' } }
        ]
      };

      const createResponse = await request(app)
        .post('/api/workflows')
        .send(workflowData)
        .expect(201);

      const workflowId = createResponse.body.id;

      // Retrieve all workflows
      const listResponse = await request(app)
        .get('/api/workflows')
        .expect(200);

      expect(listResponse.body.length).toBeGreaterThan(0);
      const createdWorkflow = listResponse.body.find((w: any) => w.id === workflowId);
      expect(createdWorkflow).toBeDefined();
      expect(createdWorkflow.name).toBe('Lifecycle Test Workflow');

      // Check logs (should be empty)
      const logsResponse = await request(app)
        .get(`/api/workflows/${workflowId}/logs`)
        .expect(200);

      expect(logsResponse.body).toEqual([]);
    });
  });
});