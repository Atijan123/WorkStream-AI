import * as fs from 'fs/promises';
import * as path from 'path';

interface ParsedFeatureRequest {
  name: string;
  componentType: string;
  description: string;
  props: Record<string, any>;
  styling: Record<string, string>;
}

interface GeneratedComponent {
  name: string;
  filePath: string;
  content: string;
}

/**
 * Generates React components based on parsed feature requests
 */
export class ComponentGenerator {
  private componentsDir: string;

  constructor() {
    this.componentsDir = path.join(process.cwd(), 'frontend', 'src', 'components', 'generated');
  }

  async generateComponents(request: ParsedFeatureRequest): Promise<GeneratedComponent[]> {
    const components: GeneratedComponent[] = [];

    // Ensure generated components directory exists
    await this.ensureDirectoryExists(this.componentsDir);

    // Generate main component
    const mainComponent = await this.generateMainComponent(request);
    components.push(mainComponent);

    // Generate test file
    const testComponent = await this.generateTestComponent(request);
    components.push(testComponent);

    // Write components to files
    for (const component of components) {
      await fs.writeFile(component.filePath, component.content, 'utf-8');
    }

    // Update the main App component to include the new component
    await this.updateAppComponent(request);

    return components;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async generateMainComponent(request: ParsedFeatureRequest): Promise<GeneratedComponent> {
    const componentName = this.toPascalCase(request.name);
    const fileName = `${componentName}.tsx`;
    const filePath = path.join(this.componentsDir, fileName);

    const content = this.generateComponentContent(request);

    return {
      name: componentName,
      filePath,
      content
    };
  }

  private async generateTestComponent(request: ParsedFeatureRequest): Promise<GeneratedComponent> {
    const componentName = this.toPascalCase(request.name);
    const fileName = `${componentName}.test.tsx`;
    const filePath = path.join(this.componentsDir, fileName);

    const content = this.generateTestContent(request);

    return {
      name: `${componentName}Test`,
      filePath,
      content
    };
  }

  private generateComponentContent(request: ParsedFeatureRequest): string {
    const componentName = this.toPascalCase(request.name);
    const props = this.generatePropsInterface(request);
    const component = this.generateComponentByType(request);

    return `import React from 'react';

${props}

/**
 * ${request.description}
 * Generated component based on natural language request
 */
export const ${componentName}: React.FC<${componentName}Props> = (${this.generatePropsDestructuring(request)}) => {
${component}
};

export default ${componentName};
`;
  }

  private generateTestContent(request: ParsedFeatureRequest): string {
    const componentName = this.toPascalCase(request.name);

    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} ${this.generateTestProps(request)} />);
  });

  it('displays the correct content', () => {
    render(<${componentName} ${this.generateTestProps(request)} />);
    ${this.generateTestAssertions(request)}
  });
});
`;
  }

  private generatePropsInterface(request: ParsedFeatureRequest): string {
    const componentName = this.toPascalCase(request.name);
    const props = Object.keys(request.props);
    
    if (props.length === 0) {
      return `interface ${componentName}Props {}`;
    }

    const propsDefinition = props.map(prop => {
      const type = this.inferPropType(request.props[prop]);
      return `  ${prop}${type.optional ? '?' : ''}: ${type.type};`;
    }).join('\n');

    return `interface ${componentName}Props {
${propsDefinition}
}`;
  }

  private generatePropsDestructuring(request: ParsedFeatureRequest): string {
    const props = Object.keys(request.props);
    if (props.length === 0) return '{}';
    return `{ ${props.join(', ')} }`;
  }

  private generateComponentByType(request: ParsedFeatureRequest): string {
    const styling = this.generateStyling(request);
    
    switch (request.componentType) {
      case 'chart':
        return this.generateChartComponent(request, styling);
      case 'table':
        return this.generateTableComponent(request, styling);
      case 'form':
        return this.generateFormComponent(request, styling);
      case 'button':
        return this.generateButtonComponent(request, styling);
      default:
        return this.generateWidgetComponent(request, styling);
    }
  }

  private generateChartComponent(request: ParsedFeatureRequest, styling: string): string {
    return `  return (
    <div className="${styling}">
      ${request.props.title ? `<h3 className="text-lg font-semibold mb-4">{title || "${request.props.title}"}</h3>` : ''}
      <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
        <p className="text-gray-600">Chart visualization would go here</p>
        {/* TODO: Integrate with actual charting library */}
      </div>
    </div>
  );`;
  }

  private generateTableComponent(request: ParsedFeatureRequest, styling: string): string {
    return `  return (
    <div className="${styling}">
      ${request.props.title ? `<h3 className="text-lg font-semibold mb-4">{title || "${request.props.title}"}</h3>` : ''}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Column 1
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Column 2
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Sample Data</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Sample Data</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );`;
  }

  private generateFormComponent(request: ParsedFeatureRequest, styling: string): string {
    return `  return (
    <div className="${styling}">
      ${request.props.title ? `<h3 className="text-lg font-semibold mb-4">{title || "${request.props.title}"}</h3>` : ''}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Input Field
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter value..."
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit
        </button>
      </form>
    </div>
  );`;
  }

  private generateButtonComponent(request: ParsedFeatureRequest, styling: string): string {
    return `  return (
    <button
      className="${styling} px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
      onClick={() => console.log('Button clicked')}
    >
      ${request.props.title ? `{title || "${request.props.title}"}` : '"Click Me"'}
    </button>
  );`;
  }

  private generateWidgetComponent(request: ParsedFeatureRequest, styling: string): string {
    return `  return (
    <div className="${styling}">
      ${request.props.title ? `<h3 className="text-lg font-semibold mb-4">{title || "${request.props.title}"}</h3>` : ''}
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">${request.description}</p>
        {/* TODO: Add specific widget functionality */}
      </div>
    </div>
  );`;
  }

  private generateStyling(request: ParsedFeatureRequest): string {
    let classes = ['p-4'];

    // Add color styling
    if (request.styling.primaryColor) {
      const colorMap: Record<string, string> = {
        blue: 'border-blue-200 bg-blue-50',
        red: 'border-red-200 bg-red-50',
        green: 'border-green-200 bg-green-50',
        yellow: 'border-yellow-200 bg-yellow-50',
        purple: 'border-purple-200 bg-purple-50',
        pink: 'border-pink-200 bg-pink-50',
        gray: 'border-gray-200 bg-gray-50'
      };
      classes.push(colorMap[request.styling.primaryColor] || 'border-gray-200 bg-gray-50');
    } else {
      classes.push('border-gray-200 bg-white');
    }

    // Add size styling
    if (request.styling.size) {
      const sizeMap: Record<string, string> = {
        small: 'max-w-sm',
        medium: 'max-w-md',
        large: 'max-w-lg',
        xl: 'max-w-xl'
      };
      classes.push(sizeMap[request.styling.size] || 'max-w-md');
    }

    classes.push('border rounded-lg');

    return classes.join(' ');
  }

  private generateTestProps(request: ParsedFeatureRequest): string {
    const props = Object.entries(request.props).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      }
      return `${key}={${JSON.stringify(value)}}`;
    });
    return props.join(' ');
  }

  private generateTestAssertions(request: ParsedFeatureRequest): string {
    const assertions: string[] = [];
    
    if (request.props.title) {
      assertions.push(`expect(screen.getByText('${request.props.title}')).toBeInTheDocument();`);
    }
    
    if (assertions.length === 0) {
      assertions.push('// Add specific test assertions based on component functionality');
    }
    
    return assertions.map(assertion => `    ${assertion}`).join('\n');
  }

  private async updateAppComponent(request: ParsedFeatureRequest): Promise<void> {
    const appPath = path.join(process.cwd(), 'frontend', 'src', 'App.tsx');
    const componentName = this.toPascalCase(request.name);
    
    try {
      let appContent = await fs.readFile(appPath, 'utf-8');
      
      // Add import statement
      const importStatement = `import ${componentName} from './components/generated/${componentName}';`;
      if (!appContent.includes(importStatement)) {
        // Find the last import and add after it
        const lastImportIndex = appContent.lastIndexOf('import ');
        const nextLineIndex = appContent.indexOf('\n', lastImportIndex);
        appContent = appContent.slice(0, nextLineIndex + 1) + importStatement + '\n' + appContent.slice(nextLineIndex + 1);
      }
      
      // Add component to the dashboard (look for a components section or add to main content)
      const componentUsage = `        <${componentName} ${this.generateDefaultProps(request)} />`;
      if (!appContent.includes(`<${componentName}`)) {
        // Find a good place to add the component (look for existing components or main content area)
        const dashboardMatch = appContent.match(/<div[^>]*className[^>]*dashboard[^>]*>/i);
        if (dashboardMatch) {
          const insertIndex = appContent.indexOf('</div>', dashboardMatch.index!) - 1;
          appContent = appContent.slice(0, insertIndex) + '\n' + componentUsage + '\n      ' + appContent.slice(insertIndex);
        } else {
          // Fallback: add before the last closing div
          const lastDivIndex = appContent.lastIndexOf('</div>');
          appContent = appContent.slice(0, lastDivIndex) + componentUsage + '\n      ' + appContent.slice(lastDivIndex);
        }
      }
      
      await fs.writeFile(appPath, appContent, 'utf-8');
    } catch (error) {
      console.warn('Could not update App component automatically:', error instanceof Error ? error.message : String(error));
    }
  }

  private generateDefaultProps(request: ParsedFeatureRequest): string {
    const props = Object.entries(request.props).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      }
      return `${key}={${JSON.stringify(value)}}`;
    });
    return props.join(' ');
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^(.)/, (_, char) => char.toUpperCase());
  }

  private inferPropType(value: any): { type: string; optional: boolean } {
    if (typeof value === 'string') {
      return { type: 'string', optional: false };
    } else if (typeof value === 'number') {
      return { type: 'number', optional: false };
    } else if (typeof value === 'boolean') {
      return { type: 'boolean', optional: false };
    } else if (Array.isArray(value)) {
      return { type: 'any[]', optional: false };
    } else {
      return { type: 'any', optional: true };
    }
  }
}