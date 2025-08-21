import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import WorkflowBuilder from '../WorkflowBuilder';
import { apiService } from '../../services/api';
import { Workflow } from '../../types';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getWorkflows: vi.fn(),
    createWorkflow: vi.fn(),
  },
}));

const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Daily Sales Report',
    description: 'Generate and email daily sales report',
    trigger: {
      type: 'cron',
      schedule: '0 8 * * *'
    },
    actions: [
      { type: 'fetch_data', parameters: { source: 'sales_db' } },
      { type: 'generate_report', parameters: { format: 'pdf' } },
      { type: 'send_email', parameters: { to: 'sales@company.com' } }
    ],
    status: 'active'
  },
  {
    id: '2',
    name: 'System Health Check',
    description: 'Check system health metrics',
    trigger: {
      type: 'cron',
      schedule: '0 * * * *'
    },
    actions: [
      { type: 'check_system_metrics', parameters: {} },
      { type: 'log_result', parameters: {} }
    ],
    status: 'active'
  }
];

describe('WorkflowBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Workflow Creation Form', () => {
    it('renders the workflow creation form', () => {
      render(<WorkflowBuilder />);
      
      expect(screen.getByText('Create New Workflow')).toBeInTheDocument();
      expect(screen.getByLabelText('Workflow Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Workflow' })).toBeInTheDocument();
    });

    it('shows placeholder text in the textarea', () => {
      render(<WorkflowBuilder />);
      
      const textarea = screen.getByPlaceholderText('Describe what you want your workflow to do...');
      expect(textarea).toBeInTheDocument();
    });

    it('submit button is enabled by default', () => {
      render(<WorkflowBuilder />);
      
      const submitButton = screen.getByRole('button', { name: 'Create Workflow' });
      expect(submitButton).not.toBeDisabled();
    });

    it('submit button remains enabled when description is provided', () => {
      render(<WorkflowBuilder />);
      
      const textarea = screen.getByLabelText('Workflow Description');
      const submitButton = screen.getByRole('button', { name: 'Create Workflow' });
      
      fireEvent.change(textarea, { target: { value: 'Send daily email report' } });
      
      expect(submitButton).not.toBeDisabled();
    });

    it('shows error when submitting empty description', async () => {
      render(<WorkflowBuilder />);
      
      const textarea = screen.getByLabelText('Workflow Description');
      const submitButton = screen.getByRole('button', { name: 'Create Workflow' });
      
      // Add some text then remove it
      fireEvent.change(textarea, { target: { value: 'test' } });
      fireEvent.change(textarea, { target: { value: '' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a workflow description')).toBeInTheDocument();
      });
    });

    it('calls onCreateWorkflow prop when provided', async () => {
      const mockOnCreateWorkflow = vi.fn().mockResolvedValue(undefined);
      render(<WorkflowBuilder onCreateWorkflow={mockOnCreateWorkflow} />);
      
      const textarea = screen.getByLabelText('Workflow Description');
      const submitButton = screen.getByRole('button', { name: 'Create Workflow' });
      
      fireEvent.change(textarea, { target: { value: 'Send daily email report' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnCreateWorkflow).toHaveBeenCalledWith('Send daily email report');
      });
    });

    it('shows success message after successful submission', async () => {
      const mockOnCreateWorkflow = vi.fn().mockResolvedValue(undefined);
      render(<WorkflowBuilder onCreateWorkflow={mockOnCreateWorkflow} />);
      
      const textarea = screen.getByLabelText('Workflow Description');
      const submitButton = screen.getByRole('button', { name: 'Create Workflow' });
      
      fireEvent.change(textarea, { target: { value: 'Send daily email report' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Workflow creation request submitted successfully!')).toBeInTheDocument();
      });
    });

    it('clears form after successful submission', async () => {
      const mockOnCreateWorkflow = vi.fn().mockResolvedValue(undefined);
      render(<WorkflowBuilder onCreateWorkflow={mockOnCreateWorkflow} />);
      
      const textarea = screen.getByLabelText('Workflow Description') as HTMLTextAreaElement;
      const submitButton = screen.getByRole('button', { name: 'Create Workflow' });
      
      fireEvent.change(textarea, { target: { value: 'Send daily email report' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('shows error message when submission fails', async () => {
      const mockOnCreateWorkflow = vi.fn().mockRejectedValue(new Error('Network error'));
      render(<WorkflowBuilder onCreateWorkflow={mockOnCreateWorkflow} />);
      
      const textarea = screen.getByLabelText('Workflow Description');
      const submitButton = screen.getByRole('button', { name: 'Create Workflow' });
      
      fireEvent.change(textarea, { target: { value: 'Send daily email report' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      const mockOnCreateWorkflow = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<WorkflowBuilder onCreateWorkflow={mockOnCreateWorkflow} />);
      
      const textarea = screen.getByLabelText('Workflow Description');
      const submitButton = screen.getByRole('button', { name: 'Create Workflow' });
      
      fireEvent.change(textarea, { target: { value: 'Send daily email report' } });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Creating Workflow...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Existing Workflows Display', () => {
    it('renders existing workflows section', () => {
      render(<WorkflowBuilder existingWorkflows={mockWorkflows} />);
      
      expect(screen.getByText('Existing Workflows')).toBeInTheDocument();
    });

    it('displays provided workflows', () => {
      render(<WorkflowBuilder existingWorkflows={mockWorkflows} />);
      
      expect(screen.getByText('Daily Sales Report')).toBeInTheDocument();
      expect(screen.getByText('System Health Check')).toBeInTheDocument();
    });

    it('shows workflow details correctly', () => {
      render(<WorkflowBuilder existingWorkflows={mockWorkflows} />);
      
      // Check first workflow details
      expect(screen.getByText('Generate and email daily sales report')).toBeInTheDocument();
      expect(screen.getByText('Cron: 0 8 * * *')).toBeInTheDocument();
      expect(screen.getAllByText('Actions:')).toHaveLength(4); // Two for each workflow (summary + detail)
      expect(screen.getByText('3')).toBeInTheDocument(); // Actions count for first workflow
    });

    it('displays workflow status with correct styling', () => {
      const workflowsWithDifferentStatuses: Workflow[] = [
        { ...mockWorkflows[0], status: 'active' },
        { ...mockWorkflows[1], status: 'paused', id: '3' },
        { ...mockWorkflows[0], status: 'error', id: '4' }
      ];
      
      render(<WorkflowBuilder existingWorkflows={workflowsWithDifferentStatuses} />);
      
      const activeStatus = screen.getByText('active');
      const pausedStatus = screen.getByText('paused');
      const errorStatus = screen.getByText('error');
      
      expect(activeStatus).toHaveClass('bg-green-100', 'text-green-800');
      expect(pausedStatus).toHaveClass('bg-yellow-100', 'text-yellow-800');
      expect(errorStatus).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('shows action types for workflows', () => {
      render(<WorkflowBuilder existingWorkflows={mockWorkflows} />);
      
      expect(screen.getByText('fetch data')).toBeInTheDocument();
      expect(screen.getByText('generate report')).toBeInTheDocument();
      expect(screen.getByText('send email')).toBeInTheDocument();
      expect(screen.getByText('check system metrics')).toBeInTheDocument();
      expect(screen.getByText('log result')).toBeInTheDocument();
    });

    it('shows edit and delete buttons for each workflow', () => {
      render(<WorkflowBuilder existingWorkflows={mockWorkflows} />);
      
      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');
      
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });

    it('shows empty state when no workflows exist', () => {
      render(<WorkflowBuilder existingWorkflows={[]} />);
      
      expect(screen.getByText('No workflows found. Create your first workflow above!')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('loads workflows from API when no prop provided', async () => {
      vi.mocked(apiService.getWorkflows).mockResolvedValue(mockWorkflows);
      
      render(<WorkflowBuilder />);
      
      await waitFor(() => {
        expect(apiService.getWorkflows).toHaveBeenCalled();
        expect(screen.getByText('Daily Sales Report')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching workflows', () => {
      vi.mocked(apiService.getWorkflows).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockWorkflows), 100)));
      
      render(<WorkflowBuilder />);
      
      expect(screen.getByText('Loading workflows...')).toBeInTheDocument();
    });

    it('shows error when API call fails', async () => {
      vi.mocked(apiService.getWorkflows).mockRejectedValue(new Error('API Error'));
      
      render(<WorkflowBuilder />);
      
      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });

    it('refreshes workflows when refresh button is clicked', async () => {
      vi.mocked(apiService.getWorkflows).mockResolvedValue(mockWorkflows);
      
      render(<WorkflowBuilder />);
      
      await waitFor(() => {
        expect(screen.getByText('Daily Sales Report')).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      expect(apiService.getWorkflows).toHaveBeenCalledTimes(2);
    });

    it('reloads workflows after successful creation', async () => {
      vi.mocked(apiService.getWorkflows).mockResolvedValue(mockWorkflows);
      const mockOnCreateWorkflow = vi.fn().mockResolvedValue(undefined);
      
      render(<WorkflowBuilder onCreateWorkflow={mockOnCreateWorkflow} />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(apiService.getWorkflows).toHaveBeenCalledTimes(1);
      });
      
      const textarea = screen.getByLabelText('Workflow Description');
      const submitButton = screen.getByRole('button', { name: 'Create Workflow' });
      
      fireEvent.change(textarea, { target: { value: 'New workflow' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(apiService.getWorkflows).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Trigger Display', () => {
    it('displays cron trigger correctly', () => {
      const workflowWithCron: Workflow[] = [{
        ...mockWorkflows[0],
        trigger: { type: 'cron', schedule: '0 9 * * 1-5' }
      }];
      
      render(<WorkflowBuilder existingWorkflows={workflowWithCron} />);
      
      expect(screen.getByText('Cron: 0 9 * * 1-5')).toBeInTheDocument();
    });

    it('displays manual trigger correctly', () => {
      const workflowWithManual: Workflow[] = [{
        ...mockWorkflows[0],
        trigger: { type: 'manual' }
      }];
      
      render(<WorkflowBuilder existingWorkflows={workflowWithManual} />);
      
      expect(screen.getByText('Manual')).toBeInTheDocument();
    });

    it('displays event trigger correctly', () => {
      const workflowWithEvent: Workflow[] = [{
        ...mockWorkflows[0],
        trigger: { type: 'event' }
      }];
      
      render(<WorkflowBuilder existingWorkflows={workflowWithEvent} />);
      
      expect(screen.getByText('Event')).toBeInTheDocument();
    });
  });
});