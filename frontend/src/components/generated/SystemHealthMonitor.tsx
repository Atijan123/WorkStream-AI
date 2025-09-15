import React, { useState, useEffect } from 'react';

interface SystemHealthData {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  lastUpdated: Date;
}

interface SystemHealthMonitorProps {
  title?: string;
  refreshInterval?: number;
  showDetails?: boolean;
}

/**
 * I want a system health monitor widget that shows real-time CPU, memory, disk usage with status indicators
 * Generated component based on natural language request
 */
export const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({ 
  title = "System Health Monitor",
  refreshInterval = 30000,
  showDetails = true
}) => {
  const [healthData, setHealthData] = useState<SystemHealthData>({
    cpu: 45.2,
    memory: 68.7,
    disk: 72.3,
    network: 12.5,
    status: 'healthy',
    uptime: '5d 12h 34m',
    lastUpdated: new Date()
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate API call to get real system metrics
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate realistic fluctuating data
        const newData: SystemHealthData = {
          cpu: Math.max(0, Math.min(100, healthData.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.max(0, Math.min(100, healthData.memory + (Math.random() - 0.5) * 5)),
          disk: Math.max(0, Math.min(100, healthData.disk + (Math.random() - 0.5) * 2)),
          network: Math.max(0, Math.min(100, Math.random() * 50)),
          status: 'healthy',
          uptime: '5d 12h 34m',
          lastUpdated: new Date()
        };

        // Determine status based on metrics
        if (newData.cpu > 90 || newData.memory > 90 || newData.disk > 95) {
          newData.status = 'critical';
        } else if (newData.cpu > 75 || newData.memory > 80 || newData.disk > 85) {
          newData.status = 'warning';
        }

        setHealthData(newData);
      } catch (err) {
        setError('Failed to fetch system health data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
    const interval = setInterval(fetchHealthData, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'critical':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage > 90) return 'bg-red-500';
    if (usage > 75) return 'bg-yellow-500';
    if (usage > 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div className="p-4 border-gray-200 bg-white max-w-md border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.status)}`}>
            {getStatusIcon(healthData.status)}
            <span className="ml-1 capitalize">{healthData.status}</span>
          </span>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="ml-2 text-sm text-red-700">{error}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* System Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'CPU', value: healthData.cpu, icon: '🖥️' },
              { label: 'Memory', value: healthData.memory, icon: '💾' },
              { label: 'Disk', value: healthData.disk, icon: '💿' },
              { label: 'Network', value: healthData.network, icon: '🌐' }
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">{icon}</span>
                    <span className="text-xs font-medium text-gray-600">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{value.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(value)}`}
                    style={{ width: `${Math.min(100, value)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {showDetails && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-gray-600">Uptime:</span>
                    <span className="ml-1 font-medium text-gray-900">{healthData.uptime}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Updated {formatLastUpdated(healthData.lastUpdated)}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex space-x-2">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                Refresh
              </button>
              <button className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthMonitor;