import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickStatsOverview } from './QuickStatsOverview';

// Mock timers for testing
jest.useFakeTimers();

describe('QuickStatsOverview', () => {
  const mockStats = [
    {
      id: 'test-stat-1',
      label: 'Test Metric 1',
      value: 100,
      change: 5,
      changeType: 'increase' as const,
      icon: '📊',
      color: 'blue' as const
    },
    {
      id: 'test-stat-2',
      label: 'Test Metric 2',
      value: '99.5%',
      change: -0.2,
      changeType: 'decrease' as const,
      icon: '📈',
      color: 'green' as const
    }
  ];

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders without crashing', () => {
    render(<QuickStatsOverview />);
  });

  it('displays the correct title', () => {
    render(<QuickStatsOverview title="Test Stats Dashboard" />);
    expect(screen.getByText('Test Stats Dashboard')).toBeInTheDocument();
  });

  it('shows default stats when no stats provided', () => {
    render(<QuickStatsOverview />);
    
    expect(screen.getByText('Active Workflows')).toBeInTheDocument();
    expect(screen.getByText('Completed Today')).toBeInTheDocument();
    expect(screen.getByText('System Uptime')).toBeInTheDocument();
  });

  it('displays custom stats when provided', () => {
    render(<QuickStatsOverview stats={mockStats} />);
    
    expect(screen.getByText('Test Metric 1')).toBeInTheDocument();
    expect(screen.getByText('Test Metric 2')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('99.5%')).toBeInTheDocument();
  });

  it('shows trend indicators when showTrends is true', () => {
    render(<QuickStatsOverview stats={mockStats} showTrends={true} />);
    
    // Should show trend arrows
    const trendElements = document.querySelectorAll('span');
    const hasTrendIndicators = Array.from(trendElements).some(el => 
      el.textContent?.includes('↗') || 
      el.textContent?.includes('↘') || 
      el.textContent?.includes('→')
    );
    expect(hasTrendIndicators).toBe(true);
  });

  it('hides trend indicators when showTrends is false', () => {
    render(<QuickStatsOverview stats={mockStats} showTrends={false} />);
    
    // Should not show Up/Down badges
    expect(screen.queryByText('Up')).not.toBeInTheDocument();
    expect(screen.queryByText('Down')).not.toBeInTheDocument();
  });

  it('displays icons when provided', () => {
    render(<QuickStatsOverview stats={mockStats} />);
    
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('📈')).toBeInTheDocument();
  });

  it('shows refresh button', () => {
    render(<QuickStatsOverview />);
    
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    render(<QuickStatsOverview />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Should show loading state
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    
    // Fast-forward time to complete the refresh
    jest.advanceTimersByTime(1100);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  it('displays last updated timestamp', () => {
    render(<QuickStatsOverview />);
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('shows live data indicator', () => {
    render(<QuickStatsOverview />);
    
    expect(screen.getByText('Live Data')).toBeInTheDocument();
  });

  it('displays metrics count', () => {
    render(<QuickStatsOverview stats={mockStats} />);
    
    expect(screen.getByText('2 metrics')).toBeInTheDocument();
  });

  it('shows action buttons', () => {
    render(<QuickStatsOverview />);
    
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.getByText('Configure Alerts')).toBeInTheDocument();
  });

  it('applies correct grid columns', () => {
    const { container } = render(<QuickStatsOverview columns={3} />);
    
    const gridElement = container.querySelector('.grid');
    expect(gridElement).toHaveClass('lg:grid-cols-3');
  });

  it('shows change values with correct formatting', () => {
    render(<QuickStatsOverview stats={mockStats} />);
    
    // Should show +5 for increase
    expect(screen.getByText('+5')).toBeInTheDocument();
    // Should show -0.2 for decrease
    expect(screen.getByText('-0.2')).toBeInTheDocument();
  });

  it('applies correct color classes', () => {
    const { container } = render(<QuickStatsOverview stats={mockStats} />);
    
    // Should have blue and green color classes
    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
    expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
  });

  it('shows trend badges with correct colors', () => {
    render(<QuickStatsOverview stats={mockStats} showTrends={true} />);
    
    expect(screen.getByText('Up')).toBeInTheDocument();
    expect(screen.getByText('Down')).toBeInTheDocument();
  });
});