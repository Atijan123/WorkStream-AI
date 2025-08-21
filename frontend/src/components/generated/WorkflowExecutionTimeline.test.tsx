import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowExecutionTimeline } from './WorkflowExecutionTimeline';

describe('WorkflowExecutionTimeline', () => {
  const mockExecutions = [
    {
      id: '1',
      workflowName: 'Test Workflow',
      status: 'success' as const,
      startTime: new Date(Date.now() - 10 * 60 * 1000),
      duration: 2340,
      message: 'Completed successfully'
    },
    {
      id: '2',
      workflowName: 'Another Workflow',
      status: 'error' as const,
      startTime: new Date(Date.now() - 30 * 60 * 1000),
      duration: 1200,
      message: 'Failed with error'
    }
  ];

  it('renders without crashing', () => {
    render(<WorkflowExecutionTimeline />);
  });

  it('displays the correct content', () => {
    render(<WorkflowExecutionTimeline title="Test Timeline" executions={mockExecutions} />);
    expect(screen.getByText('Test Timeline')).toBeInTheDocument();
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    expect(screen.getByText('Another Workflow')).toBeInTheDocument();
  });

  it('shows execution status and messages', () => {
    render(<WorkflowExecutionTimeline executions={mockExecutions} />);
    
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
    expect(screen.getByText('Completed successfully')).toBeInTheDocument();
    expect(screen.getByText('Failed with error')).toBeInTheDocument();
  });

  it('formats duration correctly', () => {
    render(<WorkflowExecutionTimeline executions={mockExecutions} />);
    
    expect(screen.getByText('2.3s')).toBeInTheDocument(); // 2340ms
    expect(screen.getByText('1.2s')).toBeInTheDocument(); // 1200ms
  });

  it('shows timestamps', () => {
    render(<WorkflowExecutionTimeline executions={mockExecutions} />);
    
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('limits items based on maxItems prop', () => {
    render(<WorkflowExecutionTimeline executions={mockExecutions} maxItems={1} />);
    
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    expect(screen.queryByText('Another Workflow')).not.toBeInTheDocument();
  });

  it('shows empty state when no executions', () => {
    render(<WorkflowExecutionTimeline executions={[]} />);
    
    expect(screen.getByText('No workflow executions found')).toBeInTheDocument();
  });

  it('shows view history link', () => {
    render(<WorkflowExecutionTimeline />);
    
    expect(screen.getByText('View execution history →')).toBeInTheDocument();
  });
});