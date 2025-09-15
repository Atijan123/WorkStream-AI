import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationCounterButtonButton } from './NotificationCounterButtonButton';

describe('NotificationCounterButtonButton', () => {
  it('renders without crashing', () => {
    render(<NotificationCounterButtonButton  />);
  });

  it('displays the correct content', () => {
    render(<NotificationCounterButtonButton  />);
        // Add specific test assertions based on component functionality
  });
});
