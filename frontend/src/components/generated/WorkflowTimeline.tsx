import React from 'react';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  status: 'success' | 'error' | 'warning' | 'info' | 'running';
  duration?: number;
  user?: string;
  metadata?: Record<string, any>;
}

interface WorkflowTimelineProps {
  title?: string;
  events?: TimelineEvent[];
  maxEvents?: number;
  showDuration?: boolean;
  showUser?: boolean;
  onEventClick?: (event: TimelineEvent) => void;
}

/**
 * Create a workflow timeline showing execution history and events
 * Generated component based on natural language request
 */
export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ 
  title = "Workflow Timeline",
  events = [
    {
      id: '1',
      title: 'Workflow Started',
      description: 'Daily sales report workflow initiated',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      status: 'info',
      user: 'System',
      duration: 0
    },
    {
      id: '2',
      title: 'Data Fetched',
      description: 'Successfully retrieved sales data from API',
      timestamp: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
      status: 'success',
      user: 'API Service',
      duration: 1200
    },
    {
      id: '3',
      title: 'Report Generated',
      description: 'PDF report created with latest sales figures',
      timestamp: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      status: 'success',
      user: 'Report Service',
      duration: 2500
    },
    {
      id: '4',
      title: 'Email Sent',
      description: 'Report delivered to stakeholders',
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      status: 'success',
      user: 'Email Service',
      duration: 800
    },
    {
      id: '5',
      title: 'Workflow Completed',
      description: 'All tasks completed successfully',
      timestamp: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
      status: 'success',
      user: 'System',
      duration: 0
    }
  ],
  maxEvents = 10,
  showDuration = true,
  showUser = true,
  onEventClick
}) => {
  const displayEvents = events.slice(0, maxEvents);

  const getStatusIcon = (status: TimelineEvent['status']) => {
    const baseClasses = 'w-4 h-4';
    
    switch (status) {
      case 'success':
        return (
          <svg className={`${baseClasses} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${baseClasses} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${baseClasses} text-yellow-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'running':
        return (
          <svg className={`${baseClasses} text-blue-500 animate-spin`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className={`${baseClasses} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return null;
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      return `${(duration / 60000).toFixed(1)}m`;
    }
  };

  const getStatusStats = () => {
    const stats = {
      success: 0,
      error: 0,
      warning: 0,
      running: 0,
      info: 0
    };

    displayEvents.forEach(event => {
      stats[event.status]++;
    });

    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="p-6 border-gray-200 bg-white border rounded-lg max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        
        {/* Status Summary */}
        <div className="flex items-center space-x-4 text-sm">
          {stats.success > 0 && (
            <span className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              {stats.success} Success
            </span>
          )}
          {stats.error > 0 && (
            <span className="flex items-center text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              {stats.error} Error
            </span>
          )}
          {stats.running > 0 && (
            <span className="flex items-center text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
              {stats.running} Running
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-4">
          {displayEvents.map((event, _index) => (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className={`
                relative flex items-start space-x-4 p-4 rounded-lg border cursor-pointer
                hover:shadow-md transition-shadow duration-200
                ${getStatusColor(event.status)}
              `}
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-300 rounded-full">
                {getStatusIcon(event.status)}
              </div>
              
              {/* Event content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {event.title}
                  </h4>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {showDuration && event.duration && (
                      <span className="bg-white px-2 py-1 rounded">
                        {formatDuration(event.duration)}
                      </span>
                    )}
                    <span>{formatTimestamp(event.timestamp)}</span>
                  </div>
                </div>
                
                {event.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {event.description}
                  </p>
                )}
                
                {showUser && event.user && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {event.user}
                  </div>
                )}
                
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    <details className="cursor-pointer">
                      <summary className="hover:text-gray-700">View details</summary>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {events.length > maxEvents && (
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Show {events.length - maxEvents} more events
            </button>
          </div>
        )}
        
        {displayEvents.length === 0 && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
            <p className="mt-1 text-sm text-gray-500">
              Workflow events will appear here as they occur.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowTimeline;