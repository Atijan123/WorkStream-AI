import { DashboardService } from '../../services/DashboardService';
import { setupTestDb, cleanupTestDb } from '../../test-utils/testDb';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    await setupTestDb();
    service = new DashboardService();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  describe('getDashboardData', () => {
    it('should return dashboard data with empty stats when no data exists', async () => {
      const data = await service.getDashboardData();

      expect(data).toEqual({
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
      });
    });

    it('should return dashboard data with populated stats', async () => {
      // Create some test data
      await service.submitFeatureRequest('Add dark mode');
      await service.submitFeatureRequest('Add user profiles');
      await service.recordSystemMetrics(45.5, 78.2);
      await service.recordSystemMetrics(50.0, 80.0);

      const data = await service.getDashboardData();

      expect(data.recentFeatureRequests).toHaveLength(2);
      expect(data.featureRequestStats).toEqual({
        total: 2,
        pending: 2,
        processing: 0,
        completed: 0,
        failed: 0
      });
      expect(data.systemMetrics.latest).toBeTruthy();
      expect(data.systemMetrics.averageLast24Hours).toEqual({
        cpu_usage: 47.75, // (45.5 + 50.0) / 2
        memory_usage: 79.1  // (78.2 + 80.0) / 2
      });
      expect(data.systemMetrics.recentHistory).toHaveLength(2);
    });
  });

  describe('recordSystemMetrics', () => {
    it('should record system metrics', async () => {
      const metrics = await service.recordSystemMetrics(25.5, 60.0);

      expect(metrics).toMatchObject({
        id: expect.any(Number),
        cpu_usage: 25.5,
        memory_usage: 60.0,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('submitFeatureRequest', () => {
    it('should submit a feature request', async () => {
      const request = await service.submitFeatureRequest('Add search functionality');

      expect(request).toMatchObject({
        id: expect.any(String),
        description: 'Add search functionality',
        status: 'pending',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('updateFeatureRequestStatus', () => {
    it('should update feature request status', async () => {
      const request = await service.submitFeatureRequest('Add notifications');
      
      const updated = await service.updateFeatureRequestStatus(
        request.id, 
        'completed',
        ['NotificationComponent.tsx', 'NotificationService.ts']
      );

      expect(updated).toMatchObject({
        id: request.id,
        status: 'completed',
        generatedComponents: ['NotificationComponent.tsx', 'NotificationService.ts']
      });
    });

    it('should return null for non-existent request', async () => {
      const updated = await service.updateFeatureRequestStatus(
        'non-existent-id',
        'completed'
      );

      expect(updated).toBeNull();
    });
  });

  describe('cleanupOldMetrics', () => {
    beforeEach(async () => {
      // Create some metrics
      await service.recordSystemMetrics(10, 20);
      await service.recordSystemMetrics(30, 40);
      await service.recordSystemMetrics(50, 60);
    });

    it('should cleanup old metrics', async () => {
      // Clean up metrics older than 0 days (should delete all current metrics)
      const deletedCount = await service.cleanupOldMetrics(0);

      expect(deletedCount).toBe(3);
    });

    it('should not cleanup recent metrics', async () => {
      // Clean up metrics older than 30 days (should not delete any current metrics)
      const deletedCount = await service.cleanupOldMetrics(30);

      expect(deletedCount).toBe(0);
    });

    it('should use default cleanup period', async () => {
      // Test default cleanup (30 days) - should not delete current metrics
      const deletedCount = await service.cleanupOldMetrics();

      expect(deletedCount).toBe(0);
    });
  });
});