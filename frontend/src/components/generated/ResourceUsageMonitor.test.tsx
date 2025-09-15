import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ResourceUsageMonitor } from './ResourceUsageMonitor';

// Mock timers for testing
jest.useFakeTimers();

describe('ResourceUsageMonitor', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders without crashing', () => {
    render(<ResourceUsageMonitor />);
  });

  it('displays the correct title', () => {
    render(<ResourceUsageMonitor title="Test Resource Monitor" />);
    expect(screen.getByText('Test Resource Monitor')).toBeInTheDocument();
  });

  it('shows all resource types', () => {
    render(<ResourceUsageMonitor />);
    
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
    expect(screen.getByText('Disk')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
  });

  it('displays usage percentages', () => {
    render(<ResourceUsageMonitor />);
    
    // Should show percentage values (they're dynamic, so we check for the % symbol)
    const percentageElements = screen.getAllByText(/%/);
    expect(percentageElements.length).toBeGreaterThan(0);
  });

  it('shows trend indicators', () => {
    render(<ResourceUsageMonitor />);
    
    // Should show trend arrows or horizontal lines
    const trendElements = document.querySelectorAll('span');
    const hasTrendIndicators = Array.from(trendElements).some(el => 
      el.textContent?.includes('↗') || 
      el.textContent?.includes('↘') || 
      el.textContent?.includes('→')
    );
    expect(hasTrendIndicators).toBe(true);
  });

  it('displays last updated timestamp', () => {
    render(<ResourceUsageMonitor />);
    
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('shows action buttons', () => {
    render(<ResourceUsageMonitor />);
    
    expect(screen.getByText('Refresh Now')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Configure Alerts')).toBeInTheDocument();
  });

  it('displays auto-refresh interval', () => {
    render(<ResourceUsageMonitor refreshInterval={3000} />);
    
    expect(screen.getByText('Auto-refresh: 3s')).toBeInTheDocument();
  });

  it('shows system status indicator', () => {
    render(<ResourceUsageMonitor />);
    
    // Should show either Healthy, Warning, or Critical
    const statusText = screen.getByText(/Healthy|Warning|Critical/);
    expect(statusText).toBeInTheDocument();
  });

  it('hides details when showDetails is false', () => {
    render(<ResourceUsageMonitor showDetails={false} />);
    
    // Details like "Trend:" should not be visible
    expect(screen.queryByText(/Trend:/)).not.toBeInTheDocument();
  });

  it('shows details when showDetails is true', () => {
    render(<ResourceUsageMonitor showDetails={true} />);
    
    // Details like "Cores: 8" should be visible
    expect(screen.getByText('Cores: 8')).toBeInTheDocument();
    expect(screen.getByText('Total: 16GB')).toBeInTheDocument();
    expect(screen.getByText('Total: 500GB')).toBeInTheDocument();
    expect(screen.getByText('Speed: 1Gbps')).toBeInTheDocument();
  });

  it('updates data periodically', async () => {
    render(<ResourceUsageMonitor refreshInterval={1000} />);
    
    // Fast-forward time to trigger the interval
    jest.advanceTimersByTime(1500);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });
  });

  it('shows loading indicator during updates', async () => {
    render(<ResourceUsageMonitor refreshInterval={1000} />);
    
    // Fast-forward to trigger update
    jest.advanceTimersByTime(1000);
    
    // The loading indicator should appear briefly
    await waitFor(() => {
      const loadingIndicator = document.querySelector('.animate-pulse');
      expect(loadingIndicator).toBeInTheDocument();
    });
  });
});