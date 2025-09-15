import React from 'react';

interface MetricsOverviewCardProps {
  title?: string;
  metrics?: Array<{
    label: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  }>;
  showTrends?: boolean;
}

/**
 * I want a metrics overview card that displays key system metrics with trend indicators and color coding
 * Generated component based on natural language request
 */
export const MetricsOverviewCard: React.FC<MetricsOverviewCardProps> = ({ 
  title = "System Metrics Overview",
  showTrends = true,
  metrics = [
    {
      label: 'Active Workflows',
      value: 12,
      change: 8.5,
      trend: 'up',
      color: 'blue'
    },
    {
      label: 'Completed Tasks',
      value: 247,
      change: 12.3,
      trend: 'up',
      color: 'green'
    },
    {
      label: 'System Uptime',
      value: '99.9%',
      change: 0.1,
      trend: 'stable',
      color: 'green'
    },
    {
      label: 'Error Rate',
      value: '0.2%',
      change: -15.2,
      trend: 'down',
      color: 'red'
    },
    {
      label: 'Response Time',
      value: '145ms',
      change: -8.7,
      trend: 'down',
      color: 'yellow'
    },
    {
      label: 'Feature Requests',
      value: 8,
      change: 25.0,
      trend: 'up',
      color: 'purple'
    }
  ]
}) => {
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTrendColor = (trend: string, change?: number) => {
    if (!change) return 'text-gray-500';
    
    switch (trend) {
      case 'up':
        return change > 0 ? 'text-green-600' : 'text-red-600';
      case 'down':
        return change < 0 ? 'text-green-600' : 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
    }
  };

  const formatChange = (change?: number) => {
    if (!change) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <div className="p-6 border-gray-200 bg-white border rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getColorClasses(metric.color || 'blue')}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">{metric.label}</span>
              {showTrends && metric.trend && (
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                </div>
              )}
            </div>
            
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-900">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </span>
                {showTrends && metric.change !== undefined && (
                  <span className={`text-xs font-medium ${getTrendColor(metric.trend || 'stable', metric.change)}`}>
                    {formatChange(metric.change)}
                  </span>
                )}
              </div>
              
              {metric.color && (
                <div className={`w-3 h-8 rounded-full ${
                  metric.color === 'blue' ? 'bg-blue-400' :
                  metric.color === 'green' ? 'bg-green-400' :
                  metric.color === 'red' ? 'bg-red-400' :
                  metric.color === 'yellow' ? 'bg-yellow-400' :
                  metric.color === 'purple' ? 'bg-purple-400' : 'bg-gray-400'
                }`}></div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            View detailed metrics →
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetricsOverviewCard;