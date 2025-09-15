import React, { useState } from 'react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  category: 'system' | 'workflow' | 'data' | 'settings';
  disabled?: boolean;
}

interface QuickActionsPanelProps {
  title?: string;
  onActionExecuted?: (actionId: string) => void;
}

/**
 * Quick actions panel for common dashboard operations
 * Generated component for first request functionality
 */
export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ 
  title = "Quick Actions",
  onActionExecuted 
}) => {
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);

  const executeAction = async (action: QuickAction) => {
    if (executingAction) return;
    
    setExecutingAction(action.id);
    
    try {
      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, 1500));
      action.action();
      setLastExecuted(action.id);
      onActionExecuted?.(action.id);
      
      // Clear the "last executed" indicator after 3 seconds
      setTimeout(() => {
        if (lastExecuted === action.id) {
          setLastExecuted(null);
        }
      }, 3000);
    } catch (error) {
      console.error('Action execution failed:', error);
    } finally {
      setExecutingAction(null);
    }
  };

  const actions: QuickAction[] = [
    {
      id: 'refresh-data',
      title: 'Refresh Data',
      description: 'Update all dashboard metrics',
      icon: '🔄',
      category: 'data',
      action: () => console.log('Refreshing dashboard data...')
    },
    {
      id: 'run-health-check',
      title: 'Health Check',
      description: 'Run system diagnostics',
      icon: '🏥',
      category: 'system',
      action: () => console.log('Running health check...')
    },
    {
      id: 'backup-data',
      title: 'Backup Data',
      description: 'Create system backup',
      icon: '💾',
      category: 'data',
      action: () => console.log('Creating backup...')
    },
    {
      id: 'clear-cache',
      title: 'Clear Cache',
      description: 'Clear application cache',
      icon: '🧹',
      category: 'system',
      action: () => console.log('Clearing cache...')
    },
    {
      id: 'export-logs',
      title: 'Export Logs',
      description: 'Download system logs',
      icon: '📋',
      category: 'data',
      action: () => console.log('Exporting logs...')
    },
    {
      id: 'restart-services',
      title: 'Restart Services',
      description: 'Restart background services',
      icon: '⚡',
      category: 'system',
      action: () => console.log('Restarting services...')
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system':
        return 'bg-blue-100 text-blue-800';
      case 'workflow':
        return 'bg-purple-100 text-purple-800';
      case 'data':
        return 'bg-green-100 text-green-800';
      case 'settings':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionStatus = (actionId: string) => {
    if (executingAction === actionId) {
      return 'executing';
    }
    if (lastExecuted === actionId) {
      return 'completed';
    }
    return 'idle';
  };

  return (
    <div className="p-4 border-gray-200 bg-white border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs text-gray-500">
          {actions.length} actions available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action) => {
          const status = getActionStatus(action.id);
          const isExecuting = status === 'executing';
          const isCompleted = status === 'completed';
          
          return (
            <button
              key={action.id}
              onClick={() => executeAction(action)}
              disabled={action.disabled || isExecuting}
              className={`p-3 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                isCompleted 
                  ? 'border-green-300 bg-green-50' 
                  : isExecuting 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{action.icon}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(action.category)}`}>
                  {action.category}
                </span>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                {action.title}
                {isExecuting && (
                  <svg className="animate-spin ml-2 h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isCompleted && (
                  <svg className="ml-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </h4>
              
              <p className="text-sm text-gray-600">{action.description}</p>
              
              {isExecuting && (
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  Executing...
                </div>
              )}
              
              {isCompleted && (
                <div className="mt-2 text-xs text-green-600 font-medium">
                  Completed ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Action History */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {executingAction ? 'Action in progress...' : 'Ready for actions'}
          </span>
          <span>
            Last action: {lastExecuted ? actions.find(a => a.id === lastExecuted)?.title || 'Unknown' : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel;