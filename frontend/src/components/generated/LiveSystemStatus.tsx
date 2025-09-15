import React, { useState, useEffect } from 'react';

interface SystemStatus {
  service: string;
  status: 'online' | 'offline' | 'warning';
  uptime: string;
  responseTime: number;
  lastCheck: Date;
}

interface LiveSystemStatusProps {
  title?: string;
  refreshInterval?: number;
}

/**
 * Live system status monitor showing real-time service health
 * Generated component for persistent monitoring needs
 */
export const LiveSystemStatus: React.FC<LiveSystemStatusProps> = ({ 
  title = "Live System Status",
  refreshInterval = 30000 
}) => {
  const [services, setServices] = useState<SystemStatus[]>([
    {
      service: 'API Server',
      status: 'online',
      uptime: '99.9%',
      responseTime: 45,
      lastCheck: new Date()
    },
    {
      service: 'Database',
      status: 'online',
      uptime: '99.8%',
      responseTime: 12,
      lastCheck: new Date()
    },
    {
      service: 'WebSocket',
      status: 'online',
      uptime: '99.7%',
      responseTime: 8,
      lastCheck: new Date()
    },
    {
      service: 'File Storage',
      status: 'warning',
      uptime: '98.5%',
      responseTime: 120,
      lastCheck: new Date()
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    
    // Simulate API call to check service status
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setServices(prev => prev.map(service => ({
      ...service,
      responseTime: Math.floor(Math.random() * 100) + 5,
      lastCheck: new Date(),
      status: Math.random() > 0.1 ? 'online' : (Math.random() > 0.5 ? 'warning' : 'offline') as any
    })));
    
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        );
      case 'warning':
        return (
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
        );
      case 'offline':
        return (
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        );
      default:
        return (
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        );
    }
  };

  const overallStatus = services.every(s => s.status === 'online') ? 'All Systems Operational' :
                       services.some(s => s.status === 'offline') ? 'System Issues Detected' :
                       'Minor Issues Detected';

  const overallStatusColor = services.every(s => s.status === 'online') ? 'text-green-600' :
                            services.some(s => s.status === 'offline') ? 'text-red-600' :
                            'text-yellow-600';

  return (
    <div className="p-4 border-gray-200 bg-white border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-2">
          {isRefreshing && (
            <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <button
            onClick={refreshStatus}
            disabled={isRefreshing}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className={`font-medium ${overallStatusColor}`}>
            {overallStatus}
          </span>
          <span className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Service List */}
      <div className="space-y-3">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              {getStatusIcon(service.status)}
              <div>
                <h4 className="font-medium text-gray-900">{service.service}</h4>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Uptime: {service.uptime}</span>
                  <span>Response: {service.responseTime}ms</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(service.status)}`}>
                {service.status}
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {service.lastCheck.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-600">
              {services.filter(s => s.status === 'online').length}
            </div>
            <div className="text-xs text-gray-500">Online</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">
              {services.filter(s => s.status === 'warning').length}
            </div>
            <div className="text-xs text-gray-500">Warning</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">
              {services.filter(s => s.status === 'offline').length}
            </div>
            <div className="text-xs text-gray-500">Offline</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSystemStatus;