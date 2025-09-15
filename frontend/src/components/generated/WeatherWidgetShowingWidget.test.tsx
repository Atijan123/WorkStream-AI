import React from 'react';
import { render, screen } from '@testing-library/react';
import { WeatherWidgetShowingWidget } from './WeatherWidgetShowingWidget';

describe('WeatherWidgetShowingWidget', () => {
  it('renders without crashing', () => {
    render(<WeatherWidgetShowingWidget  />);
  });

  it('displays the correct content', () => {
    render(<WeatherWidgetShowingWidget  />);
        // Add specific test assertions based on component functionality
  });
});
