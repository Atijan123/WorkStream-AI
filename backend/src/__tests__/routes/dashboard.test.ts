import request from 'supertest';
import express from 'express';
import dashboardRoutes from '../../routes/dashboard';
import { DashboardData } from '../../services/DashboardService';
import { FeatureRequest, SystemMetrics } from '../../types';

// Mock the service
jest.mock('../../services/DashboardService', () => {
  return {
    DashboardService: jest.fn().mockImplementation(() => ({
      getDashboardData: jest.fn()
    }))
  };
});

describe('Dashboard Routes', () => {
  let app: express.Application;
  let mockGetDashboardData: jest.Mock;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/dashboard', dashboardRoutes);

    // Get mock instance
    const { DashboardService } = require('../../services/DashboardService');
    const dashboardInstance = new DashboardService();
    mockGetDashboardData = dashboardInstance.getDashboardData;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/data', () => {
    const mockDashboardData: DashboardData = {
      recentFeatureRequests: [
        {
          id: 'req-1',
          description: 'Add user authentication',
          status: 'completed',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          generatedComponents: ['LoginForm.tsx', 'AuthService.ts']
        },
        {
          id: 'req-2',
          description: 'Create dashboard widgets',
          status: 'pending',
          timestamp: new Date('2024-01-02T00:00:00Z')
        }
      ],
      featureRequestStats: {
        total: 10,
        pending: 3,
        processing: 2,
        completed: 4,
        failed: 1
      },
      systemMetrics: {
        latest: {
          id: 1,
          cpu_usage: 45.2,
          memory_usage: 68.7,
          timestamp: new Date('2024-01-02T12:00:00Z')
        },
        averageLast24Hours: {
          cpu_usage: 42.1,
          memory_usage: 65.3
        },
        recentHistory: [
          {
            id: 1,
            cpu_usage: 45.2,
            memory_usage: 68.7,
            timestamp: new Date('2024-01-02T12:00:00Z')
          },
          {
            id: 2,
            cpu_usage: 38.9,
            memory_usage: 62.1,
            timestamp: new Date('2024-01-02T11:00:00Z')
          }
        ]
      }
    };

    it('should return dashboard data successfully', async () => {
      mockGetDashboardData.mockResolvedValue(mockDashboardData);

      const response = await request(app)
        .get('/api/dashboard/data');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        recentFeatureRequests: [
          {
            ...mockDashboardData.recentFeatureRequests[0],
            timestamp: mockDashboardData.recentFeatureRequests[0].timestamp.toISOString()
          },
          {
            ...mockDashboardData.recentFeatureRequests[1],
            timestamp: mockDashboardData.recentFeatureRequests[1].timestamp.toISOString()
          }
        ],
        featureRequestStats: mockDashboardData.featureRequestStats,
        systemMetrics: {
          latest: {
            ...mockDashboardData.systemMetrics.latest,
            timestamp: mockDashboardData.systemMetrics.latest!.timestamp.toISOString()
          },
          averageLast24Hours: mockDashboardData.systemMetrics.averageLast24Hours,
          recentHistory: [
            {
              ...mockDashboardData.systemMetrics.recentHistory[0],
              timestamp: mockDashboardData.systemMetrics.recentHistory[0].timestamp.toISOString()
            },
            {
              ...mockDashboardData.systemMetrics.recentHistory[1],
              timestamp: mockDashboardData.systemMetrics.recentHistory[1].timestamp.toISOString()
            }
          ]
        }
      });
      expect(mockGetDashboardData).toHaveBeenCalled();
    });

    it('should handle empty dashboard data', async () => {
      const emptyDashboardData: DashboardData = {
        recentFeatureRequests: [],
        featureRequestStats: {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0
        },
        systemMetrics: {
          latest: null,
          averageLast24Hours: null,
          recentHistory: []
        }
      };

      mockGetDashboardData.mockResolvedValue(emptyDashboardData);

      const response = await request(app)
        .get('/api/dashboard/data');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(emptyDashboardData);
      expect(mockGetDashboardData).toHaveBeenCalled();
    });

    it('should return 500 if service throws an error', async () => {
      mockGetDashboardData.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/dashboard/data');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch dashboard data');
      expect(response.body.message).toBe('Database connection failed');
    });

    it('should handle service throwing non-Error object', async () => {
      mockGetDashboardData.mockRejectedValue('String error');

      const response = await request(app)
        .get('/api/dashboard/data');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch dashboard data');
      expect(response.body.message).toBe('Unknown error');
    });
  });
});