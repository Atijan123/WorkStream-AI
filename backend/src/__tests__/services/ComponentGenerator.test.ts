import { ComponentGenerator } from '../../services/ComponentGenerator';
import * as fs from 'fs/promises';

// Mock fs module
jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('ComponentGenerator', () => {
  let generator: ComponentGenerator;

  beforeEach(() => {
    generator = new ComponentGenerator();
    jest.clearAllMocks();
  });

  describe('generateComponents', () => {
    const mockFeatureRequest = {
      name: 'sales-chart',
      componentType: 'chart',
      description: 'A chart showing sales data',
      props: { title: 'Sales Chart', dataSource: 'sales_db' },
      styling: { primaryColor: 'blue', size: 'large' }
    };

    beforeEach(() => {
      mockFs.access.mockRejectedValue(new Error('Directory does not exist'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('mock app content');
    });

    it('should generate main component and test file', async () => {
      // Act
      const result = await generator.generateComponents(mockFeatureRequest);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('SalesChart');
      expect(result[0].filePath).toContain('SalesChart.tsx');
      expect(result[1].name).toBe('SalesChartTest');
      expect(result[1].filePath).toContain('SalesChart.test.tsx');
    });

    it('should create generated components directory', async () => {
      // Act
      await generator.generateComponents(mockFeatureRequest);

      // Assert
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringMatching(/components[\\\/]generated$/),
        { recursive: true }
      );
    });

    it('should write component files', async () => {
      // Act
      await generator.generateComponents(mockFeatureRequest);

      // Assert
      expect(mockFs.writeFile).toHaveBeenCalledTimes(3); // 2 component files + 1 App.tsx update
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('SalesChart.tsx'),
        expect.stringContaining('export const SalesChart'),
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('SalesChart.test.tsx'),
        expect.stringContaining('describe(\'SalesChart\''),
        'utf-8'
      );
    });

    it('should generate chart component with correct structure', async () => {
      // Act
      const result = await generator.generateComponents(mockFeatureRequest);

      // Assert
      const componentContent = result[0].content;
      expect(componentContent).toContain('interface SalesChartProps');
      expect(componentContent).toContain('export const SalesChart: React.FC<SalesChartProps>');
      expect(componentContent).toContain('title: string');
      expect(componentContent).toContain('dataSource: string');
      expect(componentContent).toContain('Chart visualization would go here');
    });

    it('should generate table component for table type', async () => {
      // Arrange
      const tableRequest = {
        name: 'user-table',
        componentType: 'table',
        description: 'A table showing user data',
        props: { title: 'Users' },
        styling: {}
      };

      // Act
      const result = await generator.generateComponents(tableRequest);

      // Assert
      const componentContent = result[0].content;
      expect(componentContent).toContain('export const UserTable');
      expect(componentContent).toContain('<table className="min-w-full');
      expect(componentContent).toContain('<thead className="bg-gray-50">');
    });

    it('should generate form component for form type', async () => {
      // Arrange
      const formRequest = {
        name: 'contact-form',
        componentType: 'form',
        description: 'A contact form',
        props: { title: 'Contact Us' },
        styling: {}
      };

      // Act
      const result = await generator.generateComponents(formRequest);

      // Assert
      const componentContent = result[0].content;
      expect(componentContent).toContain('export const ContactForm');
      expect(componentContent).toContain('<form className="space-y-4">');
      expect(componentContent).toContain('type="submit"');
    });

    it('should generate button component for button type', async () => {
      // Arrange
      const buttonRequest = {
        name: 'action-button',
        componentType: 'button',
        description: 'An action button',
        props: { title: 'Click Me' },
        styling: { primaryColor: 'red' }
      };

      // Act
      const result = await generator.generateComponents(buttonRequest);

      // Assert
      const componentContent = result[0].content;
      expect(componentContent).toContain('export const ActionButton');
      expect(componentContent).toContain('<button');
      expect(componentContent).toContain('onClick={() => console.log(\'Button clicked\')}');
    });

    it('should apply correct styling classes', async () => {
      // Arrange
      const styledRequest = {
        name: 'styled-widget',
        componentType: 'widget',
        description: 'A styled widget',
        props: {},
        styling: { primaryColor: 'purple', size: 'xl' }
      };

      // Act
      const result = await generator.generateComponents(styledRequest);

      // Assert
      const componentContent = result[0].content;
      expect(componentContent).toContain('border-purple-200 bg-purple-50');
      expect(componentContent).toContain('max-w-xl');
    });

    it('should generate test file with proper assertions', async () => {
      // Act
      const result = await generator.generateComponents(mockFeatureRequest);

      // Assert
      const testContent = result[1].content;
      expect(testContent).toContain('import { render, screen } from \'@testing-library/react\'');
      expect(testContent).toContain('describe(\'SalesChart\'');
      expect(testContent).toContain('it(\'renders without crashing\'');
      expect(testContent).toContain('title="Sales Chart"');
      expect(testContent).toContain('dataSource="sales_db"');
    });

    it('should handle components without props', async () => {
      // Arrange
      const simpleRequest = {
        name: 'simple-widget',
        componentType: 'widget',
        description: 'A simple widget',
        props: {},
        styling: {}
      };

      // Act
      const result = await generator.generateComponents(simpleRequest);

      // Assert
      const componentContent = result[0].content;
      expect(componentContent).toContain('interface SimpleWidgetProps {}');
      expect(componentContent).toContain('({})');
    });
  });
});