import request from 'supertest';
import express from 'express';
import { setupTestDb, cleanupTestDb } from '../../test-utils/testDb';
import featureRoutes from '../../routes/features';
import dashboardRoutes from '../../routes/dashboard';
import { FeatureRequestRepository } from '../../repositories/FeatureRequestRepository';
import { SystemMetricsRepository } from '../../repositories/SystemMetricsRepository';

describe('Features API Integration Tests', () => {
  let app: express.Application;
  let featureRequestRepo: FeatureRequestRepository;
  let systemMetricsRepo: SystemMetricsRepository;

  beforeAll(async () => {
    await setupTestDb();
    
    app = express();
    app.use(express.json());
    app.use('/api/features', featureRoutes);
    app.use('/api/dashboard', dashboardRoutes);

    featureRequestRepo = new FeatureRequestRepository();
    systemMetricsRepo = new SystemMetricsRepository();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(async () => {
    // Clean up data before each test
    const allRequests = await featureRequestRepo.findAll();
    for (const request of allRequests) {
      await featureRequestRepo.delete(request.id);
    }

    // Clean up old metrics by deleting all older than now
    await systemMetricsRepo.deleteOlderThan(new Date());
  });

  describe('Feature Request Flow', () => {
    it('should create and retrieve feature requests', async () => {
      // Create a feature request
      const createResponse = await request(app)
        .post('/api/features/request')
        .send({ description: 'Add dark mode toggle' });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.description).toBe('Add dark mode toggle');
      expect(createResponse.body.status).toBe('pending');
      expect(createResponse.body.id).toBeDefined();

      const requestId = createResponse.body.id;

      // Retrieve all requests
      const getAllResponse = await request(app)
        .get('/api/features/requests');

      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.body).toHaveLength(1);
      expect(getAllResponse.body[0].id).toBe(requestId);
      expect(getAllResponse.body[0].description).toBe('Add dark mode toggle');
    });

    it('should filter requests by status', async () => {
      // Create multiple requests with different statuses
      await request(app)
        .post('/api/features/request')
        .send({ description: 'Pending request' });

      // Manually create a completed request
      await featureRequestRepo.create({
        description: 'Completed request',
        status: 'completed',
        generatedComponents: ['Component.tsx']
      });

      // Get all requests
      const allResponse = await request(app)
        .get('/api/features/requests');
      expect(allResponse.body).toHaveLength(2);

      // Filter by pending status
      const pendingResponse = await request(app)
        .get('/api/features/requests?status=pending');
      expect(pendingResponse.status).toBe(200);
      expect(pendingResponse.body).toHaveLength(1);
      expect(pendingResponse.body[0].status).toBe('pending');

      // Filter by completed status
      const completedResponse = await request(app)
        .get('/api/features/requests?status=completed');
      expect(completedResponse.status).toBe(200);
      expect(completedResponse.body).toHaveLength(1);
      expect(completedResponse.body[0].status).toBe('completed');
    });

    it('should limit results correctly', async () => {
      // Create multiple requests
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/features/request')
          .send({ description: `Request ${i}` });
      }

      // Get limited results
      const limitedResponse = await request(app)
        .get('/api/features/requests?limit=3');

      expect(limitedResponse.status).toBe(200);
      expect(limitedResponse.body).toHaveLength(3);
    });

    it('should handle dashboard data aggregation', async () => {
      // Create feature requests with different statuses
      await request(app)
        .post('/api/features/request')
        .send({ description: 'Pending request 1' });

      await request(app)
        .post('/api/features/request')
        .send({ description: 'Pending request 2' });

      await featureRequestRepo.create({
        description: 'Completed request',
        status: 'completed'
      });

      await featureRequestRepo.create({
        description: 'Failed request',
        status: 'failed'
      });

      // Add some system metrics
      await systemMetricsRepo.create({
        cpu_usage: 45.2,
        memory_usage: 68.7
      });

      await systemMetricsRepo.create({
        cpu_usage: 38.9,
        memory_usage: 62.1
      });

      // Get dashboard data
      const dashboardResponse = await request(app)
        .get('/api/dashboard/data');

      expect(dashboardResponse.status).toBe(200);
      
      const data = dashboardResponse.body;
      expect(data.featureRequestStats.total).toBe(4);
      expect(data.featureRequestStats.pending).toBe(2);
      expect(data.featureRequestStats.completed).toBe(1);
      expect(data.featureRequestStats.failed).toBe(1);
      expect(data.featureRequestStats.processing).toBe(0);

      expect(data.recentFeatureRequests).toHaveLength(4);
      expect(data.systemMetrics.latest).toBeDefined();
      expect(data.systemMetrics.latest.cpu_usage).toBe(45.2);
      expect(data.systemMetrics.recentHistory).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid feature request data', async () => {
      const response = await request(app)
        .post('/api/features/request')
        .send({ description: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Description is required and must be a non-empty string');
    });

    it('should handle invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/features/requests?status=invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid status parameter');
    });

    it('should handle invalid limit parameters', async () => {
      const response = await request(app)
        .get('/api/features/requests?limit=0');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid limit parameter. Must be a positive integer between 1 and 100.');
    });
  });

  describe('Data Persistence', () => {
    it('should persist feature requests correctly', async () => {
      const description = 'Persistent feature request';
      
      // Create request
      const createResponse = await request(app)
        .post('/api/features/request')
        .send({ description });

      const requestId = createResponse.body.id;

      // Verify it exists in database
      const savedRequest = await featureRequestRepo.findById(requestId);
      expect(savedRequest).toBeDefined();
      expect(savedRequest!.description).toBe(description);
      expect(savedRequest!.status).toBe('pending');
    });

    it('should maintain request order by timestamp', async () => {
      // Create requests with slight delays to ensure different timestamps
      await request(app)
        .post('/api/features/request')
        .send({ description: 'First request' });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post('/api/features/request')
        .send({ description: 'Second request' });

      const response = await request(app)
        .get('/api/features/requests');

      expect(response.body).toHaveLength(2);
      // Should be ordered by timestamp DESC (newest first)
      expect(response.body[0].description).toBe('Second request');
      expect(response.body[1].description).toBe('First request');
    });
  });
});