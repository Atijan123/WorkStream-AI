import React, { useState, useEffect } from 'react';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  acknowledged: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertManagementPanelProps {
  title?: string;
  alerts?: Alert[];
  maxVisible?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * I want an alert management panel that shows system alerts with different severity levels and allows acknowledgment
 * Generated component based on natural language request
 */
export const AlertManagementPanel: React.FC<AlertManagementPanelProps> = ({ 
  title = "System Alerts",
  maxVisible = 10,
  autoRefresh = true,
  refreshInterval = 30000,
  alerts = [
    {
      id: '1',
      type: 'error',
      title: 'Database Connection Failed',
      message: 'Unable to connect to the primary database. Failover to backup initiated.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      source: 'Database Service',
      acknowledged: false,
      severity: 'critical'
    },
    {
      id: '2',
      type: 'warning',
      title: 'High CPU Usage',
      message: 'CPU usage has exceeded 85% for the last 10 minutes.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      source: 'System Monitor',
      acknowledged: false,
      severity: 'high'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Disk Space Low',
      message: 'Available disk space is below 15% on /var/log partition.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      source: 'Storage Monitor',
      acknowledged: true,
      severity: 'medium'
    },
    {
      id: '4',
      type: 'info',
      title: 'Scheduled Maintenance',
      message: 'System maintenance window scheduled for tonight at 2:00 AM.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      source: 'Maintenance Scheduler',
      acknowledged: false,
      severity: 'low'
    },
    {
      id: '5',
      type: 'success',
      title: 'Backup Completed',
      message: 'Daily backup completed successfully. 2.3GB backed up.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      source: 'Backup Service',
      acknowledged: true,
      severity: 'low'
    }
  ]
}) => {
  const [alertList, setAlertList] = useState<Alert[]>(alerts);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity'>('timestamp');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
        // In a real app, this would fetch new alerts from the API
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityPriority = (severity: string) => {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleAcknowledge = (alertId: string) => {
    setAlertList(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const handleDismiss = (alertId: string) => {
    setAlertList(prev => prev.filter(alert => alert.id !== alertId));
  };

  const filteredAlerts = alertList.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unacknowledged') return !alert.acknowledged;
    return alert.type === filter || alert.severity === filter;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === 'severity') {
      const severityDiff = getSeverityPriority(b.severity) - getSeverityPriority(a.severity);
      if (severityDiff !== 0) return severityDiff;
    }
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const visibleAlerts = sortedAlerts.slice(0, maxVisible);

  const alertCounts = alertList.reduce((acc, alert) => {
    acc.total++;
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    if (!alert.acknowledged) acc.unacknowledged++;
    return acc;
  }, { total: 0, unacknowledged: 0 } as Record<string, number>);

  return (
    <div className="p-6 border-gray-200 bg-white border rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-4">
          {autoRefresh && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">
                Auto-refresh ({Math.floor(refreshInterval / 1000)}s)
              </span>
            </div>
          )}
          <span className="text-xs text-gray-500">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-gray-900">{alertCounts.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-xl font-bold text-red-600">{alertCounts.error || 0}</div>
          <div className="text-xs text-gray-600">Errors</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-xl font-bold text-yellow-600">{alertCounts.warning || 0}</div>
          <div className="text-xs text-gray-600">Warnings</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-600">{alertCounts.info || 0}</div>
          <div className="text-xs text-gray-600">Info</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-600">{alertCounts.unacknowledged}</div>
          <div className="text-xs text-gray-600">Unack.</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Alerts</option>
            <option value="unacknowledged">Unacknowledged</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
            <option value="critical">Critical</option>
            <option value="high">High Priority</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'severity')}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="timestamp">Sort by Time</option>
            <option value="severity">Sort by Severity</option>
          </select>
        </div>
        
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Manage Alert Rules →
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {visibleAlerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`border rounded-lg p-4 transition-all duration-200 ${
              alert.acknowledged ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`text-sm font-medium ${alert.acknowledged ? 'text-gray-600' : 'text-gray-900'}`}>
                      {alert.title}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className={`text-sm ${alert.acknowledged ? 'text-gray-500' : 'text-gray-700'} mb-2`}>
                    {alert.message}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatTimestamp(alert.timestamp)}</span>
                    <span>Source: {alert.source}</span>
                    {alert.acknowledged && (
                      <span className="text-green-600 font-medium">✓ Acknowledged</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibleAlerts.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' ? 'All systems are running normally.' : `No ${filter} alerts found.`}
          </p>
        </div>
      )}

      {sortedAlerts.length > maxVisible && (
        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <span className="text-sm text-gray-500">
            Showing {maxVisible} of {sortedAlerts.length} alerts
          </span>
          <button className="ml-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all alerts →
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertManagementPanel;