import React from 'react';
import { render, screen } from '@testing-library/react';
import { DarkModeToggleWidget } from './DarkModeToggleWidget';

describe('DarkModeToggleWidget', () => {
  it('renders without crashing', () => {
    render(<DarkModeToggleWidget  />);
  });

  it('displays the correct content', () => {
    render(<DarkModeToggleWidget  />);
        // Add specific test assertions based on component functionality
  });
});
