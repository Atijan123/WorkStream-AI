import React from 'react';
import { render, screen } from '@testing-library/react';
import { RealTimeActivityFeed } from './RealTimeActivityFeed';

describe('RealTimeActivityFeed', () => {
  it('renders without crashing', () => {
    render(<RealTimeActivityFeed />);
  });

  it('displays the correct content', () => {
    render(<RealTimeActivityFeed title="Test Activity Feed" maxItems={5} />);
    expect(screen.getByText('Test Activity Feed')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Daily Sales Report workflow completed successfully')).toBeInTheDocument();
    expect(screen.getByText('View all activity →')).toBeInTheDocument();
  });

  it('displays activity items with correct icons and timestamps', () => {
    render(<RealTimeActivityFeed />);
    
    // Check for activity icons
    expect(screen.getByText('⚙️')).toBeInTheDocument(); // workflow
    expect(screen.getByText('💡')).toBeInTheDocument(); // feature_request
    expect(screen.getByText('🖥️')).toBeInTheDocument(); // system
    expect(screen.getByText('⚠️')).toBeInTheDocument(); // alert
    
    // Check for timestamp formatting
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('limits items based on maxItems prop', () => {
    render(<RealTimeActivityFeed maxItems={2} />);
    
    // Should only show first 2 items
    expect(screen.getByText('Daily Sales Report workflow completed successfully')).toBeInTheDocument();
    expect(screen.getByText('New feature request: "Add user authentication system"')).toBeInTheDocument();
  });

  it('shows live indicator', () => {
    render(<RealTimeActivityFeed />);
    
    expect(screen.getByText('Live')).toBeInTheDocument();
    // Check for the animated pulse dot (by class)
    const pulseElement = document.querySelector('.animate-pulse');
    expect(pulseElement).toBeInTheDocument();
  });
});