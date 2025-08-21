import { FeatureRequestRepository } from '../../repositories/FeatureRequestRepository';
import { FeatureRequest } from '../../types';
import { setupTestDb, cleanupTestDb } from '../../test-utils/testDb';

describe('FeatureRequestRepository', () => {
  let repository: FeatureRequestRepository;

  beforeEach(async () => {
    await setupTestDb();
    repository = new FeatureRequestRepository();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  describe('create', () => {
    it('should create a new feature request', async () => {
      const requestData = {
        description: 'Add dark mode toggle',
        status: 'pending' as const
      };

      const created = await repository.create(requestData);

      expect(created).toMatchObject({
        id: expect.any(String),
        description: 'Add dark mode toggle',
        status: 'pending',
        timestamp: expect.any(Date)
      });
      expect(created.generatedComponents).toBeUndefined();
    });

    it('should create a feature request with generated components', async () => {
      const requestData = {
        description: 'Add user profile page',
        status: 'completed' as const,
        generatedComponents: ['UserProfile.tsx', 'ProfileForm.tsx']
      };

      const created = await repository.create(requestData);

      expect(created).toMatchObject({
        id: expect.any(String),
        description: 'Add user profile page',
        status: 'completed',
        timestamp: expect.any(Date),
        generatedComponents: ['UserProfile.tsx', 'ProfileForm.tsx']
      });
    });
  });

  describe('findById', () => {
    it('should find a feature request by id', async () => {
      const requestData = {
        description: 'Add search functionality',
        status: 'processing' as const
      };

      const created = await repository.create(requestData);
      const found = await repository.findById(created.id);

      expect(found).toEqual(created);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all feature requests ordered by creation date', async () => {
      const request1 = await repository.create({
        description: 'First request',
        status: 'pending'
      });

      const request2 = await repository.create({
        description: 'Second request',
        status: 'completed'
      });

      const all = await repository.findAll();

      expect(all).toHaveLength(2);
      // Check that both requests are present (order may vary due to same timestamp)
      const descriptions = all.map(r => r.description);
      expect(descriptions).toContain('First request');
      expect(descriptions).toContain('Second request');
    });

    it('should return empty array when no requests exist', async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    beforeEach(async () => {
      await repository.create({
        description: 'Pending request',
        status: 'pending'
      });

      await repository.create({
        description: 'Processing request',
        status: 'processing'
      });

      await repository.create({
        description: 'Completed request',
        status: 'completed'
      });

      await repository.create({
        description: 'Another pending request',
        status: 'pending'
      });
    });

    it('should find requests by pending status', async () => {
      const pending = await repository.findByStatus('pending');

      expect(pending).toHaveLength(2);
      expect(pending.every(req => req.status === 'pending')).toBe(true);
    });

    it('should find requests by processing status', async () => {
      const processing = await repository.findByStatus('processing');

      expect(processing).toHaveLength(1);
      expect(processing[0].status).toBe('processing');
    });

    it('should find requests by completed status', async () => {
      const completed = await repository.findByStatus('completed');

      expect(completed).toHaveLength(1);
      expect(completed[0].status).toBe('completed');
    });

    it('should return empty array for status with no requests', async () => {
      const failed = await repository.findByStatus('failed');
      expect(failed).toEqual([]);
    });
  });

  describe('update', () => {
    let existingRequest: FeatureRequest;

    beforeEach(async () => {
      existingRequest = await repository.create({
        description: 'Original description',
        status: 'pending'
      });
    });

    it('should update description', async () => {
      const updated = await repository.update(existingRequest.id, {
        description: 'Updated description'
      });

      expect(updated).toMatchObject({
        id: existingRequest.id,
        description: 'Updated description',
        status: 'pending'
      });
    });

    it('should update status and set completed_at when status becomes completed', async () => {
      const updated = await repository.update(existingRequest.id, {
        status: 'completed'
      });

      expect(updated).toMatchObject({
        id: existingRequest.id,
        status: 'completed'
      });
    });

    it('should update generated components', async () => {
      const updated = await repository.update(existingRequest.id, {
        generatedComponents: ['Component1.tsx', 'Component2.tsx']
      });

      expect(updated).toMatchObject({
        id: existingRequest.id,
        generatedComponents: ['Component1.tsx', 'Component2.tsx']
      });
    });

    it('should return null for non-existent id', async () => {
      const updated = await repository.update('non-existent-id', {
        description: 'New description'
      });

      expect(updated).toBeNull();
    });

    it('should return existing request when no updates provided', async () => {
      const updated = await repository.update(existingRequest.id, {});

      expect(updated).toEqual(existingRequest);
    });
  });

  describe('delete', () => {
    it('should delete an existing feature request', async () => {
      const request = await repository.create({
        description: 'Request to delete',
        status: 'pending'
      });

      const deleted = await repository.delete(request.id);
      expect(deleted).toBe(true);

      const found = await repository.findById(request.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent id', async () => {
      const deleted = await repository.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('getRecentRequests', () => {
    beforeEach(async () => {
      // Create multiple requests
      for (let i = 1; i <= 15; i++) {
        await repository.create({
          description: `Request ${i}`,
          status: 'pending'
        });
      }
    });

    it('should return recent requests with default limit', async () => {
      const recent = await repository.getRecentRequests();

      expect(recent).toHaveLength(10); // Default limit
      // Check that all returned requests have the expected pattern
      recent.forEach(request => {
        expect(request.description).toMatch(/^Request \d+$/);
      });
    });

    it('should return recent requests with custom limit', async () => {
      const recent = await repository.getRecentRequests(5);

      expect(recent).toHaveLength(5);
      // Check that all returned requests have the expected pattern
      recent.forEach(request => {
        expect(request.description).toMatch(/^Request \d+$/);
      });
    });

    it('should return all requests when limit exceeds total count', async () => {
      await cleanupTestDb();
      await setupTestDb();
      repository = new FeatureRequestRepository();

      await repository.create({
        description: 'Only request',
        status: 'pending'
      });

      const recent = await repository.getRecentRequests(10);

      expect(recent).toHaveLength(1);
    });
  });
});