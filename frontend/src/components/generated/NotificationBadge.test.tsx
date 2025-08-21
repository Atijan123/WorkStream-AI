import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationBadge } from './NotificationBadge';

describe('NotificationBadge', () => {
  it('renders without crashing', () => {
    render(<NotificationBadge count={5} />);
  });

  it('displays the correct count', () => {
    render(<NotificationBadge count={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays max count with plus when count exceeds maxCount', () => {
    render(<NotificationBadge count={150} maxCount={99} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('does not render when count is 0', () => {
    const { container } = render(<NotificationBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('applies correct color classes', () => {
    render(<NotificationBadge count={5} color="blue" />);
    const badge = screen.getByText('5');
    expect(badge).toHaveClass('bg-blue-500', 'text-white');
  });

  it('applies correct size classes', () => {
    render(<NotificationBadge count={5} size="large" />);
    const badge = screen.getByText('5');
    expect(badge).toHaveClass('h-6', 'w-6', 'text-sm');
  });

  it('uses default props when not specified', () => {
    render(<NotificationBadge count={5} />);
    const badge = screen.getByText('5');
    expect(badge).toHaveClass('bg-red-500', 'h-5', 'w-5');
  });
});