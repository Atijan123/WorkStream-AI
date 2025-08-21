import React from 'react';

interface SystemPerformanceChartProps {
  title?: string;
  dataSource?: string;
}

/**
 * I want a chart that shows system performance metrics over time with CPU and memory usage
 * Generated component based on natural language request
 */
export const SystemPerformanceChart: React.FC<SystemPerformanceChartProps> = ({ title, dataSource: _dataSource }) => {
  return (
    <div className="p-4 border-blue-200 bg-blue-50 max-w-md border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">{title || "System Performance Chart"}</h3>
      <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
        <p className="text-gray-600">Chart visualization would go here</p>
        {/* TODO: Integrate with actual charting library */}
      </div>
    </div>
  );
};

export default SystemPerformanceChart;