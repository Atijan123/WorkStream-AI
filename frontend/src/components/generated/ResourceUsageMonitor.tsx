import React, { useState, useEffect } from 'react';

interface ResourceUsageMonitorProps {
  title?: string;
  refreshInterval?: number;
  showDetails?: boolean;
}

/**
 * I want a resource usage monitor that shows CPU, memory, and disk usage with real-time updates and alerts
 * Generated component based on natural language request
 */
export const ResourceUsageMonitor: React.FC<ResourceUsageMonitorProps> = ({ 
  title = "Resource Usage Monitor",
  refreshInterval = 5000,
  showDetails = true
}) => {
  const [resources, setResources] = useState({
    cpu: { usage: 45, trend: 'stable' },
    memory: { usage: 68, trend: 'increasing' },
    disk: { usage: 32, trend: 'stable' },
    network: { usage: 15, trend: 'decreasing' }
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLoading(true);
      // Simulate API call to get resource usage
      setTimeout(() => {
        setResources(prev => ({
          cpu: { 
            usage: Math.max(0, Math.min(100, prev.cpu.usage + (Math.random() - 0.5) * 10)),
            trend: Math.random() > 0.5 ? 'increasing' : Math.random() > 0.5 ? 'decreasing' : 'stable'
          },
          memory: { 
            usage: Math.max(0, Math.min(100, prev.memory.usage + (Math.random() - 0.5) * 8)),
            trend: Math.random() > 0.5 ? 'increasing' : Math.random() > 0.5 ? 'decreasing' : 'stable'
          },
          disk: { 
            usage: Math.max(0, Math.min(100, prev.disk.usage + (Math.random() - 0.5) * 3)),
            trend: Math.random() > 0.5 ? 'increasing' : Math.random() > 0.5 ? 'decreasing' : 'stable'
          },
          network: { 
            usage: Math.max(0, Math.min(100, prev.network.usage + (Math.random() - 0.5) * 15)),
            trend: Math.random() > 0.5 ? 'increasing' : Math.random() > 0.5 ? 'decreasing' : 'stable'
          }
        }));
        setLastUpdated(new Date());
        setIsLoading(false);
      }, 500);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-red-600 bg-red-100';
    if (usage >= 75) return 'text-yellow-600 bg-yellow-100';
    if (usage >= 50) return 'text-blue-600 bg-blue-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressBarColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 75) return 'bg-yellow-500';
    if (usage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <span className="text-red-500">↗</span>;
      case 'decreasing':
        return <span className="text-green-500">↘</span>;
      default:
        return <span className="text-gray-500">→</span>;
    }
  };

  const getAlertLevel = (usage: number) => {
    if (usage >= 90) return 'critical';
    if (usage >= 75) return 'warning';
    return 'normal';
  };

  const criticalResources = Object.entries(resources).filter(([_, data]) => data.usage >= 90);
  const warningResources = Object.entries(resources).filter(([_, data]) => data.usage >= 75 && data.usage < 90);

  return (
    <div className="p-4 border-gray-200 bg-white max-w-lg border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          )}
          <span className="text-xs text-gray-500">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Alert Summary */}
      {(criticalResources.length > 0 || warningResources.length > 0) && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-yellow-800">
              {criticalResources.length > 0 
                ? `${criticalResources.length} critical alert${criticalResources.length > 1 ? 's' : ''}`
                : `${warningResources.length} warning${warningResources.length > 1 ? 's' : ''}`
              }
            </span>
          </div>
        </div>
      )}

      {/* Resource Usage Cards */}
      <div className="space-y-3">
        {Object.entries(resources).map(([resource, data]) => (
          <div key={resource} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {resource === 'cpu' ? 'CPU' : resource.charAt(0).toUpperCase() + resource.slice(1)}
                </span>
                {getTrendIcon(data.trend)}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUsageColor(data.usage)}`}>
                  {Math.round(data.usage)}%
                </span>
                {getAlertLevel(data.usage) !== 'normal' && (
                  <span className="text-xs text-red-600 font-medium">
                    {getAlertLevel(data.usage).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(data.usage)}`}
                style={{ width: `${data.usage}%` }}
              ></div>
            </div>
            
            {showDetails && (
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>Trend: {data.trend}</span>
                <span>
                  {resource === 'cpu' && 'Cores: 8'}
                  {resource === 'memory' && 'Total: 16GB'}
                  {resource === 'disk' && 'Total: 500GB'}
                  {resource === 'network' && 'Speed: 1Gbps'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-between items-center">
        <button 
          onClick={() => window.location.reload()}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh Now
        </button>
        <div className="flex space-x-2">
          <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            View Details
          </button>
          <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
            Configure Alerts
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>Auto-refresh: {refreshInterval / 1000}s</span>
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${criticalResources.length > 0 ? 'bg-red-500' : warningResources.length > 0 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          <span>
            {criticalResources.length > 0 ? 'Critical' : warningResources.length > 0 ? 'Warning' : 'Healthy'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResourceUsageMonitor;