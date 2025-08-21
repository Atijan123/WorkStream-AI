import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../contexts/ToastContext';
import { apiService } from '../../services/api';
import App from '../../App';
import DashboardHome from '../../components/DashboardHome';
import FeatureRequest from '../../components/FeatureRequest';
import WorkflowBuilder from '../../components/WorkflowBuilder';

// Mock the API service
jest.mock('../../services/api');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock WebSocket hook
jest.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    connectionError: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    reconnect: jest.fn(),
    socket: null
  })
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        {component}
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('Critical User Journeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Feature Request to Working Feature Journey', () => {
    it('should allow user to submit feature request and see it processed', async () => {
      const user = userEvent.setup();
      
      // Mock API responses
      mockApiService.getFeatureRequests.mockResolvedValue([]);
      mockApiService.evolveUI.mockResolvedValue({
        success: true,
        message: 'Successfully generated 1 component',
        generatedFiles: ['SalesChart.tsx']
      });

      renderWithProviders(<FeatureRequest />);

      // User sees the feature request form
      expect(screen.getByText('Submit New Feature Request')).toBeInTheDocument();
      
      // User enters a feature request
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      await user.type(textarea, 'I want a sales chart that shows monthly revenue');

      // User submits the request
      const submitButton = screen.getByRole('button', { name: /Submit Request/ });
      await user.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(mockApiService.evolveUI).toHaveBeenCalledWith('I want a sales chart that shows monthly revenue', undefined);
      });

      // User should see success feedback
      expect(screen.getByText(/Processing.../)).toBeInTheDocument();
    });

    it('should handle feature request errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockApiService.getFeatureRequests.mockResolvedValue([]);
      mockApiService.evolveUI.mockRejectedValue(new Error('Failed to process request'));

      renderWithProviders(<FeatureRequest />);

      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      await user.type(textarea, 'Invalid request');

      const submitButton = screen.getByRole('button', { name: /Submit Request/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to process request/)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Creation Journey', () => {
    it('should allow user to create workflow using natural language', async () => {
      const user = userEvent.setup();
      
      mockApiService.getWorkflows.mockResolvedValue([]);
      mockApiService.automateWorkflow.mockResolvedValue({
        success: true,
        message: 'Daily sales report workflow created'
      });

      renderWithProviders(<WorkflowBuilder />);

      // User sees the workflow creation form
      expect(screen.getByText('Create New Workflow')).toBeInTheDocument();
      
      // User enters workflow description
      const textarea = screen.getByPlaceholderText(/Describe what you want your workflow to do/);
      await user.type(textarea, 'Send me a daily email with sales data at 9 AM');

      // User submits the workflow
      const submitButton = screen.getByRole('button', { name: /Create Workflow/ });
      await user.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(mockApiService.automateWorkflow).toHaveBeenCalledWith('Send me a daily email with sales data at 9 AM', undefined);
      });
    });

    it('should display existing workflows', async () => {
      const mockWorkflows = [
        {
          id: '1',
          name: 'Daily Sales Report',
          description: 'Sends daily sales report via email',
          trigger: { type: 'cron' as const, schedule: '0 9 * * *' },
          actions: [{ type: 'fetch_data' as const, parameters: {} }],
          status: 'active' as const
        }
      ];

      mockApiService.getWorkflows.mockResolvedValue(mockWorkflows);

      renderWithProviders(<WorkflowBuilder />);

      await waitFor(() => {
        expect(screen.getByText('Daily Sales Report')).toBeInTheDocument();
        expect(screen.getByText('Sends daily sales report via email')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Real-time Updates Journey', () => {
    it('should display dashboard with system metrics and workflows', async () => {
      const mockDashboardData = {
        systemMetrics: {
          latest: { cpu_usage: 45.2, memory_usage: 67.8, timestamp: new Date() },
          averageLast24Hours: { cpu_usage: 42.1, memory_usage: 65.3 },
          recentHistory: []
        },
        featureRequestStats: {
          total: 5,
          pending: 1,
          processing: 1,
          completed: 2,
          failed: 1
        },
        recentFeatureRequests: []
      };

      const mockWorkflows = [
        {
          id: '1',
          name: 'System Health Check',
          description: 'Monitors system health hourly',
          trigger: { type: 'cron' as const, schedule: '0 * * * *' },
          actions: [{ type: 'check_system_metrics' as const, parameters: {} }],
          status: 'active' as const
        }
      ];

      mockApiService.getDashboardData.mockResolvedValue(mockDashboardData);
      mockApiService.getWorkflows.mockResolvedValue(mockWorkflows);

      renderWithProviders(<DashboardHome />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Check system metrics are displayed
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('45.2%')).toBeInTheDocument(); // CPU usage
      expect(screen.getByText('67.8%')).toBeInTheDocument(); // Memory usage

      // Check workflows are displayed
      expect(screen.getByText('Active Workflows')).toBeInTheDocument();
      expect(screen.getByText('System Health Check')).toBeInTheDocument();

      // Check feature request stats
      expect(screen.getByText('Recent Feature Requests')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Total requests
    });

    it('should handle loading states properly', async () => {
      // Delay the API response to test loading state
      mockApiService.getDashboardData.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          systemMetrics: { latest: null, averageLast24Hours: null, recentHistory: [] },
          featureRequestStats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 },
          recentFeatureRequests: []
        }), 100))
      );
      mockApiService.getWorkflows.mockResolvedValue([]);

      renderWithProviders(<DashboardHome />);

      // Should show loading state
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      mockApiService.getDashboardData.mockRejectedValue(new Error('API Error'));
      mockApiService.getWorkflows.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<DashboardHome />);

      await waitFor(() => {
        expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      // Should have retry button
      const retryButton = screen.getByText('Try again');
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Navigation and Routing Journey', () => {
    it('should allow navigation between different sections', async () => {
      const user = userEvent.setup();
      
      // Mock all API calls
      mockApiService.getDashboardData.mockResolvedValue({
        systemMetrics: { latest: null, averageLast24Hours: null, recentHistory: [] },
        featureRequestStats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 },
        recentFeatureRequests: []
      });
      mockApiService.getWorkflows.mockResolvedValue([]);
      mockApiService.getFeatureRequests.mockResolvedValue([]);

      renderWithProviders(<App />);

      // Should start on dashboard
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Navigate to Feature Requests
      const featureRequestsLink = screen.getByRole('link', { name: /Feature Requests/ });
      await user.click(featureRequestsLink);

      await waitFor(() => {
        expect(screen.getByText('Submit New Feature Request')).toBeInTheDocument();
      });

      // Navigate to Workflow Builder
      const workflowBuilderLink = screen.getByRole('link', { name: /Workflow Builder/ });
      await user.click(workflowBuilderLink);

      await waitFor(() => {
        expect(screen.getByText('Create New Workflow')).toBeInTheDocument();
      });

      // Navigate back to Dashboard
      const dashboardLink = screen.getByRole('link', { name: /Dashboard/ });
      await user.click(dashboardLink);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Journey', () => {
    it('should catch and display errors gracefully', () => {
      // Create a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(<ThrowError />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('An unexpected error occurred. Please try refreshing the page.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Refresh Page/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Real-time Updates Integration', () => {
    it('should handle WebSocket connection and updates', async () => {
      const mockDashboardData = {
        systemMetrics: {
          latest: { cpu_usage: 45.2, memory_usage: 67.8, timestamp: new Date() },
          averageLast24Hours: { cpu_usage: 42.1, memory_usage: 65.3 },
          recentHistory: []
        },
        featureRequestStats: {
          total: 5,
          pending: 1,
          processing: 1,
          completed: 2,
          failed: 1
        },
        recentFeatureRequests: []
      };

      mockApiService.getDashboardData.mockResolvedValue(mockDashboardData);
      mockApiService.getWorkflows.mockResolvedValue([]);

      renderWithProviders(<DashboardHome />);

      await waitFor(() => {
        expect(screen.getByText('Live')).toBeInTheDocument();
      });

      // Verify connection status is displayed
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should handle WebSocket disconnection gracefully', async () => {
      // Mock WebSocket hook to return disconnected state
      jest.doMock('../../hooks/useWebSocket', () => ({
        useWebSocket: () => ({
          isConnected: false,
          connectionError: 'Connection lost',
          connect: jest.fn(),
          disconnect: jest.fn(),
          reconnect: jest.fn(),
          socket: null
        })
      }));

      const mockDashboardData = {
        systemMetrics: {
          latest: { cpu_usage: 45.2, memory_usage: 67.8, timestamp: new Date() },
          averageLast24Hours: { cpu_usage: 42.1, memory_usage: 65.3 },
          recentHistory: []
        },
        featureRequestStats: {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0
        },
        recentFeatureRequests: []
      };

      mockApiService.getDashboardData.mockResolvedValue(mockDashboardData);
      mockApiService.getWorkflows.mockResolvedValue([]);

      renderWithProviders(<DashboardHome />);

      await waitFor(() => {
        expect(screen.getByText('Real-time updates unavailable')).toBeInTheDocument();
      });

      expect(screen.getByText('Connection lost')).toBeInTheDocument();
      expect(screen.getByText('Reconnect')).toBeInTheDocument();
    });
  });

  describe('Complete Feature Request to UI Generation Flow', () => {
    it('should complete full feature request lifecycle with real-time updates', async () => {
      const user = userEvent.setup();
      
      // Mock the complete flow
      mockApiService.getFeatureRequests.mockResolvedValue([]);
      
      // Mock successful feature request processing
      mockApiService.evolveUI.mockResolvedValue({
        success: true,
        message: 'Successfully generated SalesChart component',
        generatedFiles: ['frontend/src/components/generated/SalesChart.tsx']
      });

      renderWithProviders(<FeatureRequest />);

      // Step 1: User enters feature request
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      await user.type(textarea, 'I want a sales chart showing monthly revenue with a blue color scheme');

      // Step 2: User submits request
      const submitButton = screen.getByRole('button', { name: /Submit Request/ });
      await user.click(submitButton);

      // Step 3: Verify processing state
      expect(screen.getByText(/Processing.../)).toBeInTheDocument();

      // Step 4: Wait for completion
      await waitFor(() => {
        expect(mockApiService.evolveUI).toHaveBeenCalledWith(
          'I want a sales chart showing monthly revenue with a blue color scheme',
          undefined
        );
      });

      // Step 5: Verify form is reset
      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('should handle feature request validation errors', async () => {
      const user = userEvent.setup();
      
      mockApiService.getFeatureRequests.mockResolvedValue([]);

      renderWithProviders(<FeatureRequest />);

      // Try to submit empty request
      const submitButton = screen.getByRole('button', { name: /Submit Request/ });
      await user.click(submitButton);

      expect(screen.getByText('Please enter a feature description')).toBeInTheDocument();

      // Try to submit request that's too long
      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      const longText = 'a'.repeat(2001);
      await user.type(textarea, longText);
      await user.click(submitButton);

      expect(screen.getByText('Description must be less than 2000 characters')).toBeInTheDocument();
    });
  });

  describe('Complete Workflow Creation Flow', () => {
    it('should complete full workflow creation lifecycle', async () => {
      const user = userEvent.setup();
      
      const mockWorkflows = [
        {
          id: '1',
          name: 'Daily Sales Report',
          description: 'Runs daily at 9 AM. Fetches data from API, sends email notification.',
          trigger: { type: 'cron' as const, schedule: '0 9 * * *' },
          actions: [
            { type: 'fetch_data' as const, parameters: { url: 'https://api.example.com/sales' } },
            { type: 'send_email' as const, parameters: { to: ['sales@company.com'] } }
          ],
          status: 'active' as const
        }
      ];

      mockApiService.getWorkflows.mockResolvedValue([]);
      mockApiService.automateWorkflow.mockResolvedValue({
        success: true,
        message: 'Successfully created workflow "Daily Sales Report" with 3 actions'
      });

      renderWithProviders(<WorkflowBuilder />);

      // Step 1: User enters workflow description
      const textarea = screen.getByPlaceholderText(/Describe what you want your workflow to do/);
      await user.type(textarea, 'Send me a daily email with sales data at 9 AM to sales@company.com');

      // Step 2: User submits workflow
      const submitButton = screen.getByRole('button', { name: /Create Workflow/ });
      await user.click(submitButton);

      // Step 3: Verify API call
      await waitFor(() => {
        expect(mockApiService.automateWorkflow).toHaveBeenCalledWith(
          'Send me a daily email with sales data at 9 AM to sales@company.com',
          undefined
        );
      });

      // Step 4: Mock updated workflows list
      mockApiService.getWorkflows.mockResolvedValue(mockWorkflows);

      // Step 5: Verify form is reset
      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });
  });

  describe('API Error Handling and Recovery', () => {
    it('should handle network errors with retry mechanism', async () => {
      // Mock network error
      mockApiService.getDashboardData
        .mockRejectedValueOnce(new Error('Unable to connect to server. Please check your connection and try again.'))
        .mockResolvedValueOnce({
          systemMetrics: { latest: null, averageLast24Hours: null, recentHistory: [] },
          featureRequestStats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 },
          recentFeatureRequests: []
        });

      mockApiService.getWorkflows.mockResolvedValue([]);

      renderWithProviders(<DashboardHome />);

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
        expect(screen.getByText('Unable to connect to server. Please check your connection and try again.')).toBeInTheDocument();
      });

      // User clicks retry
      const retryButton = screen.getByText('Try again');
      fireEvent.click(retryButton);

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.queryByText('Error loading dashboard')).not.toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });

    it('should handle different HTTP error codes appropriately', async () => {
      const user = userEvent.setup();
      
      // Mock 429 Too Many Requests error
      mockApiService.getFeatureRequests.mockResolvedValue([]);
      mockApiService.evolveUI.mockRejectedValue(new Error('Too many requests. Please wait a moment and try again.'));

      renderWithProviders(<FeatureRequest />);

      const textarea = screen.getByPlaceholderText(/Example: I want a chart/);
      await user.type(textarea, 'Test request');

      const submitButton = screen.getByRole('button', { name: /Submit Request/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Too many requests. Please wait a moment and try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide proper loading states and feedback', async () => {
      // Mock slow API response
      mockApiService.getDashboardData.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          systemMetrics: { latest: null, averageLast24Hours: null, recentHistory: [] },
          featureRequestStats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 },
          recentFeatureRequests: []
        }), 100))
      );
      mockApiService.getWorkflows.mockResolvedValue([]);

      renderWithProviders(<DashboardHome />);

      // Should show loading state
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
      });
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      
      mockApiService.getDashboardData.mockResolvedValue({
        systemMetrics: { latest: null, averageLast24Hours: null, recentHistory: [] },
        featureRequestStats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 },
        recentFeatureRequests: []
      });
      mockApiService.getWorkflows.mockResolvedValue([]);
      mockApiService.getFeatureRequests.mockResolvedValue([]);

      renderWithProviders(<App />);

      // Tab through navigation
      await user.tab();
      expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('link', { name: /Feature Requests/ })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('link', { name: /Workflow Builder/ })).toHaveFocus();

      // Navigate using Enter key
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Create New Workflow')).toBeInTheDocument();
      });
    });
  });
});