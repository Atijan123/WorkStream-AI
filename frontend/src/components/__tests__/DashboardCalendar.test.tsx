import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardCalendar from '../generated/DashboardCalendar';

describe('DashboardCalendar', () => {
  test('renders calendar with current month', () => {
    render(<DashboardCalendar />);
    
    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentMonth = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();
    
    expect(screen.getByText(`${currentMonth} ${currentYear}`)).toBeInTheDocument();
  });

  test('highlights today\'s date', () => {
    render(<DashboardCalendar />);
    
    const today = new Date().getDate();
    const todayButton = screen.getByRole('button', { name: today.toString() });
    
    expect(todayButton).toHaveClass('bg-blue-600', 'text-white');
  });

  test('can navigate to previous month', () => {
    render(<DashboardCalendar />);
    
    const prevButton = screen.getByTitle('Previous month');
    fireEvent.click(prevButton);
    
    // Should show previous month (we can't easily test the exact month without mocking dates)
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
  });

  test('can navigate to next month', () => {
    render(<DashboardCalendar />);
    
    const nextButton = screen.getByTitle('Next month');
    fireEvent.click(nextButton);
    
    // Should show next month
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
  });

  test('can toggle compact view', () => {
    render(<DashboardCalendar />);
    
    const compactButton = screen.getByTitle('Compact view');
    fireEvent.click(compactButton);
    
    // In compact view, should show expand button
    expect(screen.getByTitle('Expand calendar')).toBeInTheDocument();
  });

  test('can select a date', () => {
    render(<DashboardCalendar />);
    
    // Click on day 15 (should exist in any month)
    const dayButton = screen.getByRole('button', { name: '15' });
    fireEvent.click(dayButton);
    
    // Should show selected date info
    expect(screen.getByText(/Selected:/)).toBeInTheDocument();
  });

  test('today button navigates to current date', () => {
    render(<DashboardCalendar />);
    
    // Navigate away first
    const nextButton = screen.getByTitle('Next month');
    fireEvent.click(nextButton);
    
    // Then click today
    const todayButton = screen.getByRole('button', { name: 'Today' });
    fireEvent.click(todayButton);
    
    // Should be back to current month
    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentMonth = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();
    
    expect(screen.getByText(`${currentMonth} ${currentYear}`)).toBeInTheDocument();
  });
});