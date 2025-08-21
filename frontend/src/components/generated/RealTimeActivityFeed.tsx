import React, { useState } from 'react';

interface RealTimeActivityFeedProps {
  title?: string;
  maxItems?: number;
}

interface ActivityItem {
  id: string;
  type: 'workflow' | 'feature_request' | 'system' | 'alert';
  message: string;
  timestamp: Date;
  status?: 'success' | 'error' | 'warning' | 'info';
}

/**
 * I want a real-time activity feed that shows recent workflow executions, feature requests, and system events
 * Generated component based on natural language request
 */
export const RealTimeActivityFeed: React.FC<RealTimeActivityFeedProps> = ({ 
  title = "Real-time Activity Feed", 
  maxItems = 10 
}) => {
  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'workflow',
      message: 'Daily Sales Report workflow completed successfully',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      status: 'success'
    },
    {
      id: '2',
      type: 'feature_request',
      message: 'New feature request: "Add user authentication system"',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'info'
    },
    {
      id: '3',
      type: 'system',
      message: 'System health check completed - All systems operational',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      status: 'success'
    },
    {
      id: '4',
      type: 'alert',
      message: 'CPU usage exceeded 80% threshold',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      status: 'warning'
    }
  ]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workflow':
        return '⚙️';
      case 'feature_request':
        return '💡';
      case 'system':
        return '🖥️';
      case 'alert':
        return '⚠️';
      default:
        return '📝';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
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
    
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="p-4 border-gray-200 bg-white max-w-lg border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.slice(0, maxItems).map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
            <div className="flex-shrink-0 text-lg">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${getStatusColor(activity.status)}`}>
                {activity.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {activities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No recent activity</p>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  );
};

export default RealTimeActivityFeed;