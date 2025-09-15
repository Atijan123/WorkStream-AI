import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiveSystemStatus } from './LiveSystemStatus';

// Mock setTimeout and clearInterval
jest.useFakeTimers();

describe('LiveSystemStatus', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<LiveSystemStatus />);
  });

  it('displays the correct title', () => {
    render(<LiveSystemStatus title="Custom Status Monitor" />);
    expect(screen.getByText('Custom Status Monitor')).toBeInTheDocument();
  });

  it('shows default services', () => {
    render(<LiveSystemStatus />);
    
    expect(screen.getByText('API Server')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('WebSocket')).toBeInTheDocument();
    expect(screen.getByText('File Storage')).toBeInTheDocument();
  });

  it('displays service status information', () => {
    render(<LiveSystemStatus />);
    
    // Check for uptime and response time information
    expect(screen.getByText(/Uptime:/)).toBeInTheDocument();
    expect(screen.getByText(/Response:/)).toBeInTheDocument();
  });

  it('shows overall system status', () => {
    render(<LiveSystemStatus />);
    
    // Should show some kind of overall status
    const statusElements = screen.getAllByText(/Systems|Issues/);
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('has a refresh button that works', async () => {
    render(<LiveSystemStatus />);
    
    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();
    
    fireEvent.click(refreshButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeDisabled();
    });
  });

  it('displays status indicators', () => {
    render(<LiveSystemStatus />);
    
    // Should have status badges
    const statusBadges = screen.getAllByText(/online|warning|offline/i);
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('shows summary statistics', () => {
    render(<LiveSystemStatus />);
    
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('updates automatically based on refresh interval', () => {
    render(<LiveSystemStatus refreshInterval={1000} />);
    
    // Fast-forward time to trigger auto-refresh
    jest.advanceTimersByTime(1000);
    
    // The component should have set up an interval
    expect(setInterval).toHaveBeenCalled();
  });

  it('shows last updated timestamp', () => {
    render(<LiveSystemStatus />);
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });
});