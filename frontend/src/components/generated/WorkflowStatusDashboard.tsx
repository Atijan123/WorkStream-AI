import React, { useState, useEffect } from 'react';

interface WorkflowStatus {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error' | 'completed';
  lastRun?: Date;
  nextRun?: Date;
  successRate: number;
  executionCount: number;
  averageDuration: number;
}

interface WorkflowStatusDashboardProps {
  title?: string;
  workflows?: WorkflowStatus[];
  refreshInterval?: number;
  showMetrics?: boolean;
}

/**
 * I want a workflow status dashboard that shows all workflows with their current status, execution metrics, and next scheduled runs
 * Generated component based on natural language request
 */
export const WorkflowStatusDashboard: React.FC<WorkflowStatusDashboardProps> = ({ 
  title = "Workflow Status Dashboard",
  refreshInterval = 30000,
  showMetrics = true,
  workflows = [
    {
      id: '1',
      name: 'Daily Sales Report',
      status: 'active',
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
      successRate: 98.5,
      executionCount: 247,
      averageDuration: 2340
    },
    {
      id: '2',
      name: 'System Health Check',
      status: 'active',
      lastRun: new Date(Date.now() - 15 * 60 * 1000),
      nextRun: new Date(Date.now() + 45 * 60 * 1000),
      successRate: 100,
      executionCount: 1440,
      averageDuration: 890
    },
    {
      id: '3',
      name: 'Data Backup',
      status: 'paused',
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
      successRate: 95.2,
      executionCount: 30,
      averageDuration: 45000
    },
    {
      id: '4',
      name: 'Email Notifications',
      status: 'error',
      lastRun: new Date(Date.now() - 3 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 1 * 60 * 60 * 1000),
      successRate: 87.3,
      executionCount: 156,
      averageDuration: 1200
    },
    {
      id: '5',
      name: 'Log Cleanup',
      status: 'completed',
      lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000),
      successRate: 100,
      executionCount: 12,
      averageDuration: 5600
    }
  ]
}) => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [sortField, setSortField] = useState<keyof WorkflowStatus>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        );
      case 'paused':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatNextRun = (date?: Date) => {
    if (!date) return 'Not scheduled';
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Starting soon';
    if (diffMins < 60) return `In ${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `In ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `In ${diffDays}d`;
  };

  const handleSort = (field: keyof WorkflowStatus) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  };

  const filteredWorkflows = workflows.filter(workflow => 
    filterStatus === 'all' || workflow.status === filterStatus
  );

  const sortedWorkflows = [...filteredWorkflows].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined || bValue === undefined) return 0;
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const statusCounts = workflows.reduce((acc, workflow) => {
    acc[workflow.status] = (acc[workflow.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 border-gray-200 bg-white border rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      {showMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className={`p-3 rounded-lg border ${getStatusColor(status)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{status}</span>
                {getStatusIcon(status)}
              </div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Workflows</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="error">Error</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Manage Workflows →
        </button>
      </div>

      {/* Workflows Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th 
                className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('name')}
              >
                Workflow Name
                {sortField === 'name' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                Status
                {sortField === 'status' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Last Run</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Next Run</th>
              {showMetrics && (
                <>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('successRate')}
                  >
                    Success Rate
                    {sortField === 'successRate' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Duration</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedWorkflows.map((workflow) => (
              <tr key={workflow.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(workflow.status)}
                    <span className="font-medium text-gray-900">{workflow.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                    {workflow.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {workflow.lastRun ? formatRelativeTime(workflow.lastRun) : 'Never'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {formatNextRun(workflow.nextRun)}
                </td>
                {showMetrics && (
                  <>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              workflow.successRate >= 95 ? 'bg-green-500' :
                              workflow.successRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${workflow.successRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 min-w-0">
                          {workflow.successRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDuration(workflow.averageDuration)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedWorkflows.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No workflows found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterStatus === 'all' ? 'No workflows have been created yet.' : `No ${filterStatus} workflows found.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkflowStatusDashboard;