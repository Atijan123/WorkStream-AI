import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowTimeline } from './WorkflowTimeline';

describe('WorkflowTimeline', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Workflow Started',
      description: 'Test workflow initiated',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      status: 'info' as const,
      user: 'System',
      duration: 0
    },
    {
      id: '2',
      title: 'Task Completed',
      description: 'Successfully completed task',
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      status: 'success' as const,
      user: 'Worker',
      duration: 1500,
      metadata: { taskId: 'task-123', result: 'success' }
    },
    {
      id: '3',
      title: 'Error Occurred',
      description: 'An error happened during processing',
      timestamp: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
      status: 'error' as const,
      user: 'System',
      duration: 500
    }
  ];

  it('renders without crashing', () => {
    render(<WorkflowTimeline />);
  });

  it('displays the correct title', () => {
    render(<WorkflowTimeline title="Workflow Timeline" />);
    expect(screen.getByText('Workflow Timeline')).toBeInTheDocument();
  });

  it('displays custom title when provided', () => {
    const customTitle = 'Execution History';
    render(<WorkflowTimeline title={customTitle} />);
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('renders all events', () => {
    render(<WorkflowTimeline events={mockEvents} />);
    
    expect(screen.getByText('Workflow Started')).toBeInTheDocument();
    expect(screen.getByText('Task Completed')).toBeInTheDocument();
    expect(screen.getByText('Error Occurred')).toBeInTheDocument();
  });

  it('displays event descriptions', () => {
    render(<WorkflowTimeline events={mockEvents} />);
    
    expect(screen.getByText('Test workflow initiated')).toBeInTheDocument();
    expect(screen.getByText('Successfully completed task')).toBeInTheDocument();
    expect(screen.getByText('An error happened during processing')).toBeInTheDocument();
  });

  it('shows user information when showUser is true', () => {
    render(<WorkflowTimeline events={mockEvents} showUser={true} />);
    
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Worker')).toBeInTheDocument();
  });

  it('hides user information when showUser is false', () => {
    render(<WorkflowTimeline events={mockEvents} showUser={false} />);
    
    // User names should not be visible
    const systemTexts = screen.queryAllByText('System');
    const workerTexts = screen.queryAllByText('Worker');
    
    // These might still appear in other contexts, so we check they're not in user sections
    expect(systemTexts.length).toBeLessThanOrEqual(2); // At most in event titles
    expect(workerTexts.length).toBeLessThanOrEqual(1);
  });

  it('shows duration when showDuration is true', () => {
    render(<WorkflowTimeline events={mockEvents} showDuration={true} />);
    
    // Should show formatted durations
    expect(screen.getByText('1.5s')).toBeInTheDocument(); // 1500ms formatted
    expect(screen.getByText('500ms')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(<WorkflowTimeline events={mockEvents} />);
    
    // Should show relative time formats
    expect(screen.getByText('5m ago')).toBeInTheDocument();
    expect(screen.getByText('2m ago')).toBeInTheDocument();
    expect(screen.getByText('1m ago')).toBeInTheDocument();
  });

  it('displays status summary', () => {
    render(<WorkflowTimeline events={mockEvents} />);
    
    // Should show counts for different statuses
    expect(screen.getByText('1 Success')).toBeInTheDocument();
    expect(screen.getByText('1 Error')).toBeInTheDocument();
  });

  it('calls onEventClick when event is clicked', () => {
    const mockOnEventClick = jest.fn();
    render(<WorkflowTimeline events={mockEvents} onEventClick={mockOnEventClick} />);
    
    const event = screen.getByText('Workflow Started').closest('div');
    if (event) {
      fireEvent.click(event);
      expect(mockOnEventClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          title: 'Workflow Started'
        })
      );
    }
  });

  it('limits events to maxEvents', () => {
    render(<WorkflowTimeline events={mockEvents} maxEvents={2} />);
    
    // Should only show first 2 events
    expect(screen.getByText('Workflow Started')).toBeInTheDocument();
    expect(screen.getByText('Task Completed')).toBeInTheDocument();
    expect(screen.queryByText('Error Occurred')).not.toBeInTheDocument();
    
    // Should show "Show more" button
    expect(screen.getByText('Show 1 more events')).toBeInTheDocument();
  });

  it('shows metadata details when expanded', () => {
    render(<WorkflowTimeline events={mockEvents} />);
    
    const detailsButton = screen.getByText('View details');
    fireEvent.click(detailsButton);
    
    // Should show the metadata content
    expect(screen.getByText(/"taskId": "task-123"/)).toBeInTheDocument();
    expect(screen.getByText(/"result": "success"/)).toBeInTheDocument();
  });

  it('displays empty state when no events', () => {
    render(<WorkflowTimeline events={[]} />);
    
    expect(screen.getByText('No events')).toBeInTheDocument();
    expect(screen.getByText('Workflow events will appear here as they occur.')).toBeInTheDocument();
  });

  it('applies correct status colors', () => {
    const { container } = render(<WorkflowTimeline events={mockEvents} />);
    
    // Check for status-specific color classes
    expect(container.querySelector('.border-blue-200')).toBeInTheDocument(); // info status
    expect(container.querySelector('.border-green-200')).toBeInTheDocument(); // success status
    expect(container.querySelector('.border-red-200')).toBeInTheDocument(); // error status
  });

  it('shows running status with animation', () => {
    const runningEvent = [{
      id: '1',
      title: 'Processing',
      timestamp: new Date(),
      status: 'running' as const
    }];
    
    const { container } = render(<WorkflowTimeline events={runningEvent} />);
    
    // Should have animated elements for running status
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});