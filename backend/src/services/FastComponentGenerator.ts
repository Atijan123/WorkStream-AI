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
 * Fast, lightweight component generator for quick feature request processing
 */
export class FastComponentGenerator {
  private componentsDir: string;

  constructor() {
    const projectRoot = process.cwd().includes('backend') 
      ? path.join(process.cwd(), '..') 
      : process.cwd();
    this.componentsDir = path.join(projectRoot, 'frontend', 'src', 'components', 'generated');
  }

  async generateComponents(request: ParsedFeatureRequest): Promise<GeneratedComponent[]> {
    // Ensure directory exists
    await this.ensureDirectoryExists(this.componentsDir);

    // Generate only the main component for speed
    const mainComponent = await this.generateMainComponent(request);
    
    // Write component to file immediately
    await fs.writeFile(mainComponent.filePath, mainComponent.content, 'utf-8');

    return [mainComponent];
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

    const content = this.generateFastComponentContent(request);

    return {
      name: componentName,
      filePath,
      content
    };
  }

  private generateFastComponentContent(request: ParsedFeatureRequest): string {
    const componentName = this.toPascalCase(request.name);
    
    // Generate a simple, functional component based on the request type
    const componentBody = this.generateSimpleComponent(request);

    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
}

/**
 * ${request.description}
 * Generated component - Auto-created from feature request
 */
const ${componentName}: React.FC<${componentName}Props> = ({ className = '' }) => {
${componentBody}
};

export default ${componentName};`;
  }

  private generateSimpleComponent(request: ParsedFeatureRequest): string {
    const styling = this.getBasicStyling(request);
    
    // Detect component type from description and generate accordingly
    const description = request.description.toLowerCase();
    
    if (description.includes('calendar')) {
      return this.generateCalendarComponent(request, styling);
    } else if (description.includes('counter') || description.includes('count') || description.includes('increment')) {
      return this.generateCounterWidget(request, styling);
    } else if (description.includes('chart') || description.includes('graph')) {
      return this.generateSimpleChart(request, styling);
    } else if (description.includes('table') || description.includes('list')) {
      return this.generateSimpleTable(request, styling);
    } else if (description.includes('form')) {
      return this.generateSimpleForm(request, styling);
    } else if (description.includes('button')) {
      return this.generateSimpleButton(request, styling);
    } else if (description.includes('weather')) {
      return this.generateWeatherWidget(request, styling);
    } else if (description.includes('note') || description.includes('text')) {
      return this.generateNotesWidget(request, styling);
    } else {
      return this.generateGenericWidget(request, styling);
    }
  }

  private generateCounterWidget(request: ParsedFeatureRequest, styling: string): string {
    return `  const [count, setCount] = React.useState(0);
  const [step, setStep] = React.useState(1);
  
  return (
    <div className={\`${styling} \$\{className\}\`}>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Counter Widget</h3>
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold text-blue-600">{count}</div>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setCount(count - step)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              -
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Step:</span>
              <input
                type="number"
                value={step}
                onChange={(e) => setStep(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 border rounded text-center"
                min="1"
              />
            </div>
            <button
              onClick={() => setCount(count + step)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              +
            </button>
          </div>
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setCount(0)}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reset
            </button>
            <button
              onClick={() => setCount(count * 2)}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Double
            </button>
          </div>
        </div>
      </div>
    </div>
  );`;

  private generateCalendarComponent(request: ParsedFeatureRequest, styling: string): string {
    return `  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  };
  
  return (
    <div className={\`${styling} \${className}\`}>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{monthNames[currentMonth]} {currentYear}</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded"
            >
              Today
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div key={index} className="aspect-square">
              {day && (
                <button
                  onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                  className={\`w-full h-full flex items-center justify-center text-sm rounded transition-colors \${
                    isToday(day) 
                      ? 'bg-blue-600 text-white font-semibold' 
                      : 'hover:bg-gray-100'
                  }\`}
                >
                  {day}
                </button>
              )}
            </div>
          ))}
        </div>
        
        {selectedDate && (
          <div className="mt-4 p-2 bg-blue-50 rounded text-sm">
            Selected: {selectedDate.toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );`;
  }

  private generateSimpleChart(request: ParsedFeatureRequest, styling: string): string {
    return `  const [data] = React.useState([
    { label: 'Jan', value: 65 },
    { label: 'Feb', value: 78 },
    { label: 'Mar', value: 90 },
    { label: 'Apr', value: 81 },
    { label: 'May', value: 95 },
    { label: 'Jun', value: 88 }
  ]);
  
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className={\`${styling} \${className}\`}>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">${request.description}</h3>
        <div className="h-48 flex items-end space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: \`\${(item.value / maxValue) * 100}%\` }}
                title={\`\${item.label}: \${item.value}\`}
              />
              <span className="text-xs text-gray-600 mt-1">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );`;
  }

  private generateSimpleTable(request: ParsedFeatureRequest, styling: string): string {
    return `  const [data] = React.useState([
    { id: 1, name: 'Item 1', status: 'Active', date: '2024-01-15' },
    { id: 2, name: 'Item 2', status: 'Pending', date: '2024-01-16' },
    { id: 3, name: 'Item 3', status: 'Complete', date: '2024-01-17' }
  ]);
  
  return (
    <div className={\`${styling} \${className}\`}>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">${request.description}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">
                    <span className={\`px-2 py-1 rounded text-xs \${
                      item.status === 'Active' ? 'bg-green-100 text-green-800' :
                      item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }\`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );`;
  }

  private generateSimpleForm(request: ParsedFeatureRequest, styling: string): string {
    return `  const [formData, setFormData] = React.useState({ name: '', email: '' });
  const [submitted, setSubmitted] = React.useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };
  
  return (
    <div className={\`${styling} \${className}\`}>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">${request.description}</h3>
        {submitted ? (
          <div className="text-green-600 text-center py-4">Form submitted successfully!</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );`;
  }

  private generateSimpleButton(request: ParsedFeatureRequest, styling: string): string {
    return `  const [clicked, setClicked] = React.useState(false);
  
  return (
    <div className={\`${styling} \${className}\`}>
      <button
        onClick={() => setClicked(!clicked)}
        className={\`px-6 py-3 rounded-lg font-medium transition-colors \${
          clicked 
            ? 'bg-green-600 text-white' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }\`}
      >
        {clicked ? 'Clicked!' : '${request.description}'}
      </button>
    </div>
  );`;
  }

  private generateWeatherWidget(request: ParsedFeatureRequest, styling: string): string {
    return `  const [weather] = React.useState({
    temperature: 22,
    condition: 'Sunny',
    humidity: 65,
    windSpeed: 12
  });
  
  return (
    <div className={\`${styling} \${className}\`}>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Weather Widget</h3>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{weather.temperature}°C</div>
          <div className="text-gray-600 mb-4">{weather.condition}</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Humidity</div>
              <div className="font-medium">{weather.humidity}%</div>
            </div>
            <div>
              <div className="text-gray-500">Wind</div>
              <div className="font-medium">{weather.windSpeed} km/h</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );`;
  }

  private generateNotesWidget(request: ParsedFeatureRequest, styling: string): string {
    return `  const [notes, setNotes] = React.useState('');
  const [savedNotes, setSavedNotes] = React.useState<string[]>([]);
  
  const saveNote = () => {
    if (notes.trim()) {
      setSavedNotes([...savedNotes, notes]);
      setNotes('');
    }
  };
  
  return (
    <div className={\`${styling} \${className}\`}>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Notes Widget</h3>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && saveNote()}
            />
            <button
              onClick={saveNote}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {savedNotes.map((note, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );`;
  }

  private generateGenericWidget(request: ParsedFeatureRequest, styling: string): string {
    return `  const [count, setCount] = React.useState(0);
  const [lastUpdated, setLastUpdated] = React.useState(new Date());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={\`${styling} \${className}\`}>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Feature Widget</h3>
        <p className="text-gray-600 mb-4">${request.description}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCount(count + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Count: {count}
          </button>
          <div className="text-xs text-gray-500">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );`;
  }

  private getBasicStyling(request: ParsedFeatureRequest): string {
    return 'p-4';
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^(.)/, (_, char) => char.toUpperCase());
  }
}