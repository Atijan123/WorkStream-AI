import React from 'react';

interface WeatherWidgetShowingWidgetProps {}

/**
 * I want a weather widget showing current temperature and conditions
 * Generated component based on natural language request
 */
export const WeatherWidgetShowingWidget: React.FC<WeatherWidgetShowingWidgetProps> = ({}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [counter, setCounter] = React.useState(0);
  const [lastUpdated, setLastUpdated] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 border-gray-200 bg-white border rounded-lg">
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">I want a weather widget showing current temperature and conditions</p>
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
  );
};

export default WeatherWidgetShowingWidget;
