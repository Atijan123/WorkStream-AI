import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskBoard } from './TaskBoard';

describe('TaskBoard', () => {
  const mockColumns = [
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        {
          id: '1',
          title: 'Test Task 1',
          description: 'Test description',
          priority: 'high' as const,
          assignee: 'John Doe',
          dueDate: '2024-01-15'
        }
      ]
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [
        {
          id: '2',
          title: 'Test Task 2',
          priority: 'low' as const
        }
      ]
    }
  ];

  it('renders without crashing', () => {
    render(<TaskBoard />);
  });

  it('displays the correct title', () => {
    render(<TaskBoard title="Task Management Board" />);
    expect(screen.getByText('Task Management Board')).toBeInTheDocument();
  });

  it('displays custom title when provided', () => {
    const customTitle = 'Project Board';
    render(<TaskBoard title={customTitle} />);
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('renders all columns', () => {
    render(<TaskBoard columns={mockColumns} />);
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders tasks in correct columns', () => {
    render(<TaskBoard columns={mockColumns} />);
    
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('displays task count for each column', () => {
    render(<TaskBoard columns={mockColumns} />);
    
    // Each column should show the number of tasks
    const taskCounts = screen.getAllByText('1');
    expect(taskCounts.length).toBeGreaterThanOrEqual(2); // At least one for each column
  });

  it('displays priority badges correctly', () => {
    render(<TaskBoard columns={mockColumns} />);
    
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
  });

  it('displays assignee initials', () => {
    render(<TaskBoard columns={mockColumns} />);
    
    // John Doe should show as "JD"
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('displays due dates when provided', () => {
    render(<TaskBoard columns={mockColumns} />);
    
    // Should format and display the due date
    expect(screen.getByText('Jan 15')).toBeInTheDocument();
  });

  it('calls onTaskClick when task is clicked', () => {
    const mockOnTaskClick = jest.fn();
    render(<TaskBoard columns={mockColumns} onTaskClick={mockOnTaskClick} />);
    
    const task = screen.getByText('Test Task 1');
    fireEvent.click(task);
    
    expect(mockOnTaskClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        title: 'Test Task 1'
      })
    );
  });

  it('displays board statistics', () => {
    render(<TaskBoard columns={mockColumns} />);
    
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows correct total task count', () => {
    render(<TaskBoard columns={mockColumns} />);
    
    // Should show 2 total tasks (1 in each column)
    const totalTasksSection = screen.getByText('Total Tasks').closest('div');
    expect(totalTasksSection).toHaveTextContent('2');
  });

  it('shows correct high priority count', () => {
    render(<TaskBoard columns={mockColumns} />);
    
    // Should show 1 high priority task
    const highPrioritySection = screen.getByText('High Priority').closest('div');
    expect(highPrioritySection).toHaveTextContent('1');
  });

  it('renders add task buttons', () => {
    render(<TaskBoard columns={mockColumns} />);
    
    const addButtons = screen.getAllByText('Add Task');
    expect(addButtons.length).toBe(mockColumns.length);
  });

  it('handles drag and drop events', () => {
    const mockOnTaskMove = jest.fn();
    render(<TaskBoard columns={mockColumns} onTaskMove={mockOnTaskMove} />);
    
    const task = screen.getByText('Test Task 1').closest('div');
    
    // Simulate drag start
    if (task) {
      fireEvent.dragStart(task);
      expect(task).toHaveClass('opacity-50'); // Should show dragging state
    }
  });

  it('applies correct priority colors', () => {
    render(<TaskBoard columns={mockColumns} />);
    
    const highPriorityTask = screen.getByText('Test Task 1').closest('div');
    const lowPriorityTask = screen.getByText('Test Task 2').closest('div');
    
    expect(highPriorityTask).toHaveClass('border-l-red-500');
    expect(lowPriorityTask).toHaveClass('border-l-green-500');
  });
});