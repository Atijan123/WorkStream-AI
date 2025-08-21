import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DashboardHome from '../DashboardHome';
import { apiService } from '../../services/api';
import { DashboardData, Workflow } from '../../types';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getDashboardData: vi.fn(),
    getWorkflows: vi.fn(),
    getWorkflowLogs: vi.fn(),
  },
}));

const mockApiService = apiService as any;

describe('DashboardHome', () => {
  const mockDashboardData: DashboardData = {
    recentFeatureRequests: [
      {
        id: 'req-1',
        description: 'Add dark mode support',
        status: 'completed',
        timestamp: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: 'req-2',
        description: 'Create dashboard widgets',
        status: 'pending',
        timestamp: new Date('2024-01-02T10:00:00Z'),
      },
    ],
    featureRequestStats: {
      total: 5,
      pending: 2,
      processing: 1,
      completed: 1,
      failed: 1,
    },
    systemMetrics: {
      latest: {
        id: 1,
        cpu_usage: 45.5,
        memory_usage: 67.8,
        timestamp: new Date('2024-01-01T12:00:00Z'),
      },
      averageLast24Hours: {
        cpu_usage: 42.3,
        memory_usage: 65.2,
      },
      recentHistory: [
        {
          id: 1,
          cpu_usage: 45.5,
          memory_usage: 67.8,
          timestamp: new Date('2024-01-01T12:00:00Z'),
        },
      ],
    },
  };

  const mockWorkflows: Workflow[] = [
    {
      id: 'wf-1',
      name: 'Daily Sales Report',
      description: 'Generate and email daily sales report',
      trigger: {
        type: 'cron',
        schedule: '0 8 * * *',
      },
      actions: [
        {
          type: 'fetch_data',
          parameters: { source: 'sales_db' },
        },
        {
          type: 'generate_report',
          parameters: { format: 'pdf' },
        },
      ],
      status: 'active',
    },
    {
      id: 'wf-2',
      name: 'System Health Check',
      description: 'Monitor system health metrics',
      trigger: {
        type: 'cron',
        schedule: '0 * * * *',
      },
      actions: [
        {
          type: 'check_system_metrics',
          parameters: {},
        },
      ],
      status: 'error',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiService.getDashboardData.mockResolvedValue(mockDashboardData);
    mockApiService.getWorkflows.mockResolvedValue(mockWorkflows);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should render loading state initially', () => {
    render(<DashboardHome />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('should render dashboard data after loading', async () => {
    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Check system metrics
    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByText('45.5%')).toBeInTheDocument(); // CPU usage
    expect(screen.getByText('67.8%')).toBeInTheDocument(); // Memory usage

    // Check workflows
    expect(screen.getByText('Active Workflows')).toBeInTheDocument();
    expect(screen.getByText('Daily Sales Report')).toBeInTheDocument();
    expect(screen.getByText('System Health Check')).toBeInTheDocument();

    // Check feature requests
    expect(screen.getByText('Recent Feature Requests')).toBeInTheDocument();
    expect(screen.getByText('Add dark mode support')).toBeInTheDocument();
    expect(screen.getByText('Create dashboard widgets')).toBeInTheDocument();

    // Check feature request stats
    expect(screen.getByText('5')).toBeInTheDocument(); // Total
    expect(screen.getByText('2')).toBeInTheDocument(); // Pending
    const oneElements = screen.getAllByText('1');
    expect(oneElements.length).toBeGreaterThanOrEqual(3); // Processing, Completed, Failed
  });

  it('should display workflow status with correct styling', async () => {
    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Check active workflow status
    const activeStatus = screen.getByText('active');
    expect(activeStatus).toHaveClass('text-green-600', 'bg-green-100');

    // Check error workflow status
    const errorStatus = screen.getByText('error');
    expect(errorStatus).toHaveClass('text-red-600', 'bg-red-100');
  });

  it('should display feature request status with correct styling', async () => {
    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Check completed status
    const completedStatus = screen.getByText('completed');
    expect(completedStatus).toHaveClass('text-green-600', 'bg-green-100');

    // Check pending status
    const pendingStatus = screen.getByText('pending');
    expect(pendingStatus).toHaveClass('text-blue-600', 'bg-blue-100');
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch data';
    mockApiService.getDashboardData.mockRejectedValue(new Error(errorMessage));

    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Check retry button
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('should retry data fetching when retry button is clicked', async () => {
    const errorMessage = 'Network error';
    mockApiService.getDashboardData.mockRejectedValueOnce(new Error(errorMessage));

    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
    });

    // Reset mock to return successful data
    mockApiService.getDashboardData.mockResolvedValue(mockDashboardData);

    // Click retry button
    fireEvent.click(screen.getByText('Try again'));

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Error loading dashboard')).not.toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Clear previous calls
    vi.clearAllMocks();
    mockApiService.getDashboardData.mockResolvedValue(mockDashboardData);
    mockApiService.getWorkflows.mockResolvedValue(mockWorkflows);

    // Click refresh button
    const refreshButton = screen.getByTitle('Refresh data');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockApiService.getDashboardData).toHaveBeenCalledTimes(1);
      expect(mockApiService.getWorkflows).toHaveBeenCalledTimes(1);
    });
  });

  it('should display empty states when no data is available', async () => {
    const emptyDashboardData: DashboardData = {
      recentFeatureRequests: [],
      featureRequestStats: {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      },
      systemMetrics: {
        latest: null,
        averageLast24Hours: null,
        recentHistory: [],
      },
    };

    mockApiService.getDashboardData.mockResolvedValue(emptyDashboardData);
    mockApiService.getWorkflows.mockResolvedValue([]);

    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('No workflows found')).toBeInTheDocument();
    expect(screen.getByText('No feature requests found')).toBeInTheDocument();
  });

  it('should render custom widgets when provided', async () => {
    const customWidgets = [
      <div key="widget1">Custom Widget 1</div>,
      <div key="widget2">Custom Widget 2</div>,
    ];

    render(<DashboardHome widgets={customWidgets} />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Widgets')).toBeInTheDocument();
    expect(screen.getByText('Custom Widget 1')).toBeInTheDocument();
    expect(screen.getByText('Custom Widget 2')).toBeInTheDocument();
  });

  it('should render recent changes when provided', async () => {
    const recentChanges = [
      {
        id: 'change-1',
        description: 'Added new dashboard component',
        timestamp: new Date('2024-01-01T15:00:00Z'),
        type: 'ui_evolution',
      },
    ];

    render(<DashboardHome recentChanges={recentChanges} />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Recent Changes')).toBeInTheDocument();
    expect(screen.getByText('Added new dashboard component')).toBeInTheDocument();
  });

  it('should format timestamps correctly', async () => {
    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Check that timestamps are formatted (exact format may vary by locale)
    const timestampElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
    expect(timestampElements.length).toBeGreaterThan(0);
  });

  it('should display workflow trigger information', async () => {
    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Trigger: cron')).toHaveLength(2);
    expect(screen.getByText('Schedule: 0 8 * * *')).toBeInTheDocument();
    expect(screen.getByText('Actions: 2')).toBeInTheDocument();
  });

  it('should set up polling interval for real-time updates', async () => {
    vi.useFakeTimers();

    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Clear initial API calls
    vi.clearAllMocks();

    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(mockApiService.getDashboardData).toHaveBeenCalledTimes(1);
      expect(mockApiService.getWorkflows).toHaveBeenCalledTimes(1);
    });

    vi.useRealTimers();
  });
});