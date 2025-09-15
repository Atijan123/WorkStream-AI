import React, { useState, useEffect } from 'react';

interface StatItem {
  id: string;
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
}

interface QuickStatsOverviewProps {
  title?: string;
  stats?: StatItem[];
  columns?: number;
  showTrends?: boolean;
}

/**
 * I want a quick stats overview widget that displays key metrics with trend indicators and color coding
 * Generated component based on natural language request
 */
export const QuickStatsOverview: React.FC<QuickStatsOverviewProps> = ({ 
  title = "Quick Stats Overview",
  columns = 2,
  showTrends = true,
  stats = [
    {
      id: 'active-workflows',
      label: 'Active Workflows',
      value: 24,
      change: 12,
      changeType: 'increase',
      icon: '⚙️',
      color: 'blue'
    },
    {
      id: 'completed-tasks',
      label: 'Completed Today',
      value: 156,
      change: 8,
      changeType: 'increase',
      icon: '✅',
      color: 'green'
    },
    {
      id: 'pending-requests',
      label: 'Pending Requests',
      value: 7,
      change: -3,
      changeType: 'decrease',
      icon: '⏳',
      color: 'yellow'
    },
    {
      id: 'system-uptime',
      label: 'System Uptime',
      value: '99.8%',
      change: 0.2,
      changeType: 'increase',
      icon: '🟢',
      color: 'green'
    },
    {
      id: 'error-rate',
      label: 'Error Rate',
      value: '0.1%',
      change: -0.05,
      changeType: 'decrease',
      icon: '🔴',
      color: 'red'
    },
    {
      id: 'response-time',
      label: 'Avg Response Time',
      value: '245ms',
      change: -15,
      changeType: 'decrease',
      icon: '⚡',
      color: 'purple'
    }
  ]
}) => {
  const [animatedStats, setAnimatedStats] = useState(stats);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAnimatedStats(stats);
  }, [stats]);

  const refreshStats = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedStats = animatedStats.map(stat => ({
        ...stat,
        value: typeof stat.value === 'number' 
          ? Math.max(0, stat.value + Math.floor(Math.random() * 10 - 5))
          : stat.value,
        change: typeof stat.change === 'number'
          ? Math.round((Math.random() * 20 - 10) * 100) / 100
          : stat.change,
        changeType: Math.random() > 0.5 ? 'increase' : Math.random() > 0.5 ? 'decrease' : 'neutral'
      }));
      
      setAnimatedStats(updatedStats as StatItem[]);
      setIsLoading(false);
    }, 1000);
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      gray: 'bg-gray-50 border-gray-200 text-gray-700'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return <span className="text-green-500">↗</span>;
      case 'decrease':
        return <span className="text-red-500">↘</span>;
      default:
        return <span className="text-gray-500">→</span>;
    }
  };

  const getChangeColor = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatChange = (change?: number, changeType?: string) => {
    if (change === undefined) return '';
    
    const prefix = changeType === 'increase' ? '+' : '';
    const suffix = typeof change === 'number' && Math.abs(change) < 1 ? '' : '';
    
    return `${prefix}${change}${suffix}`;
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className="p-4 border-gray-200 bg-white border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={refreshStats}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Updating...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>

      <div className={`grid gap-4 ${gridCols[Math.min(columns, 4) as keyof typeof gridCols]}`}>
        {animatedStats.map((stat) => (
          <div
            key={stat.id}
            className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${getColorClasses(stat.color || 'gray')}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {stat.icon && <span className="text-lg">{stat.icon}</span>}
                <span className="text-sm font-medium text-gray-600">{stat.label}</span>
              </div>
              {showTrends && stat.change !== undefined && (
                <div className="flex items-center space-x-1">
                  {getChangeIcon(stat.changeType)}
                  <span className={`text-xs font-medium ${getChangeColor(stat.changeType)}`}>
                    {formatChange(stat.change, stat.changeType)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{stat.value}</span>
              {showTrends && stat.changeType && (
                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                  stat.changeType === 'increase' ? 'bg-green-100 text-green-700' :
                  stat.changeType === 'decrease' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {stat.changeType === 'increase' ? 'Up' : 
                   stat.changeType === 'decrease' ? 'Down' : 'Stable'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Live Data</span>
            </span>
            <span>{animatedStats.length} metrics</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
          View Details
        </button>
        <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
          Export Data
        </button>
        <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
          Configure Alerts
        </button>
      </div>
    </div>
  );
};

export default QuickStatsOverview;