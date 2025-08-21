import request from 'supertest';
import express from 'express';
import featureRoutes from '../../routes/features';
import { FeatureRequest } from '../../types';

// Mock the services
jest.mock('../../services/DashboardService', () => {
  return {
    DashboardService: jest.fn().mockImplementation(() => ({
      submitFeatureRequest: jest.fn()
    }))
  };
});

jest.mock('../../repositories/FeatureRequestRepository', () => {
  return {
    FeatureRequestRepository: jest.fn().mockImplementation(() => ({
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      getRecentRequests: jest.fn()
    }))
  };
});

describe('Feature Routes', () => {
  let app: express.Application;
  let mockSubmitFeatureRequest: jest.Mock;
  let mockFindAll: jest.Mock;
  let mockFindByStatus: jest.Mock;
  let mockGetRecentRequests: jest.Mock;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/features', featureRoutes);

    // Get mock instances
    const { DashboardService } = require('../../services/DashboardService');
    const { FeatureRequestRepository } = require('../../repositories/FeatureRequestRepository');
    
    const dashboardInstance = new DashboardService();
    const repoInstance = new FeatureRequestRepository();
    
    mockSubmitFeatureRequest = dashboardInstance.submitFeatureRequest;
    mockFindAll = repoInstance.findAll;
    mockFindByStatus = repoInstance.findByStatus;
    mockGetRecentRequests = repoInstance.getRecentRequests;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('POST /api/features/request', () => {
    const mockFeatureRequest: FeatureRequest = {
      id: 'test-id',
      description: 'Test feature request',
      status: 'pending',
      timestamp: new Date('2024-01-01T00:00:00Z')
    };

    it('should create a new feature request successfully', async () => {
      mockSubmitFeatureRequest.mockResolvedValue(mockFeatureRequest);

      const response = await request(app)
        .post('/api/features/request')
        .send({ description: 'Test feature request' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        ...mockFeatureRequest,
        timestamp: mockFeatureRequest.timestamp.toISOString()
      });
      expect(mockSubmitFeatureRequest).toHaveBeenCalledWith('Test feature request');
    });

    it('should return 400 if description is missing', async () => {
      const response = await request(app)
        .post('/api/features/request')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Description is required and must be a non-empty string');
      expect(mockSubmitFeatureRequest).not.toHaveBeenCalled();
    });

    it('should return 400 if description is empty string', async () => {
      const response = await request(app)
        .post('/api/features/request')
        .send({ description: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Description is required and must be a non-empty string');
      expect(mockSubmitFeatureRequest).not.toHaveBeenCalled();
    });

    it('should return 400 if description is not a string', async () => {
      const response = await request(app)
        .post('/api/features/request')
        .send({ description: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Description is required and must be a non-empty string');
      expect(mockSubmitFeatureRequest).not.toHaveBeenCalled();
    });

    it('should return 400 if description is too long', async () => {
      const longDescription = 'a'.repeat(2001);
      
      const response = await request(app)
        .post('/api/features/request')
        .send({ description: longDescription });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Description must be less than 2000 characters');
      expect(mockSubmitFeatureRequest).not.toHaveBeenCalled();
    });

    it('should trim whitespace from description', async () => {
      mockSubmitFeatureRequest.mockResolvedValue(mockFeatureRequest);

      const response = await request(app)
        .post('/api/features/request')
        .send({ description: '  Test feature request  ' });

      expect(response.status).toBe(201);
      expect(mockSubmitFeatureRequest).toHaveBeenCalledWith('Test feature request');
    });

    it('should return 500 if service throws an error', async () => {
      mockSubmitFeatureRequest.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/features/request')
        .send({ description: 'Test feature request' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to submit feature request');
      expect(response.body.message).toBe('Database error');
    });
  });

  describe('GET /api/features/requests', () => {
    const mockRequests: FeatureRequest[] = [
      {
        id: 'req-1',
        description: 'First request',
        status: 'completed',
        timestamp: new Date('2024-01-01T00:00:00Z')
      },
      {
        id: 'req-2',
        description: 'Second request',
        status: 'pending',
        timestamp: new Date('2024-01-02T00:00:00Z')
      }
    ];

    it('should return all feature requests when no filters are provided', async () => {
      mockFindAll.mockResolvedValue(mockRequests);

      const response = await request(app)
        .get('/api/features/requests');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(mockFindAll).toHaveBeenCalled();
    });

    it('should filter by status when status parameter is provided', async () => {
      const pendingRequests = mockRequests.filter(req => req.status === 'pending');
      mockFindByStatus.mockResolvedValue(pendingRequests);

      const response = await request(app)
        .get('/api/features/requests?status=pending');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('pending');
      expect(mockFindByStatus).toHaveBeenCalledWith('pending');
    });

    it('should limit results when limit parameter is provided', async () => {
      mockGetRecentRequests.mockResolvedValue([mockRequests[0]]);

      const response = await request(app)
        .get('/api/features/requests?limit=1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(mockGetRecentRequests).toHaveBeenCalledWith(1);
    });

    it('should apply limit to status-filtered results', async () => {
      mockFindByStatus.mockResolvedValue(mockRequests);

      const response = await request(app)
        .get('/api/features/requests?status=pending&limit=1');

      expect(response.status).toBe(200);
      expect(mockFindByStatus).toHaveBeenCalledWith('pending');
    });

    it('should return 400 for invalid status parameter', async () => {
      const response = await request(app)
        .get('/api/features/requests?status=invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid status parameter');
      expect(response.body.validStatuses).toEqual(['pending', 'processing', 'completed', 'failed']);
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await request(app)
        .get('/api/features/requests?limit=invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid limit parameter. Must be a positive integer between 1 and 100.');
    });

    it('should return 400 for limit parameter less than 1', async () => {
      const response = await request(app)
        .get('/api/features/requests?limit=0');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid limit parameter. Must be a positive integer between 1 and 100.');
    });

    it('should return 400 for limit parameter greater than 100', async () => {
      const response = await request(app)
        .get('/api/features/requests?limit=101');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid limit parameter. Must be a positive integer between 1 and 100.');
    });

    it('should return 500 if repository throws an error', async () => {
      mockFindAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/features/requests');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch feature requests');
      expect(response.body.message).toBe('Database error');
    });
  });
});