import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotesWidgetDashboardWidget } from './NotesWidgetDashboardWidget';

describe('NotesWidgetDashboardWidget', () => {
  it('renders without crashing', () => {
    render(<NotesWidgetDashboardWidget  />);
  });

  it('displays the correct content', () => {
    render(<NotesWidgetDashboardWidget  />);
        // Add specific test assertions based on component functionality
  });
});
