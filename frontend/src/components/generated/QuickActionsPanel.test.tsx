import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickActionsPanel } from './QuickActionsPanel';

// Mock console.log to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('QuickActionsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  it('renders without crashing', () => {
    render(<QuickActionsPanel />);
  });

  it('displays the correct title', () => {
    render(<QuickActionsPanel title="Custom Actions" />);
    expect(screen.getByText('Custom Actions')).toBeInTheDocument();
  });

  it('shows all default actions', () => {
    render(<QuickActionsPanel />);
    
    expect(screen.getByText('Refresh Data')).toBeInTheDocument();
    expect(screen.getByText('Health Check')).toBeInTheDocument();
    expect(screen.getByText('Backup Data')).toBeInTheDocument();
    expect(screen.getByText('Clear Cache')).toBeInTheDocument();
    expect(screen.getByText('Export Logs')).toBeInTheDocument();
    expect(screen.getByText('Restart Services')).toBeInTheDocument();
  });

  it('displays action descriptions', () => {
    render(<QuickActionsPanel />);
    
    expect(screen.getByText('Update all dashboard metrics')).toBeInTheDocument();
    expect(screen.getByText('Run system diagnostics')).toBeInTheDocument();
    expect(screen.getByText('Create system backup')).toBeInTheDocument();
  });

  it('shows category badges for actions', () => {
    render(<QuickActionsPanel />);
    
    expect(screen.getAllByText('system')).toHaveLength(3); // Health Check, Clear Cache, Restart Services
    expect(screen.getAllByText('data')).toHaveLength(3); // Refresh Data, Backup Data, Export Logs
  });

  it('executes actions when clicked', async () => {
    const mockOnActionExecuted = jest.fn();
    render(<QuickActionsPanel onActionExecuted={mockOnActionExecuted} />);
    
    const refreshButton = screen.getByText('Refresh Data').closest('button');
    expect(refreshButton).toBeInTheDocument();
    
    fireEvent.click(refreshButton!);
    
    // Should show executing state
    await waitFor(() => {
      expect(screen.getByText('Executing...')).toBeInTheDocument();
    });
    
    // Wait for action to complete
    await waitFor(() => {
      expect(screen.getByText('Completed ✓')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(mockOnActionExecuted).toHaveBeenCalledWith('refresh-data');
  });

  it('prevents multiple simultaneous executions', async () => {
    render(<QuickActionsPanel />);
    
    const refreshButton = screen.getByText('Refresh Data').closest('button');
    const healthButton = screen.getByText('Health Check').closest('button');
    
    // Click first action
    fireEvent.click(refreshButton!);
    
    // Try to click second action while first is executing
    fireEvent.click(healthButton!);
    
    // Should only show one executing action
    await waitFor(() => {
      const executingElements = screen.getAllByText('Executing...');
      expect(executingElements).toHaveLength(1);
    });
  });

  it('shows action count', () => {
    render(<QuickActionsPanel />);
    
    expect(screen.getByText('6 actions available')).toBeInTheDocument();
  });

  it('displays action status in footer', () => {
    render(<QuickActionsPanel />);
    
    expect(screen.getByText('Ready for actions')).toBeInTheDocument();
    expect(screen.getByText(/Last action:/)).toBeInTheDocument();
  });

  it('updates last action after execution', async () => {
    render(<QuickActionsPanel />);
    
    const refreshButton = screen.getByText('Refresh Data').closest('button');
    fireEvent.click(refreshButton!);
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Last action: Refresh Data')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows icons for each action', () => {
    render(<QuickActionsPanel />);
    
    // Check that emoji icons are present (they should be in the DOM as text)
    expect(screen.getByText('🔄')).toBeInTheDocument(); // Refresh
    expect(screen.getByText('🏥')).toBeInTheDocument(); // Health Check
    expect(screen.getByText('💾')).toBeInTheDocument(); // Backup
    expect(screen.getByText('🧹')).toBeInTheDocument(); // Clear Cache
    expect(screen.getByText('📋')).toBeInTheDocument(); // Export Logs
    expect(screen.getByText('⚡')).toBeInTheDocument(); // Restart Services
  });

  it('handles disabled actions', () => {
    // This test would be more relevant if we had disabled actions in the default set
    // For now, just verify that the disabled prop would work
    render(<QuickActionsPanel />);
    
    // All buttons should be enabled by default
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toBeDisabled();
    });
  });
});