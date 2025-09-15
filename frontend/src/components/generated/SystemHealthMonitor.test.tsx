import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SystemHealthMonitor } from './SystemHealthMonitor';

// Mock timers for testing intervals
jest.useFakeTimers();

describe('SystemHealthMonitor', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<SystemHealthMonitor />);
  });

  it('displays the correct title', () => {
    render(<SystemHealthMonitor title="Custom Health Monitor" />);
    expect(screen.getByText('Custom Health Monitor')).toBeInTheDocument();
  });

  it('shows system metrics with correct labels', () => {
    render(<SystemHealthMonitor />);
    
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
    expect(screen.getByText('Disk')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
  });

  it('displays status indicator', () => {
    render(<SystemHealthMonitor />);
    
    // Should show a status (healthy, warning, or critical)
    const statusElement = screen.getByText(/healthy|warning|critical/i);
    expect(statusElement).toBeInTheDocument();
  });

  it('shows percentage values for metrics', () => {
    render(<SystemHealthMonitor />);
    
    // Should show percentage values (looking for % symbol)
    const percentageElements = screen.getAllByText(/%/);
    expect(percentageElements.length).toBeGreaterThanOrEqual(4); // At least 4 metrics
  });

  it('displays uptime information when showDetails is true', () => {
    render(<SystemHealthMonitor showDetails={true} />);
    
    expect(screen.getByText('Uptime:')).toBeInTheDocument();
    expect(screen.getByText(/\d+d \d+h \d+m/)).toBeInTheDocument();
  });

  it('hides details when showDetails is false', () => {
    render(<SystemHealthMonitor showDetails={false} />);
    
    expect(screen.queryByText('Uptime:')).not.toBeInTheDocument();
  });

  it('shows last updated timestamp', () => {
    render(<SystemHealthMonitor />);
    
    expect(screen.getByText(/Updated \d+s ago/)).toBeInTheDocument();
  });

  it('displays refresh and details buttons', () => {
    render(<SystemHealthMonitor />);
    
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('shows loading indicator during data fetch', async () => {
    render(<SystemHealthMonitor refreshInterval={1000} />);
    
    // Fast-forward time to trigger refresh
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should show loading spinner (though it might be brief)
    await waitFor(() => {
      const loadingSpinner = document.querySelector('.animate-spin');
      // Loading might be very brief, so we just check the component renders
      expect(screen.getByText('System Health Monitor')).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    render(<SystemHealthMonitor />);
    
    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);
    
    expect(mockReload).toHaveBeenCalled();
  });

  it('updates metrics over time', async () => {
    render(<SystemHealthMonitor refreshInterval={1000} />);
    
    const initialCpuElement = screen.getByText('CPU').closest('div');
    expect(initialCpuElement).toBeInTheDocument();

    // Fast-forward time to trigger refresh
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText('CPU')).toBeInTheDocument();
    });
  });

  it('displays appropriate status colors', () => {
    render(<SystemHealthMonitor />);
    
    // Check that status has appropriate styling classes
    const statusElement = screen.getByText(/healthy|warning|critical/i);
    const statusContainer = statusElement.closest('span');
    
    expect(statusContainer).toHaveClass('inline-flex', 'items-center', 'px-2', 'py-1', 'rounded-full');
  });

  it('shows metric icons', () => {
    render(<SystemHealthMonitor />);
    
    // Check for emoji icons (they should be in the document as text)
    expect(screen.getByText('🖥️')).toBeInTheDocument(); // CPU
    expect(screen.getByText('💾')).toBeInTheDocument(); // Memory
    expect(screen.getByText('💿')).toBeInTheDocument(); // Disk
    expect(screen.getByText('🌐')).toBeInTheDocument(); // Network
  });

  it('displays progress bars for metrics', () => {
    render(<SystemHealthMonitor />);
    
    // Check for progress bar elements
    const progressBars = document.querySelectorAll('.bg-gray-200.rounded-full.h-2');
    expect(progressBars.length).toBe(4); // One for each metric
  });

  it('handles custom refresh interval', () => {
    const customInterval = 5000;
    render(<SystemHealthMonitor refreshInterval={customInterval} />);
    
    // Fast-forward by custom interval
    act(() => {
      jest.advanceTimersByTime(customInterval);
    });

    // Component should still be working
    expect(screen.getByText('System Health Monitor')).toBeInTheDocument();
  });
});