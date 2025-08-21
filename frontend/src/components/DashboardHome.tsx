import React, { useState, useEffect, useCallback } from 'react';
import { DashboardData, Workflow, WorkflowStatus } from '../types';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../contexts/ToastContext';
import { useErrorHandler } from '../services/errorHandler';
import { usePerformanceMonitor } from '../services/performanceMonitor';
import SalesOverview from './generated/SalesOverview';
import TaskBoard from './generated/TaskBoard';
import WorkflowTimeline from './generated/WorkflowTimeline';
import RealTimeActivityFeed from './generated/RealTimeActivityFeed';
import FeatureRequestAnalytics from './generated/FeatureRequestAnalytics';
import WorkflowExecutionTimeline from './generated/WorkflowExecutionTimeline';

interface DashboardHomeProps {
  widgets?: React.ReactNode[];
  activeWorkflows?: WorkflowStatus[];
  recentChanges?: any[];
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  widgets = [],
  recentChanges = []
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const { showSuccess, showError } = useToast();
  const { handleError } = useErrorHandler();
  const { measureAsync } = usePerformanceMonitor();

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [dashData, workflowsData] = await measureAsync(
        'dashboard_data_fetch',
        async () => Promise.all([
          apiService.getDashboardData(),
          apiService.getWorkflows()
        ]),
        { component: 'DashboardHome' }
      );
      
      setDashboardData(dashData);
      setWorkflows(workflowsData);
      setLastUpdated(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch dashboard data');
      setError(error.message);
      handleError(error, { 
        component: 'DashboardHome', 
        action: 'fetchDashboardData' 
      }, false); // Don't show toast since we show error in UI
    } finally {
      setLoading(false);
    }
  }, [measureAsync, handleError]);

  // WebSocket event handlers
  const handleWorkflowStatusUpdate = useCallback((data: { workflowId: string; status: string; message?: string }) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === data.workflowId 
        ? { ...workflow, status: data.status as any }
        : workflow
    ));
    setLastUpdated(new Date());
    
    // Show toast notification for workflow status changes
    if (data.message) {
      if (data.status === 'error') {
        showError('Workflow Error', `${workflows.find(w => w.id === data.workflowId)?.name || 'Workflow'}: ${data.message}`);
      } else if (data.status === 'completed') {
        showSuccess('Workflow Completed', `${workflows.find(w => w.id === data.workflowId)?.name || 'Workflow'} completed successfully`);
      }
    }
  }, [workflows, showError, showSuccess]);

  const handleFeatureRequestUpdate = useCallback((_data: { requestId: string; status: string; message?: string }) => {
    // Refresh dashboard data when feature requests are updated
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSystemMetricsUpdate = useCallback((data: { cpuUsage: number; memoryUsage: number; timestamp: Date }) => {
    setDashboardData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        systemMetrics: {
          ...prev.systemMetrics,
          latest: {
            cpu_usage: data.cpuUsage,
            memory_usage: data.memoryUsage,
            timestamp: data.timestamp
          }
        }
      };
    });
    setLastUpdated(new Date());
  }, []);

  const handleDashboardDataUpdate = useCallback((data: { type: 'workflows' | 'features' | 'metrics'; data: any }) => {
    switch (data.type) {
      case 'workflows':
        setWorkflows(data.data);
        break;
      case 'features':
        setDashboardData(prev => prev ? { ...prev, ...data.data } : null);
        break;
      case 'metrics':
        setDashboardData(prev => prev ? { ...prev, systemMetrics: data.data } : null);
        break;
    }
    setLastUpdated(new Date());
  }, []);

  // WebSocket connection
  const { connectionError, reconnect } = useWebSocket({
    onWorkflowStatusUpdate: handleWorkflowStatusUpdate,
    onFeatureRequestUpdate: handleFeatureRequestUpdate,
    onSystemMetricsUpdate: handleSystemMetricsUpdate,
    onDashboardDataUpdate: handleDashboardDataUpdate,
    onConnect: () => setConnectionStatus('connected'),
    onDisconnect: () => setConnectionStatus('disconnected'),
    onError: () => setConnectionStatus('error')
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Fallback polling every 60 seconds (reduced frequency since we have WebSocket)
    const interval = setInterval(fetchDashboardData, 60000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with last updated info and connection status */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-xs text-gray-500">
              {connectionStatus === 'connected' ? 'Live' : 
               connectionStatus === 'error' ? 'Error' : 'Offline'}
            </span>
            {connectionStatus !== 'connected' && (
              <button
                onClick={reconnect}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="Reconnect"
              >
                Reconnect
              </button>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            Last updated: {formatTimestamp(lastUpdated)}
            <button
              onClick={fetchDashboardData}
              className="ml-2 text-blue-600 hover:text-blue-800"
              title="Refresh data"
            >
              ↻
            </button>
          </div>
        </div>
      </div>

      {/* Connection Error Alert */}
      {connectionError && connectionStatus === 'error' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Real-time updates unavailable</h3>
              <p className="mt-1 text-sm text-yellow-700">
                WebSocket connection failed: {connectionError}. Data will be updated via polling.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generated Components Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <SalesOverview />
        <TaskBoard />
        <WorkflowTimeline />
        <RealTimeActivityFeed />
        {dashboardData && (
          <FeatureRequestAnalytics stats={dashboardData.featureRequestStats} />
        )}
        <WorkflowExecutionTimeline />
      </div>

      {/* Widgets Section */}
      {widgets.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Widgets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((widget, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                {widget}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Metrics */}
      {dashboardData?.systemMetrics && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.systemMetrics.latest && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700">Current Status</h4>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CPU:</span>
                    <span className="text-sm font-medium">{dashboardData.systemMetrics.latest.cpu_usage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Memory:</span>
                    <span className="text-sm font-medium">{dashboardData.systemMetrics.latest.memory_usage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
            
            {dashboardData.systemMetrics.averageLast24Hours && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700">24h Average</h4>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CPU:</span>
                    <span className="text-sm font-medium">{dashboardData.systemMetrics.averageLast24Hours.cpu_usage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Memory:</span>
                    <span className="text-sm font-medium">{dashboardData.systemMetrics.averageLast24Hours.memory_usage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Metrics History</h4>
              <div className="mt-2 text-sm text-gray-600">
                {dashboardData.systemMetrics.recentHistory.length} recent entries
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Workflows */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Active Workflows</h3>
        {workflows.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No workflows found</p>
        ) : (
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{workflow.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Trigger: {workflow.trigger.type}</span>
                      {workflow.trigger.schedule && (
                        <span>Schedule: {workflow.trigger.schedule}</span>
                      )}
                      <span>Actions: {workflow.actions.length}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                    {workflow.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feature Requests */}
      {dashboardData && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Feature Requests</h3>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{dashboardData.featureRequestStats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dashboardData.featureRequestStats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{dashboardData.featureRequestStats.processing}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dashboardData.featureRequestStats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{dashboardData.featureRequestStats.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>

          {/* Recent requests */}
          {dashboardData.recentFeatureRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No feature requests found</p>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentFeatureRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{request.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(request.timestamp)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Changes / Evolution Logs */}
      {recentChanges.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Changes</h3>
          <div className="space-y-3">
            {recentChanges.map((change, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="text-sm text-gray-900">{change.description || 'System evolution event'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {change.timestamp ? formatTimestamp(change.timestamp) : 'Recently'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;