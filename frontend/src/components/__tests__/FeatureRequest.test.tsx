import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import FeatureRequest from '../FeatureRequest';
import { apiService } from '../../services/api';
import { FeatureRequest as FeatureRequestType } from '../../types';

// Mock the API service
vi.mock('../../services/api');
const mockApiService = apiService as any;

// Mock data
const mockFeatureRequests: FeatureRequestType[] = [
  {
    id: '1',
    description: 'Add a chart showing workflow execution times',
    status: 'completed',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    generatedComponents: ['ExecutionTimeChart.tsx']
  },
  {
    id: '2',
    description: 'Create a user management interface',
    status: 'processing',
    timestamp: new Date('2024-01-16T14:30:00Z')
  },
  {
    id: '3',
    description: 'Add email notification settings',
    status: 'pending',
    timestamp: new Date('2024-01-17T09:15:00Z')
  },
  {
    id: '4',
    description: 'Failed feature request',
    status: 'failed',
    timestamp: new Date('2024-01-18T11:45:00Z')
  }
];

describe('FeatureRequest Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiService.getFeatureRequests = vi.fn().mockResolvedValue(mockFeatureRequests);
    mockApiService.submitFeatureRequest = vi.fn();
  });

  describe('Component Rendering', () => {
    it('renders the component with all main sections', async () => {
      render(<FeatureRequest />);

      expect(screen.getByText('Feature Requests')).toBeInTheDocument();
      expect(screen.getByText('Submit New Feature Request')).toBeInTheDocument();
      expect(screen.getByText('Request History')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Example: I want a chart/)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Add a chart showing workflow execution times')).toBeInTheDocument();
      });
    });

    it('displays loading state while fetching requests', () => {
      mockApiService.getFeatureRequests.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<FeatureRequest />);
      
      expect(screen.getByText('Loading requests...')).toBeInTheDocument();
    });

    it('displays empty state when no requests exist', async () => {
      mockApiService.getFeatureRequests.mockResolvedValue([]);
      
      render(<FeatureRequest />);
      
      await waitFor(() => {
        expect(screen.getByText('No requests found')).toBeInTheDocument();
        expect(screen.getByText('No feature requests have been submitted yet.')).toBeInTheDocument();
      });
    });
  });

  describe('Feature Request Form', () => {
    it('allows user to enter and submit a feature request', async () => {
      const user = userEvent.setup();
      const mockSubmittedRequest: FeatureRequestType = {
        id: '5',
        description: 'New test feature',
        status: 'pending',
        timestamp: new Date()
      };
      
      mockApiService.submitFeatureRequest.mockResolvedValue(mockSubmittedRequest);
      
      render(<FeatureRequest />);
      
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      const submitButton = screen.getByText('Submit Request');
      
      await user.type(textarea, 'New test feature');
      await user.click(submitButton);
      
      expect(mockApiService.submitFeatureRequest).toHaveBeenCalledWith('New test feature');
      
      await waitFor(() => {
        expect(screen.getByText('Feature request submitted successfully!')).toBeInTheDocument();
      });
      
      // Form should be cleared after successful submission
      expect(textarea).toHaveValue('');
    });

    it('shows character count and enforces limit', async () => {
      const user = userEvent.setup();
      render(<FeatureRequest />);
      
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      
      await user.type(textarea, 'Test');
      expect(screen.getByText('4/2000')).toBeInTheDocument();
      
      // Test that maxLength attribute is set
      expect(textarea).toHaveAttribute('maxlength', '2000');
    });

    it('validates empty input', async () => {
      render(<FeatureRequest />);
      
      const submitButton = screen.getByText('Submit Request');
      
      // Button should be disabled when input is empty
      expect(submitButton).toBeDisabled();
      
      // Try to submit anyway
      fireEvent.submit(submitButton.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a feature description')).toBeInTheDocument();
      });
      expect(mockApiService.submitFeatureRequest).not.toHaveBeenCalled();
    });

    it('validates input length', async () => {
      const user = userEvent.setup();
      render(<FeatureRequest />);
      
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      const submitButton = screen.getByText('Submit Request');
      
      // Set a value longer than 2000 characters
      const longText = 'a'.repeat(2001);
      fireEvent.change(textarea, { target: { value: longText } });
      
      await user.click(submitButton);
      
      expect(screen.getByText('Description must be less than 2000 characters')).toBeInTheDocument();
      expect(mockApiService.submitFeatureRequest).not.toHaveBeenCalled();
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockApiService.submitFeatureRequest.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<FeatureRequest />);
      
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      const submitButton = screen.getByText('Submit Request');
      
      await user.type(textarea, 'Test feature');
      await user.click(submitButton);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(textarea).toBeDisabled();
    });

    it('handles submission errors', async () => {
      const user = userEvent.setup();
      mockApiService.submitFeatureRequest.mockRejectedValue(new Error('Network error'));
      
      render(<FeatureRequest />);
      
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      const submitButton = screen.getByText('Submit Request');
      
      await user.type(textarea, 'Test feature');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('uses custom onSubmitRequest prop when provided', async () => {
      const user = userEvent.setup();
      const mockOnSubmitRequest = vi.fn().mockResolvedValue(undefined);
      
      render(<FeatureRequest onSubmitRequest={mockOnSubmitRequest} />);
      
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      const submitButton = screen.getByText('Submit Request');
      
      // Set value directly to avoid typing issues
      fireEvent.change(textarea, { target: { value: 'Custom handler test' } });
      await user.click(submitButton);
      
      expect(mockOnSubmitRequest).toHaveBeenCalledWith('Custom handler test');
      expect(mockApiService.submitFeatureRequest).not.toHaveBeenCalled();
    });

    it('respects external processing state', () => {
      render(<FeatureRequest isProcessing={true} />);
      
      const submitButton = screen.getByText('Processing...');
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      
      expect(submitButton).toBeDisabled();
      expect(textarea).toBeDisabled();
    });
  });

  describe('Request History', () => {
    it('displays all feature requests with correct information', async () => {
      render(<FeatureRequest />);
      
      await waitFor(() => {
        expect(screen.getByText('Add a chart showing workflow execution times')).toBeInTheDocument();
        expect(screen.getByText('Create a user management interface')).toBeInTheDocument();
        expect(screen.getByText('Add email notification settings')).toBeInTheDocument();
        expect(screen.getByText('Failed feature request')).toBeInTheDocument();
      });
      
      // Check status badges
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('processing')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
      
      // Check generated components info
      expect(screen.getByText('Generated: 1 components')).toBeInTheDocument();
    });

    it('filters requests by status', async () => {
      const user = userEvent.setup();
      mockApiService.getFeatureRequests
        .mockResolvedValueOnce(mockFeatureRequests) // Initial load
        .mockResolvedValueOnce([mockFeatureRequests[0]]); // Filtered load
      
      render(<FeatureRequest />);
      
      await waitFor(() => {
        expect(screen.getByText('Add a chart showing workflow execution times')).toBeInTheDocument();
      });
      
      const filterSelect = screen.getByLabelText('Filter:');
      await user.selectOptions(filterSelect, 'completed');
      
      expect(mockApiService.getFeatureRequests).toHaveBeenCalledWith('completed', 50);
    });

    it('refreshes request history when refresh button is clicked', async () => {
      const user = userEvent.setup();
      render(<FeatureRequest />);
      
      await waitFor(() => {
        expect(mockApiService.getFeatureRequests).toHaveBeenCalledTimes(1);
      });
      
      const refreshButton = screen.getByTitle('Refresh');
      await user.click(refreshButton);
      
      expect(mockApiService.getFeatureRequests).toHaveBeenCalledTimes(2);
    });

    it('handles API errors when loading requests', async () => {
      mockApiService.getFeatureRequests.mockRejectedValue(new Error('API Error'));
      
      render(<FeatureRequest />);
      
      // The component should still render, but with an error state
      // Since we don't show the error in the UI for history loading,
      // we just verify the API was called
      await waitFor(() => {
        expect(mockApiService.getFeatureRequests).toHaveBeenCalled();
      });
    });

    it('shows correct status icons', async () => {
      render(<FeatureRequest />);
      
      await waitFor(() => {
        // Check that status icons are rendered (we can't easily test the specific SVG content)
        const statusBadges = screen.getAllByText(/^(pending|processing|completed|failed)$/);
        expect(statusBadges).toHaveLength(4);
      });
    });

    it('formats timestamps correctly', async () => {
      render(<FeatureRequest />);
      
      await waitFor(() => {
        // Check that timestamps are displayed (exact format may vary by locale)
        expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
        expect(screen.getByText(/16\/01\/2024/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      render(<FeatureRequest />);
      
      const textarea = screen.getByLabelText('Describe the feature you\'d like to see');
      expect(textarea).toBeInTheDocument();
      
      const filterSelect = screen.getByLabelText('Filter:');
      expect(filterSelect).toBeInTheDocument();
    });

    it('provides proper button states for screen readers', async () => {
      const user = userEvent.setup();
      render(<FeatureRequest />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit Request' });
      expect(submitButton).toBeDisabled(); // Initially disabled due to empty input
      
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      await user.type(textarea, 'Test');
      
      expect(submitButton).toBeEnabled();
    });
  });

  describe('Integration', () => {
    it('reloads history after successful submission', async () => {
      const user = userEvent.setup();
      const mockSubmittedRequest: FeatureRequestType = {
        id: '5',
        description: 'New test feature',
        status: 'pending',
        timestamp: new Date()
      };
      
      mockApiService.submitFeatureRequest.mockResolvedValue(mockSubmittedRequest);
      
      render(<FeatureRequest />);
      
      await waitFor(() => {
        expect(mockApiService.getFeatureRequests).toHaveBeenCalledTimes(1);
      });
      
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      const submitButton = screen.getByText('Submit Request');
      
      await user.type(textarea, 'New test feature');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Feature request submitted successfully!')).toBeInTheDocument();
      });
      
      // Wait for the delayed reload
      await waitFor(() => {
        expect(mockApiService.getFeatureRequests).toHaveBeenCalledTimes(2);
      }, { timeout: 2000 });
    });
  });
});