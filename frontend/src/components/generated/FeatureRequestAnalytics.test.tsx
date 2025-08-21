import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeatureRequestAnalytics } from './FeatureRequestAnalytics';

describe('FeatureRequestAnalytics', () => {
  const mockStats = {
    total: 20,
    pending: 4,
    processing: 2,
    completed: 12,
    failed: 2
  };

  it('renders without crashing', () => {
    render(<FeatureRequestAnalytics />);
  });

  it('displays the correct content', () => {
    render(<FeatureRequestAnalytics title="Test Analytics" stats={mockStats} />);
    expect(screen.getByText('Test Analytics')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument(); // Total requests
    expect(screen.getByText('60%')).toBeInTheDocument(); // Completion rate (12/20)
  });

  it('shows status breakdown with correct values', () => {
    render(<FeatureRequestAnalytics stats={mockStats} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    
    // Check specific values
    expect(screen.getByText('12')).toBeInTheDocument(); // completed
    expect(screen.getByText('4')).toBeInTheDocument(); // pending
    expect(screen.getByText('2')).toBeInTheDocument(); // processing and failed
  });

  it('calculates and displays key metrics correctly', () => {
    render(<FeatureRequestAnalytics stats={mockStats} />);
    
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument(); // 12/(12+2) = 85.7% rounded to 86%
    
    expect(screen.getByText('Active Requests')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument(); // 4 pending + 2 processing
  });

  it('shows trend indicator', () => {
    render(<FeatureRequestAnalytics />);
    
    expect(screen.getByText('+15% this week')).toBeInTheDocument();
    expect(screen.getByText('Feature completion rate is trending up')).toBeInTheDocument();
  });

  it('handles zero stats gracefully', () => {
    const zeroStats = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };
    
    render(<FeatureRequestAnalytics stats={zeroStats} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Total requests
    expect(screen.getByText('0%')).toBeInTheDocument(); // Completion rate
  });
});