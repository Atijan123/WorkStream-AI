import { EvolveUIHook } from '../../hooks/evolve-ui';
import { SpecManager } from '../../services/SpecManager';
import { ComponentGenerator } from '../../services/ComponentGenerator';
import { FeatureRequestRepository } from '../../repositories/FeatureRequestRepository';
import { HookContext } from '../../hooks';

// Mock dependencies
jest.mock('../../services/SpecManager');
jest.mock('../../services/ComponentGenerator');
jest.mock('../../repositories/FeatureRequestRepository');

describe('EvolveUIHook', () => {
  let hook: EvolveUIHook;
  let mockSpecManager: jest.Mocked<SpecManager>;
  let mockComponentGenerator: jest.Mocked<ComponentGenerator>;
  let mockFeatureRequestRepo: jest.Mocked<FeatureRequestRepository>;

  beforeEach(() => {
    mockSpecManager = new SpecManager() as jest.Mocked<SpecManager>;
    mockComponentGenerator = new ComponentGenerator() as jest.Mocked<ComponentGenerator>;
    mockFeatureRequestRepo = new FeatureRequestRepository() as jest.Mocked<FeatureRequestRepository>;

    hook = new EvolveUIHook(mockSpecManager, mockComponentGenerator, mockFeatureRequestRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockContext: HookContext = {
      request: 'Create a blue chart showing sales data',
      userId: 'test-user',
      timestamp: new Date('2023-01-01T00:00:00Z')
    };

    it('should successfully process a feature request', async () => {
      // Arrange
      const mockGeneratedComponents = [
        { name: 'SalesChart', filePath: 'frontend/src/components/generated/SalesChart.tsx', content: 'mock content' }
      ];
      
      const mockFeatureRequest = { id: 'test-id', description: 'test', status: 'processing' as const, timestamp: new Date() };
      mockFeatureRequestRepo.create.mockResolvedValue(mockFeatureRequest);
      mockSpecManager.addFeature.mockResolvedValue(['Added feature: sales_chart']);
      mockComponentGenerator.generateComponents.mockResolvedValue(mockGeneratedComponents);
      mockFeatureRequestRepo.update.mockResolvedValue({ ...mockFeatureRequest, status: 'completed' });

      // Act
      const result = await hook.execute(mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully generated 1 components');
      expect(result.changes).toEqual(['Added feature: sales_chart']);
      expect(result.generatedFiles).toEqual(['frontend/src/components/generated/SalesChart.tsx']);

      expect(mockFeatureRequestRepo.create).toHaveBeenCalledWith({
        description: mockContext.request,
        status: 'processing'
      });

      expect(mockFeatureRequestRepo.update).toHaveBeenCalledWith(
        expect.any(String),
        {
          status: 'completed',
          generatedFiles: ['frontend/src/components/generated/SalesChart.tsx']
        }
      );
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockFeatureRequestRepo.create.mockRejectedValue(error);

      // Act
      const result = await hook.execute(mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to process UI evolution request');
    });

    it('should parse chart requests correctly', async () => {
      // Arrange
      const chartContext: HookContext = {
        request: 'Create a red chart called "Revenue Chart" showing data from revenue_db',
        userId: 'test-user',
        timestamp: new Date()
      };

      const mockFeatureRequest = { id: 'test-id', description: 'test', status: 'processing' as const, timestamp: new Date() };
      mockFeatureRequestRepo.create.mockResolvedValue(mockFeatureRequest);
      mockSpecManager.addFeature.mockResolvedValue(['Added feature: revenue-chart_chart']);
      mockComponentGenerator.generateComponents.mockResolvedValue([]);
      mockFeatureRequestRepo.update.mockResolvedValue({ ...mockFeatureRequest, status: 'completed' });

      // Act
      await hook.execute(chartContext);

      // Assert
      expect(mockSpecManager.addFeature).toHaveBeenCalledWith({
        name: 'revenue-chart',
        componentType: 'chart',
        description: chartContext.request,
        props: {
          title: 'Revenue Chart',
          dataSource: 'revenue_db'
        },
        styling: {
          primaryColor: 'red'
        }
      });
    });

    it('should parse table requests correctly', async () => {
      // Arrange
      const tableContext: HookContext = {
        request: 'Create a large table showing user data',
        userId: 'test-user',
        timestamp: new Date()
      };

      const mockFeatureRequest = { id: 'test-id', description: 'test', status: 'processing' as const, timestamp: new Date() };
      mockFeatureRequestRepo.create.mockResolvedValue(mockFeatureRequest);
      mockSpecManager.addFeature.mockResolvedValue(['Added feature: custom-table_table']);
      mockComponentGenerator.generateComponents.mockResolvedValue([]);
      mockFeatureRequestRepo.update.mockResolvedValue({ ...mockFeatureRequest, status: 'completed' });

      // Act
      await hook.execute(tableContext);

      // Assert
      expect(mockSpecManager.addFeature).toHaveBeenCalledWith({
        name: 'custom-table',
        componentType: 'table',
        description: tableContext.request,
        props: {},
        styling: {
          size: 'large'
        }
      });
    });

    it('should parse form requests correctly', async () => {
      // Arrange
      const formContext: HookContext = {
        request: 'Create a form called "User Registration"',
        userId: 'test-user',
        timestamp: new Date()
      };

      const mockFeatureRequest = { id: 'test-id', description: 'test', status: 'processing' as const, timestamp: new Date() };
      mockFeatureRequestRepo.create.mockResolvedValue(mockFeatureRequest);
      mockSpecManager.addFeature.mockResolvedValue(['Added feature: user-registration_form']);
      mockComponentGenerator.generateComponents.mockResolvedValue([]);
      mockFeatureRequestRepo.update.mockResolvedValue({ ...mockFeatureRequest, status: 'completed' });

      // Act
      await hook.execute(formContext);

      // Assert
      expect(mockSpecManager.addFeature).toHaveBeenCalledWith({
        name: 'user-registration',
        componentType: 'form',
        description: formContext.request,
        props: {
          title: 'User Registration'
        },
        styling: {}
      });
    });
  });
});