import { SpecManager } from '../../services/SpecManager';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';

// Mock fs and yaml modules
jest.mock('fs/promises');
jest.mock('js-yaml');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockYaml = yaml as jest.Mocked<typeof yaml>;

describe('SpecManager', () => {
  let specManager: SpecManager;
  const mockSpec = {
    app_name: 'Test App',
    description: 'Test description',
    tech_stack: {
      frontend: 'react',
      backend: 'node',
      database: 'sqlite',
      styles: 'tailwindcss'
    },
    features: {
      existing_feature: 'An existing feature'
    },
    workflows: []
  };

  beforeEach(() => {
    specManager = new SpecManager();
    jest.clearAllMocks();
  });

  describe('loadSpec', () => {
    it('should load and parse spec file successfully', async () => {
      // Arrange
      const mockSpecContent = 'mock yaml content';
      mockFs.readFile.mockResolvedValue(mockSpecContent);
      mockYaml.load.mockReturnValue(mockSpec);

      // Act
      const result = await specManager.loadSpec();

      // Assert
      expect(result).toEqual(mockSpec);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.kiro[\\\/]spec\.yaml$/),
        'utf-8'
      );
      expect(mockYaml.load).toHaveBeenCalledWith(mockSpecContent);
    });

    it('should throw error when file reading fails', async () => {
      // Arrange
      const error = new Error('File not found');
      mockFs.readFile.mockRejectedValue(error);

      // Act & Assert
      await expect(specManager.loadSpec()).rejects.toThrow('Failed to load spec file: File not found');
    });
  });

  describe('saveSpec', () => {
    it('should save spec file successfully', async () => {
      // Arrange
      const mockYamlContent = 'mock yaml output';
      mockYaml.dump.mockReturnValue(mockYamlContent);
      mockFs.writeFile.mockResolvedValue(undefined);

      // Act
      await specManager.saveSpec(mockSpec);

      // Assert
      expect(mockYaml.dump).toHaveBeenCalledWith(mockSpec, {
        indent: 2,
        lineWidth: 80,
        noRefs: true
      });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.kiro[\\\/]spec\.yaml$/),
        mockYamlContent,
        'utf-8'
      );
    });

    it('should throw error when file writing fails', async () => {
      // Arrange
      const error = new Error('Permission denied');
      mockYaml.dump.mockReturnValue('mock content');
      mockFs.writeFile.mockRejectedValue(error);

      // Act & Assert
      await expect(specManager.saveSpec(mockSpec)).rejects.toThrow('Failed to save spec file: Permission denied');
    });
  });

  describe('addFeature', () => {
    it('should add feature to spec and save', async () => {
      // Arrange
      const featureRequest = {
        name: 'sales-chart',
        componentType: 'chart',
        description: 'A chart showing sales data',
        props: { title: 'Sales Chart', dataSource: 'sales_db' },
        styling: { primaryColor: 'blue' }
      };

      mockFs.readFile.mockResolvedValue('mock content');
      mockYaml.load.mockReturnValue({ ...mockSpec });
      mockYaml.dump.mockReturnValue('updated content');
      mockFs.writeFile.mockResolvedValue(undefined);

      // Act
      const changes = await specManager.addFeature(featureRequest);

      // Assert
      expect(changes).toEqual(['Added feature: sales-chart_chart']);
      expect(mockYaml.dump).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.objectContaining({
            'sales-chart_chart': expect.stringContaining('A chart component that a chart showing sales data')
          })
        }),
        expect.any(Object)
      );
    });

    it('should generate proper feature description with all properties', async () => {
      // Arrange
      const featureRequest = {
        name: 'user-table',
        componentType: 'table',
        description: 'Display user information',
        props: { title: 'User List', dataSource: 'users_db' },
        styling: { primaryColor: 'green', size: 'large' }
      };

      mockFs.readFile.mockResolvedValue('mock content');
      mockYaml.load.mockReturnValue({ ...mockSpec });
      mockYaml.dump.mockReturnValue('updated content');
      mockFs.writeFile.mockResolvedValue(undefined);

      // Act
      await specManager.addFeature(featureRequest);

      // Assert
      expect(mockYaml.dump).toHaveBeenCalledWith(
        expect.objectContaining({
          features: expect.objectContaining({
            'user-table_table': 'A table component that display user information with title "User List" displaying data from users_db styled with green color theme in large size.'
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('addWorkflow', () => {
    it('should add workflow to spec and save', async () => {
      // Arrange
      const workflowSpec = {
        id: 'test-workflow',
        name: 'Test Workflow',
        description: 'A test workflow',
        trigger: { type: 'cron', schedule: '0 9 * * *' },
        actions: [{ type: 'log_result', message: 'test' }]
      };

      mockFs.readFile.mockResolvedValue('mock content');
      mockYaml.load.mockReturnValue({ ...mockSpec });
      mockYaml.dump.mockReturnValue('updated content');
      mockFs.writeFile.mockResolvedValue(undefined);

      // Act
      const changes = await specManager.addWorkflow(workflowSpec);

      // Assert
      expect(changes).toEqual(['Added workflow: Test Workflow']);
      expect(mockYaml.dump).toHaveBeenCalledWith(
        expect.objectContaining({
          workflows: expect.arrayContaining([workflowSpec])
        }),
        expect.any(Object)
      );
    });
  });
});