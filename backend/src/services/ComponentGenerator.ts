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
    // Ensure we're using the correct path relative to the project root
    const projectRoot = process.cwd().includes('backend') 
      ? path.join(process.cwd(), '..') 
      : process.cwd();
    this.componentsDir = path.join(projectRoot, 'frontend', 'src', 'components', 'generated');
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

    // Note: No need to update DashboardHome.tsx anymore since we have dynamic loading
    // Components will be automatically discovered and loaded

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
    const chartData = this.generateSampleChartData(request);
    return `  const [data, setData] = React.useState(${JSON.stringify(chartData)});
  
  return (
    <div className="${styling}">
      ${request.props.title ? `<h3 className="text-lg font-semibold mb-4">{title || "${request.props.title}"}</h3>` : ''}
      <div className="bg-white rounded-lg p-4 h-64">
        <div className="h-full flex items-end space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                style={{ height: \`\${(item.value / Math.max(...data.map(d => d.value))) * 100}%\` }}
                title={item.label + ': ' + item.value}
              ></div>
              <span className="text-xs text-gray-600 mt-1 truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );`;
  }

  private generateTableComponent(request: ParsedFeatureRequest, styling: string): string {
    const tableData = this.generateSampleTableData(request);
    return `  const [data, setData] = React.useState(${JSON.stringify(tableData.rows)});
  const [sortField, setSortField] = React.useState('');
  const [sortDirection, setSortDirection] = React.useState('asc');

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    
    const sortedData = [...data].sort((a, b) => {
      if (direction === 'asc') {
        return a[field] > b[field] ? 1 : -1;
      }
      return a[field] < b[field] ? 1 : -1;
    });
    setData(sortedData);
  };

  return (
    <div className="${styling}">
      ${request.props.title ? `<h3 className="text-lg font-semibold mb-4">{title || "${request.props.title}"}</h3>` : ''}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              ${tableData.columns.map(col => `<th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('${col.key}')}
              >
                ${col.label}
                {sortField === '${col.key}' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>`).join('\n              ')}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                ${tableData.columns.map(col => `<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.${col.key}}
                </td>`).join('\n                ')}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );`;
  }

  private generateFormComponent(request: ParsedFeatureRequest, styling: string): string {
    return `  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
    
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="${styling}">
      ${request.props.title ? `<h3 className="text-lg font-semibold mb-4">{title || "${request.props.title}"}</h3>` : ''}
      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Form submitted successfully!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your message..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}
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
    return `  const [isExpanded, setIsExpanded] = React.useState(false);
  const [counter, setCounter] = React.useState(0);
  const [lastUpdated, setLastUpdated] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="${styling}">
      ${request.props.title ? `<h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
        <span>{title || "${request.props.title}"}</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </h3>` : ''}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">${request.description}</p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCounter(counter + 1)}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
            >
              Count: {counter}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Additional Details</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Component created from natural language request</li>
              <li>• Interactive and functional out of the box</li>
              <li>• Last updated: {lastUpdated.toLocaleTimeString()}</li>
              <li>• Click count: {counter}</li>
            </ul>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>Auto-generated component</span>
          <span>Status: Active</span>
        </div>
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
    const projectRoot = process.cwd().includes('backend') 
      ? path.join(process.cwd(), '..') 
      : process.cwd();
    const dashboardPath = path.join(projectRoot, 'frontend', 'src', 'components', 'DashboardHome.tsx');
    const componentName = this.toPascalCase(request.name);
    
    try {
      let dashboardContent = await fs.readFile(dashboardPath, 'utf-8');
      
      // Add import statement
      const importStatement = `import ${componentName} from './generated/${componentName}';`;
      if (!dashboardContent.includes(importStatement)) {
        // Find the last import and add after it
        const lastImportIndex = dashboardContent.lastIndexOf('import ');
        const nextLineIndex = dashboardContent.indexOf('\n', lastImportIndex);
        dashboardContent = dashboardContent.slice(0, nextLineIndex + 1) + importStatement + '\n' + dashboardContent.slice(nextLineIndex + 1);
      }
      
      // Add component to the dashboard grid
      const componentUsage = `          <${componentName} ${this.generateDefaultProps(request)} />`;
      if (!dashboardContent.includes(`<${componentName}`)) {
        // Find the dashboard grid and add the component
        const gridMatch = dashboardContent.match(/className="grid[^"]*grid-cols[^"]*"/);
        if (gridMatch) {
          // Find the end of the grid div
          const gridStartIndex = dashboardContent.indexOf('<div', dashboardContent.indexOf(gridMatch[0]));
          const gridEndIndex = this.findMatchingClosingTag(dashboardContent, gridStartIndex);
          
          if (gridEndIndex > 0) {
            // Insert before the closing div of the grid
            const insertIndex = gridEndIndex - 10; // Before </div>
            dashboardContent = dashboardContent.slice(0, insertIndex) + '\n' + componentUsage + '\n        ' + dashboardContent.slice(insertIndex);
          }
        } else {
          // Fallback: add to the main content area
          const mainContentMatch = dashboardContent.match(/className="space-y-6"/);
          if (mainContentMatch) {
            const contentStartIndex = dashboardContent.indexOf('<div', dashboardContent.indexOf(mainContentMatch[0]));
            const contentEndIndex = this.findMatchingClosingTag(dashboardContent, contentStartIndex);
            
            if (contentEndIndex > 0) {
              const insertIndex = contentEndIndex - 10;
              dashboardContent = dashboardContent.slice(0, insertIndex) + '\n        <div className="bg-white shadow rounded-lg p-6">\n' + componentUsage + '\n        </div>\n      ' + dashboardContent.slice(insertIndex);
            }
          }
        }
      }
      
      await fs.writeFile(dashboardPath, dashboardContent, 'utf-8');
    } catch (error) {
      console.warn('Could not update Dashboard component automatically:', error instanceof Error ? error.message : String(error));
    }
  }

  private findMatchingClosingTag(content: string, startIndex: number): number {
    let depth = 0;
    let i = startIndex;
    
    while (i < content.length) {
      if (content.substring(i, i + 4) === '<div') {
        depth++;
        i += 4;
      } else if (content.substring(i, i + 6) === '</div>') {
        depth--;
        if (depth === 0) {
          return i;
        }
        i += 6;
      } else {
        i++;
      }
    }
    
    return -1;
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

  private generateSampleChartData(request: ParsedFeatureRequest): Array<{label: string, value: number}> {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return labels.map(label => ({
      label,
      value: Math.floor(Math.random() * 100) + 10
    }));
  }

  private generateSampleTableData(request: ParsedFeatureRequest): {columns: Array<{key: string, label: string}>, rows: Array<Record<string, any>>} {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'date', label: 'Date' },
      { key: 'value', label: 'Value' }
    ];
    
    const rows = [
      { name: 'Item 1', status: 'Active', date: '2024-01-15', value: 150 },
      { name: 'Item 2', status: 'Pending', date: '2024-01-16', value: 200 },
      { name: 'Item 3', status: 'Complete', date: '2024-01-17', value: 75 },
      { name: 'Item 4', status: 'Active', date: '2024-01-18', value: 300 },
    ];
    
    return { columns, rows };
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