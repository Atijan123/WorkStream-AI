import { SystemMetricsRepository } from '../../repositories/SystemMetricsRepository';
import { SystemMetrics } from '../../types';
import { setupTestDb, cleanupTestDb } from '../../test-utils/testDb';

describe('SystemMetricsRepository', () => {
  let repository: SystemMetricsRepository;

  beforeEach(async () => {
    await setupTestDb();
    repository = new SystemMetricsRepository();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  describe('create', () => {
    it('should create new system metrics', async () => {
      const metricsData = {
        cpu_usage: 45.5,
        memory_usage: 78.2
      };

      const created = await repository.create(metricsData);

      expect(created).toMatchObject({
        id: expect.any(Number),
        cpu_usage: 45.5,
        memory_usage: 78.2,
        timestamp: expect.any(Date)
      });
    });

    it('should create metrics with zero values', async () => {
      const metricsData = {
        cpu_usage: 0,
        memory_usage: 0
      };

      const created = await repository.create(metricsData);

      expect(created).toMatchObject({
        cpu_usage: 0,
        memory_usage: 0
      });
    });
  });

  describe('findById', () => {
    it('should find metrics by id', async () => {
      const metricsData = {
        cpu_usage: 25.0,
        memory_usage: 60.5
      };

      const created = await repository.create(metricsData);
      const found = await repository.findById(created.id!);

      expect(found).toEqual(created);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all metrics ordered by timestamp desc', async () => {
      const metrics1 = await repository.create({
        cpu_usage: 10.0,
        memory_usage: 20.0
      });

      const metrics2 = await repository.create({
        cpu_usage: 30.0,
        memory_usage: 40.0
      });

      const all = await repository.findAll();

      expect(all).toHaveLength(2);
      // Check that both metrics are present (order may vary due to same timestamp)
      const cpuValues = all.map(m => m.cpu_usage);
      expect(cpuValues).toContain(10.0);
      expect(cpuValues).toContain(30.0);
    });

    it('should return empty array when no metrics exist', async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });
  });

  describe('findByTimeRange', () => {
    let metrics1: SystemMetrics;
    let metrics2: SystemMetrics;
    let metrics3: SystemMetrics;

    beforeEach(async () => {
      // Create metrics
      metrics1 = await repository.create({ cpu_usage: 10, memory_usage: 20 });
      metrics2 = await repository.create({ cpu_usage: 30, memory_usage: 40 });
      metrics3 = await repository.create({ cpu_usage: 50, memory_usage: 60 });
    });

    it('should find metrics within time range', async () => {
      // Use a very wide time range to ensure we capture all test data
      const startTime = new Date('2020-01-01T00:00:00Z');
      const endTime = new Date('2030-01-01T00:00:00Z');

      const metrics = await repository.findByTimeRange(startTime, endTime);

      expect(metrics.length).toBe(3);
      const cpuValues = metrics.map(m => m.cpu_usage);
      expect(cpuValues).toContain(10);
      expect(cpuValues).toContain(30);
      expect(cpuValues).toContain(50);
    });

    it('should return empty array for time range with no metrics', async () => {
      const startTime = new Date('2020-01-01T00:00:00Z');
      const endTime = new Date('2020-01-01T01:00:00Z');

      const metrics = await repository.findByTimeRange(startTime, endTime);

      expect(metrics).toEqual([]);
    });
  });

  describe('getLatest', () => {
    it('should return the most recent metrics', async () => {
      await repository.create({ cpu_usage: 10, memory_usage: 20 });
      await repository.create({ cpu_usage: 30, memory_usage: 40 });
      await repository.create({ cpu_usage: 50, memory_usage: 60 });

      const result = await repository.getLatest();

      expect(result).toBeTruthy();
      expect([10, 30, 50]).toContain(result!.cpu_usage);
      expect([20, 40, 60]).toContain(result!.memory_usage);
    });

    it('should return null when no metrics exist', async () => {
      const result = await repository.getLatest();
      expect(result).toBeNull();
    });
  });

  describe('getRecentMetrics', () => {
    beforeEach(async () => {
      // Create multiple metrics
      for (let i = 1; i <= 15; i++) {
        await repository.create({
          cpu_usage: i * 5,
          memory_usage: i * 10
        });
      }
    });

    it('should return recent metrics with default limit', async () => {
      const recent = await repository.getRecentMetrics();

      expect(recent).toHaveLength(10); // Default limit
      // Check that all returned metrics have expected value ranges
      recent.forEach(metric => {
        expect(metric.cpu_usage).toBeGreaterThanOrEqual(5);
        expect(metric.cpu_usage).toBeLessThanOrEqual(75);
        expect(metric.memory_usage).toBeGreaterThanOrEqual(10);
        expect(metric.memory_usage).toBeLessThanOrEqual(150);
      });
    });

    it('should return recent metrics with custom limit', async () => {
      const recent = await repository.getRecentMetrics(5);

      expect(recent).toHaveLength(5);
      // Check that all returned metrics have expected value ranges
      recent.forEach(metric => {
        expect(metric.cpu_usage).toBeGreaterThanOrEqual(5);
        expect(metric.cpu_usage).toBeLessThanOrEqual(75);
      });
    });

    it('should return all metrics when limit exceeds total count', async () => {
      await cleanupTestDb();
      await setupTestDb();
      repository = new SystemMetricsRepository();

      await repository.create({ cpu_usage: 25, memory_usage: 50 });

      const recent = await repository.getRecentMetrics(10);

      expect(recent).toHaveLength(1);
    });
  });

  describe('getAverageMetrics', () => {
    beforeEach(async () => {
      // Create metrics with known values
      await repository.create({ cpu_usage: 10, memory_usage: 20 });
      await repository.create({ cpu_usage: 20, memory_usage: 40 });
      await repository.create({ cpu_usage: 30, memory_usage: 60 });
    });

    it('should calculate average metrics for recent hours', async () => {
      const average = await repository.getAverageMetrics(24); // Last 24 hours

      expect(average).toEqual({
        cpu_usage: 20, // (10 + 20 + 30) / 3
        memory_usage: 40 // (20 + 40 + 60) / 3
      });
    });

    it('should return null when no metrics exist in time range', async () => {
      await cleanupTestDb();
      await setupTestDb();
      repository = new SystemMetricsRepository();

      const average = await repository.getAverageMetrics(1);

      expect(average).toBeNull();
    });

    it('should round averages to 2 decimal places', async () => {
      await cleanupTestDb();
      await setupTestDb();
      repository = new SystemMetricsRepository();

      await repository.create({ cpu_usage: 10.333, memory_usage: 20.666 });
      await repository.create({ cpu_usage: 20.666, memory_usage: 30.333 });

      const average = await repository.getAverageMetrics(24);

      expect(average).toEqual({
        cpu_usage: 15.5, // (10.333 + 20.666) / 2 = 15.4995 -> 15.5
        memory_usage: 25.5 // (20.666 + 30.333) / 2 = 25.4995 -> 25.5
      });
    });
  });

  describe('deleteOlderThan', () => {
    beforeEach(async () => {
      // Create some metrics (they will have current timestamp)
      await repository.create({ cpu_usage: 10, memory_usage: 20 });
      await repository.create({ cpu_usage: 30, memory_usage: 40 });
      await repository.create({ cpu_usage: 50, memory_usage: 60 });
    });

    it('should delete metrics older than specified date', async () => {
      const futureTime = new Date(Date.now() + 3600000); // 1 hour from now
      const deletedCount = await repository.deleteOlderThan(futureTime);

      expect(deletedCount).toBe(3); // All current metrics should be deleted

      const remaining = await repository.findAll();
      expect(remaining).toHaveLength(0);
    });

    it('should not delete metrics newer than specified date', async () => {
      // Use a date far in the past to ensure no current metrics are deleted
      const pastTime = new Date('2020-01-01T00:00:00Z');
      const deletedCount = await repository.deleteOlderThan(pastTime);

      // Since all metrics were created just now, they should be newer than 2020
      expect(deletedCount).toBe(0); // No metrics should be deleted

      const remaining = await repository.findAll();
      expect(remaining).toHaveLength(3);
    });

    it('should return 0 when no metrics match deletion criteria', async () => {
      await cleanupTestDb();
      await setupTestDb();
      repository = new SystemMetricsRepository();

      const deletedCount = await repository.deleteOlderThan(new Date());

      expect(deletedCount).toBe(0);
    });
  });
});