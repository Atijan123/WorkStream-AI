import React from 'react';

interface SalesOverviewProps {
  title?: string;
  data?: Array<{ month: string; sales: number }>;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  height?: number;
}

/**
 * Create a blue chart showing monthly sales data with title "Sales Overview"
 * Generated component based on natural language request
 */
export const SalesOverview: React.FC<SalesOverviewProps> = ({ 
  title = "Sales Overview",
  data = [
    { month: 'Jan', sales: 12000 },
    { month: 'Feb', sales: 15000 },
    { month: 'Mar', sales: 18000 },
    { month: 'Apr', sales: 14000 },
    { month: 'May', sales: 22000 },
    { month: 'Jun', sales: 25000 },
    { month: 'Jul', sales: 28000 },
    { month: 'Aug', sales: 24000 },
    { month: 'Sep', sales: 26000 },
    { month: 'Oct', sales: 30000 },
    { month: 'Nov', sales: 32000 },
    { month: 'Dec', sales: 35000 }
  ],
  color = 'blue',
  height = 300
}) => {
  const maxSales = Math.max(...data.map(d => d.sales));
  
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    purple: 'bg-purple-500 hover:bg-purple-600'
  };

  const backgroundColorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    purple: 'border-purple-200 bg-purple-50'
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`p-6 ${backgroundColorClasses[color]} border rounded-lg max-w-4xl`}>
      <h3 className="text-xl font-semibold mb-6 text-gray-800">{title}</h3>
      
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Chart container */}
        <div className="flex items-end justify-between h-full space-x-2">
          {data.map((item, index) => {
            const barHeight = (item.sales / maxSales) * (height - 60); // Leave space for labels
            
            return (
              <div key={index} className="flex flex-col items-center flex-1 group">
                {/* Bar */}
                <div className="relative flex flex-col justify-end h-full">
                  {/* Value label on hover */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {formatCurrency(item.sales)}
                  </div>
                  
                  {/* Bar element */}
                  <div
                    className={`${colorClasses[color]} rounded-t-md transition-all duration-300 ease-in-out transform group-hover:scale-105 min-h-[4px]`}
                    style={{ height: `${Math.max(barHeight, 4)}px` }}
                  />
                </div>
                
                {/* Month label */}
                <div className="mt-2 text-sm font-medium text-gray-600">
                  {item.month}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
          <span>{formatCurrency(maxSales)}</span>
          <span>{formatCurrency(maxSales * 0.75)}</span>
          <span>{formatCurrency(maxSales * 0.5)}</span>
          <span>{formatCurrency(maxSales * 0.25)}</span>
          <span>$0</span>
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-lg font-semibold text-gray-800">
            {formatCurrency(data.reduce((sum, item) => sum + item.sales, 0))}
          </div>
          <div className="text-sm text-gray-600">Total Sales</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-lg font-semibold text-gray-800">
            {formatCurrency(data.reduce((sum, item) => sum + item.sales, 0) / data.length)}
          </div>
          <div className="text-sm text-gray-600">Average</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-lg font-semibold text-gray-800">
            {formatCurrency(Math.max(...data.map(d => d.sales)))}
          </div>
          <div className="text-sm text-gray-600">Peak Month</div>
        </div>
      </div>
    </div>
  );
};

export default SalesOverview;