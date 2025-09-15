import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowStatusDashboard } from './WorkflowStatusDashboard';

describe('WorkflowStatusDashboard', () => {
  const mockWorkflows = [
    {
      id: '1',
      name: 'Test Workflow 1',
      status: 'active' as const,
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 1 * 60 * 60 * 1000),
      successRate: 95.5,
      executionCount: 100,
      averageDuration: 2000
    },
    {
      id: '2',
      name: 'Test Workflow 2',
      status: 'paused' as const,
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
      successRate: 88.2,
      executionCount: 50,
      averageDuration: 5000
    }
  ];

  it('renders without crashing', () => {
    render(<WorkflowStatusDashboard />);
  });

  it('displays the correct title', () => {
    render(<WorkflowStatusDashboard title="Test Dashboard" />);
    expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
  });

  it('displays workflow information', () => {
    render(<WorkflowStatusDashboard workflows={mockWorkflows} />);
    
    expect(screen.getByText('Test Workflow 1')).toBeInTheDocument();
    expect(screen.getByText('Test Workflow 2')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('paused')).toBeInTheDocument();
  });

  it('shows status summary when metrics are enabled', () => {
    render(<WorkflowStatusDashboard workflows={mockWorkflows} showMetrics={true} />);
    
    // Should show status counts
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('hides metrics when showMetrics is false', () => {
    render(<WorkflowStatusDashboard workflows={mockWorkflows} showMetrics={false} />);
    
    // Success rate column should not be visible
    expect(screen.queryByText('Success Rate')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg Duration')).not.toBeInTheDocument();
  });

  it('filters workflows by status', () => {
    render(<WorkflowStatusDashboard workflows={mockWorkflows} />);
    
    const filterSelect = screen.getByDisplayValue('All Workflows');
    fireEvent.change(filterSelect, { target: { value: 'active' } });
    
    expect(screen.getByText('Test Workflow 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Workflow 2')).not.toBeInTheDocument();
  });

  it('sorts workflows when column headers are clicked', () => {
    render(<WorkflowStatusDashboard workflows={mockWorkflows} />);
    
    const nameHeader = screen.getByText('Workflow Name');
    fireEvent.click(nameHeader);
    
    // Should show sort indicator
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('displays last updated timestamp', () => {
    render(<WorkflowStatusDashboard />);
    
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('shows manage workflows link', () => {
    render(<WorkflowStatusDashboard />);
    
    expect(screen.getByText('Manage Workflows →')).toBeInTheDocument();
  });

  it('displays empty state when no workflows match filter', () => {
    render(<WorkflowStatusDashboard workflows={[]} />);
    
    expect(screen.getByText('No workflows found')).toBeInTheDocument();
    expect(screen.getByText('No workflows have been created yet.')).toBeInTheDocument();
  });

  it('formats success rates correctly', () => {
    render(<WorkflowStatusDashboard workflows={mockWorkflows} showMetrics={true} />);
    
    expect(screen.getByText('95.5%')).toBeInTheDocument();
    expect(screen.getByText('88.2%')).toBeInTheDocument();
  });

  it('formats durations correctly', () => {
    render(<WorkflowStatusDashboard workflows={mockWorkflows} showMetrics={true} />);
    
    expect(screen.getByText('2.0s')).toBeInTheDocument(); // 2000ms
    expect(screen.getByText('5.0s')).toBeInTheDocument(); // 5000ms
  });
});