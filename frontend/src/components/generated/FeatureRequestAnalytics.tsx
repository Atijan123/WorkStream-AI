import React from 'react';

interface FeatureRequestAnalyticsProps {
  title?: string;
  stats?: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

/**
 * I want an analytics dashboard that shows feature request statistics with completion rates and trends
 * Generated component based on natural language request
 */
export const FeatureRequestAnalytics: React.FC<FeatureRequestAnalyticsProps> = ({ 
  title = "Feature Request Analytics",
  stats = {
    total: 24,
    pending: 5,
    processing: 3,
    completed: 14,
    failed: 2
  }
}) => {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const successRate = stats.total > 0 ? Math.round((stats.completed / (stats.completed + stats.failed)) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressWidth = (value: number, total: number) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  return (
    <div className="p-4 border-gray-200 bg-white max-w-md border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-600">Total Requests</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
          <div className="text-sm text-green-600">Completion Rate</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Status Breakdown</h4>
        <div className="space-y-2">
          {[
            { label: 'Completed', value: stats.completed, status: 'completed' },
            { label: 'Pending', value: stats.pending, status: 'pending' },
            { label: 'Processing', value: stats.processing, status: 'processing' },
            { label: 'Failed', value: stats.failed, status: 'failed' }
          ].map(({ label, value, status }) => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                  {label}
                </span>
                <span className="text-sm text-gray-600">{value}</span>
              </div>
              <div className="flex-1 mx-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${status === 'completed' ? 'bg-green-500' : 
                      status === 'processing' ? 'bg-purple-500' : 
                      status === 'pending' ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{ width: `${getProgressWidth(value, stats.total)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Key Metrics</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Success Rate</span>
            <span className="text-sm font-medium text-green-600">{successRate}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Active Requests</span>
            <span className="text-sm font-medium text-purple-600">{stats.pending + stats.processing}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg. Processing Time</span>
            <span className="text-sm font-medium text-gray-600">2.3 days</span>
          </div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-green-700 font-medium">+15% this week</span>
        </div>
        <p className="text-xs text-green-600 mt-1">Feature completion rate is trending up</p>
      </div>
    </div>
  );
};

export default FeatureRequestAnalytics;