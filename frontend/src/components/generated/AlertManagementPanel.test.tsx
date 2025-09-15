import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertManagementPanel } from './AlertManagementPanel';

describe('AlertManagementPanel', () => {
  const mockAlerts = [
    {
      id: '1',
      type: 'error' as const,
      title: 'Test Error',
      message: 'This is a test error message',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      source: 'Test Service',
      acknowledged: false,
      severity: 'high' as const
    },
    {
      id: '2',
      type: 'warning' as const,
      title: 'Test Warning',
      message: 'This is a test warning message',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      source: 'Test Monitor',
      acknowledged: true,
      severity: 'medium' as const
    }
  ];

  it('renders without crashing', () => {
    render(<AlertManagementPanel />);
  });

  it('displays the correct title', () => {
    render(<AlertManagementPanel title="Test Alerts" />);
    expect(screen.getByText('Test Alerts')).toBeInTheDocument();
  });

  it('displays alert information', () => {
    render(<AlertManagementPanel alerts={mockAlerts} />);
    
    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('Test Warning')).toBeInTheDocument();
    expect(screen.getByText('This is a test error message')).toBeInTheDocument();
    expect(screen.getByText('This is a test warning message')).toBeInTheDocument();
  });

  it('shows alert summary counts', () => {
    render(<AlertManagementPanel alerts={mockAlerts} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Total count
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
  });

  it('filters alerts correctly', () => {
    render(<AlertManagementPanel alerts={mockAlerts} />);
    
    const filterSelect = screen.getByDisplayValue('All Alerts');
    fireEvent.change(filterSelect, { target: { value: 'error' } });
    
    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.queryByText('Test Warning')).not.toBeInTheDocument();
  });

  it('acknowledges alerts when button is clicked', () => {
    render(<AlertManagementPanel alerts={mockAlerts} />);
    
    const acknowledgeButton = screen.getByText('Acknowledge');
    fireEvent.click(acknowledgeButton);
    
    expect(screen.getByText('✓ Acknowledged')).toBeInTheDocument();
  });

  it('dismisses alerts when dismiss button is clicked', () => {
    render(<AlertManagementPanel alerts={mockAlerts} />);
    
    const dismissButtons = screen.getAllByText('Dismiss');
    fireEvent.click(dismissButtons[0]);
    
    // The alert should be removed from the list
    expect(screen.queryByText('Test Error')).not.toBeInTheDocument();
  });

  it('sorts alerts by severity', () => {
    render(<AlertManagementPanel alerts={mockAlerts} />);
    
    const sortSelect = screen.getByDisplayValue('Sort by Time');
    fireEvent.change(sortSelect, { target: { value: 'severity' } });
    
    // Should still show both alerts but potentially in different order
    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('Test Warning')).toBeInTheDocument();
  });

  it('shows auto-refresh indicator when enabled', () => {
    render(<AlertManagementPanel autoRefresh={true} refreshInterval={30000} />);
    
    expect(screen.getByText(/Auto-refresh/)).toBeInTheDocument();
    expect(screen.getByText(/30s/)).toBeInTheDocument();
  });

  it('displays empty state when no alerts match filter', () => {
    render(<AlertManagementPanel alerts={[]} />);
    
    expect(screen.getByText('No alerts found')).toBeInTheDocument();
    expect(screen.getByText('All systems are running normally.')).toBeInTheDocument();
  });

  it('shows manage alert rules link', () => {
    render(<AlertManagementPanel />);
    
    expect(screen.getByText('Manage Alert Rules →')).toBeInTheDocument();
  });

  it('displays severity badges correctly', () => {
    render(<AlertManagementPanel alerts={mockAlerts} />);
    
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(<AlertManagementPanel alerts={mockAlerts} />);
    
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });
});