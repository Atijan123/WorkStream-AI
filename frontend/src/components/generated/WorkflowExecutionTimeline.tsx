import React from 'react';

interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: 'success' | 'error' | 'running';
  startTime: Date;
  duration?: number;
  message?: string;
}

interface WorkflowExecutionTimelineProps {
  title?: string;
  executions?: WorkflowExecution[];
  maxItems?: number;
}

/**
 * I want a timeline view that shows recent workflow executions with their status, duration, and any error messages
 * Generated component based on natural language request
 */
export const WorkflowExecutionTimeline: React.FC<WorkflowExecutionTimelineProps> = ({ 
  title = "Workflow Execution Timeline",
  maxItems = 8,
  executions = [
    {
      id: '1',
      workflowName: 'Daily Sales Report',
      status: 'success',
      startTime: new Date(Date.now() - 10 * 60 * 1000),
      duration: 2340,
      message: 'Report generated and emailed successfully'
    },
    {
      id: '2',
      workflowName: 'System Health Check',
      status: 'success',
      startTime: new Date(Date.now() - 25 * 60 * 1000),
      duration: 1200,
      message: 'All systems operational'
    },
    {
      id: '3',
      workflowName: 'Data Backup',
      status: 'running',
      startTime: new Date(Date.now() - 5 * 60 * 1000),
      message: 'Backing up database...'
    },
    {
      id: '4',
      workflowName: 'Email Campaign',
      status: 'error',
      startTime: new Date(Date.now() - 45 * 60 * 1000),
      duration: 890,
      message: 'SMTP connection failed'
    },
    {
      id: '5',
      workflowName: 'Log Cleanup',
      status: 'success',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      duration: 5600,
      message: 'Cleaned up 2.3GB of old logs'
    }
  ]
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'running':
        return (
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        );
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'running':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="p-4 border-gray-200 bg-white max-w-lg border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="space-y-4">
        {executions.slice(0, maxItems).map((execution, index) => (
          <div key={execution.id} className="relative">
            {/* Timeline line */}
            {index < executions.length - 1 && index < maxItems - 1 && (
              <div className="absolute left-1.5 top-6 w-0.5 h-8 bg-gray-200"></div>
            )}
            
            <div className="flex items-start space-x-3">
              {/* Status icon */}
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(execution.status)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {execution.workflowName}
                  </h4>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTimestamp(execution.startTime)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs font-medium capitalize ${getStatusColor(execution.status)}`}>
                    {execution.status}
                  </span>
                  {execution.duration && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {formatDuration(execution.duration)}
                      </span>
                    </>
                  )}
                </div>
                
                {execution.message && (
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {execution.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {executions.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-sm mt-2">No workflow executions found</p>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          View execution history →
        </button>
      </div>
    </div>
  );
};

export default WorkflowExecutionTimeline;