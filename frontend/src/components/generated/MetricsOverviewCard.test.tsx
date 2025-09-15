import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetricsOverviewCard } from './MetricsOverviewCard';

describe('MetricsOverviewCard', () => {
  const mockMetrics = [
    {
      label: 'Active Users',
      value: 150,
      change: 12.5,
      trend: 'up' as const,
      color: 'blue' as const
    },
    {
      label: 'Revenue',
      value: '$45,230',
      change: -2.3,
      trend: 'down' as const,
      color: 'green' as const
    }
  ];

  it('renders without crashing', () => {
    render(<MetricsOverviewCard />);
  });

  it('displays the correct title', () => {
    render(<MetricsOverviewCard title="Test Metrics" />);
    expect(screen.getByText('Test Metrics')).toBeInTheDocument();
  });

  it('displays metrics with correct values', () => {
    render(<MetricsOverviewCard metrics={mockMetrics} />);
    
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$45,230')).toBeInTheDocument();
  });

  it('shows trend indicators when enabled', () => {
    render(<MetricsOverviewCard metrics={mockMetrics} showTrends={true} />);
    
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getByText('-2.3%')).toBeInTheDocument();
  });

  it('hides trend indicators when disabled', () => {
    render(<MetricsOverviewCard metrics={mockMetrics} showTrends={false} />);
    
    expect(screen.queryByText('+12.5%')).not.toBeInTheDocument();
    expect(screen.queryByText('-2.3%')).not.toBeInTheDocument();
  });

  it('displays live indicator', () => {
    render(<MetricsOverviewCard />);
    
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('shows last updated timestamp', () => {
    render(<MetricsOverviewCard />);
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('displays view detailed metrics link', () => {
    render(<MetricsOverviewCard />);
    
    expect(screen.getByText('View detailed metrics →')).toBeInTheDocument();
  });

  it('handles empty metrics array', () => {
    render(<MetricsOverviewCard metrics={[]} />);
    
    expect(screen.getByText('System Metrics Overview')).toBeInTheDocument();
  });

  it('formats numbers correctly', () => {
    const largeNumberMetrics = [
      {
        label: 'Large Number',
        value: 1234567,
        trend: 'up' as const,
        color: 'blue' as const
      }
    ];
    
    render(<MetricsOverviewCard metrics={largeNumberMetrics} />);
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });
});