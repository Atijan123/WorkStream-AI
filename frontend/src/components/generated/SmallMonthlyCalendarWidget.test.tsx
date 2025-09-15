import React from 'react';
import { render, screen } from '@testing-library/react';
import { SmallMonthlyCalendarWidget } from './SmallMonthlyCalendarWidget';

describe('SmallMonthlyCalendarWidget', () => {
  it('renders without crashing', () => {
    render(<SmallMonthlyCalendarWidget  />);
  });

  it('displays the correct content', () => {
    render(<SmallMonthlyCalendarWidget  />);
        // Add specific test assertions based on component functionality
  });
});
