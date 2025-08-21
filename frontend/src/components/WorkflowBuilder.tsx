import React, { useState, useEffect, useCallback } from 'react';
import { Workflow } from '../types';
import { apiService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../contexts/ToastContext';

interface WorkflowBuilderProps {
  onCreateWorkflow?: (description: string) => Promise<void>;
  existingWorkflows?: Workflow[];
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  onCreateWorkflow,
  existingWorkflows: propWorkflows
}) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>(propWorkflows || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // WebSocket event handler for dashboard data updates
  const handleDashboardDataUpdate = useCallback((data: { type: 'workflows' | 'features' | 'metrics'; data: any }) => {
    if (data.type === 'workflows' && Array.isArray(data.data)) {
      setWorkflows(data.data);
    }
  }, []);

  // WebSocket connection
  useWebSocket({
    onDashboardDataUpdate: handleDashboardDataUpdate
  });

  useEffect(() => {
    if (!propWorkflows) {
      loadWorkflows();
    }
  }, [propWorkflows]);

  // Ensure workflows is always an array
  const safeWorkflows = workflows || [];

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const workflowData = await apiService.getWorkflows();
      setWorkflows(workflowData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError('Please enter a workflow description');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      if (onCreateWorkflow) {
        await onCreateWorkflow(description.trim());
        showSuccess('Workflow Request Submitted', 'Your workflow creation request has been submitted successfully!');
        setDescription('');
        
        // Reload workflows after creation
        if (!propWorkflows) {
          await loadWorkflows();
        }
      } else {
        // Use the automate_workflow hook to process natural language
        const result = await apiService.automateWorkflow(description.trim());
        
        if (result.success) {
          showSuccess('Workflow Created', `Workflow created successfully: ${result.message}`);
          setDescription('');
          
          // Reload workflows after creation
          if (!propWorkflows) {
            await loadWorkflows();
          }
        } else {
          throw new Error(result.message || 'Failed to create workflow');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workflow';
      setError(errorMessage);
      showError('Workflow Creation Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggerDisplay = (trigger: Workflow['trigger']) => {
    if (trigger.type === 'cron' && trigger.schedule) {
      return `Cron: ${trigger.schedule}`;
    }
    return trigger.type.charAt(0).toUpperCase() + trigger.type.slice(1);
  };

  return (
    <div className="space-y-8">
      {/* Workflow Creation Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Create New Workflow
        </h2>
        <p className="text-gray-600 mb-6">
          Describe your workflow in natural language. For example: "Send me a daily email with sales data at 9 AM" or "Check system health every hour and log the results".
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="workflow-description" className="block text-sm font-medium text-gray-700 mb-2">
              Workflow Description
            </label>
            <textarea
              id="workflow-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you want your workflow to do..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              disabled={isSubmitting}
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating Workflow...' : 'Create Workflow'}
          </button>
        </form>
      </div>

      {/* Existing Workflows */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Existing Workflows
          </h2>
          {!propWorkflows && (
            <button
              onClick={loadWorkflows}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          )}
        </div>
        
        {isLoading && !safeWorkflows.length ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading workflows...</p>
          </div>
        ) : safeWorkflows.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No workflows found. Create your first workflow above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {safeWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {workflow.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{workflow.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        <strong>Trigger:</strong> {getTriggerDisplay(workflow.trigger)}
                      </span>
                      <span>
                        <strong>Actions:</strong> {workflow.actions?.length || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={() => {
                        // TODO: Implement workflow editing
                        console.log('Edit workflow:', workflow.id);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      onClick={() => {
                        // TODO: Implement workflow deletion
                        console.log('Delete workflow:', workflow.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {workflow.actions && workflow.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Actions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {workflow.actions.map((action, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {action.type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;