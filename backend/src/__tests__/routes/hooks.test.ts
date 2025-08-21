import request from 'supertest';
import express from 'express';
import hookRoutes from '../../routes/hooks';
import { HookRegistry } from '../../services/HookRegistry';

// Mock the HookRegistry
jest.mock('../../services/HookRegistry');
jest.mock('../../database/connection');

const MockHookRegistry = HookRegistry as jest.MockedClass<typeof HookRegistry>;

describe('Hook Routes', () => {
  let app: express.Application;
  let mockHookRegistry: jest.Mocked<HookRegistry>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/hooks', hookRoutes);

    mockHookRegistry = {
      listHooks: jest.fn(),
      executeHook: jest.fn(),
    } as any;

    MockHookRegistry.mockImplementation(() => mockHookRegistry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/hooks', () => {
    it('should return list of available hooks', async () => {
      // Arrange
      const mockHooks = [
        { name: 'evolve_ui', description: 'Evolves UI components' },
        { name: 'automate_workflow', description: 'Automates workflows' }
      ];
      mockHookRegistry.listHooks.mockReturnValue(mockHooks);

      // Act
      const response = await request(app).get('/api/hooks');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ hooks: mockHooks });
      expect(mockHookRegistry.listHooks).toHaveBeenCalled();
    });

    it('should handle errors when listing hooks', async () => {
      // Arrange
      mockHookRegistry.listHooks.mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act
      const response = await request(app).get('/api/hooks');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to list hooks' });
    });
  });

  describe('POST /api/hooks/:hookName/execute', () => {
    it('should execute hook successfully', async () => {
      // Arrange
      const mockResult = {
        success: true,
        message: 'Hook executed successfully',
        changes: ['Added feature: test-feature'],
        generatedFiles: ['test.tsx']
      };
      mockHookRegistry.executeHook.mockResolvedValue(mockResult);

      const requestBody = {
        request: 'Create a test component',
        userId: 'test-user'
      };

      // Act
      const response = await request(app)
        .post('/api/hooks/evolve_ui/execute')
        .send(requestBody);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(mockHookRegistry.executeHook).toHaveBeenCalledWith('evolve_ui', {
        request: requestBody.request,
        userId: requestBody.userId,
        timestamp: expect.any(Date)
      });
    });

    it('should return 400 when request content is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/hooks/evolve_ui/execute')
        .send({ userId: 'test-user' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Request content is required' });
      expect(mockHookRegistry.executeHook).not.toHaveBeenCalled();
    });

    it('should return 400 when hook execution fails', async () => {
      // Arrange
      const mockResult = {
        success: false,
        message: 'Hook execution failed'
      };
      mockHookRegistry.executeHook.mockResolvedValue(mockResult);

      const requestBody = {
        request: 'Create a test component',
        userId: 'test-user'
      };

      // Act
      const response = await request(app)
        .post('/api/hooks/evolve_ui/execute')
        .send(requestBody);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual(mockResult);
    });

    it('should handle server errors', async () => {
      // Arrange
      mockHookRegistry.executeHook.mockRejectedValue(new Error('Server error'));

      const requestBody = {
        request: 'Create a test component',
        userId: 'test-user'
      };

      // Act
      const response = await request(app)
        .post('/api/hooks/evolve_ui/execute')
        .send(requestBody);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to execute hook' });
    });
  });

  describe('POST /api/hooks/evolve-ui', () => {
    it('should execute evolve_ui hook via convenience endpoint', async () => {
      // Arrange
      const mockResult = {
        success: true,
        message: 'UI evolved successfully',
        generatedFiles: ['NewComponent.tsx']
      };
      mockHookRegistry.executeHook.mockResolvedValue(mockResult);

      const requestBody = {
        request: 'Create a dashboard widget',
        userId: 'test-user'
      };

      // Act
      const response = await request(app)
        .post('/api/hooks/evolve-ui')
        .send(requestBody);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(mockHookRegistry.executeHook).toHaveBeenCalledWith('evolve_ui', {
        request: requestBody.request,
        userId: requestBody.userId,
        timestamp: expect.any(Date)
      });
    });

    it('should return 400 when feature request is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/hooks/evolve-ui')
        .send({ userId: 'test-user' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Feature request is required' });
      expect(mockHookRegistry.executeHook).not.toHaveBeenCalled();
    });

    it('should handle evolve_ui hook failures', async () => {
      // Arrange
      const mockResult = {
        success: false,
        message: 'Failed to generate component'
      };
      mockHookRegistry.executeHook.mockResolvedValue(mockResult);

      const requestBody = {
        request: 'Create an invalid component'
      };

      // Act
      const response = await request(app)
        .post('/api/hooks/evolve-ui')
        .send(requestBody);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual(mockResult);
    });
  });
});