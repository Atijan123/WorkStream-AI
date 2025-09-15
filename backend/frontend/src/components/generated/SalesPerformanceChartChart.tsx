import React from 'react';

interface SalesPerformanceChartChartProps {}

/**
 * I want a sales performance chart showing monthly revenue
 * Generated component based on natural language request
 */
export const SalesPerformanceChartChart: React.FC<SalesPerformanceChartChartProps> = ({}) => {
  const [data, setData] = React.useState([{"label":"Jan","value":38},{"label":"Feb","value":79},{"label":"Mar","value":85},{"label":"Apr","value":87},{"label":"May","value":75},{"label":"Jun","value":40}]);
  
  return (
    <div className="p-4 border-gray-200 bg-white border rounded-lg">
      
      <div className="bg-white rounded-lg p-4 h-64">
        <div className="h-full flex items-end space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                style={{ height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                title={item.label + ': ' + item.value}
              ></div>
              <span className="text-xs text-gray-600 mt-1 truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesPerformanceChartChart;
