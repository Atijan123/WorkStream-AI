import React from 'react';
import { render, screen } from '@testing-library/react';
import { SystemPerformanceChart } from './SystemPerformanceChart';

describe('SystemPerformanceChart', () => {
  it('renders without crashing', () => {
    render(<SystemPerformanceChart title="System Performance Chart" dataSource="metrics" />);
  });

  it('displays the correct content', () => {
    render(<SystemPerformanceChart title="System Performance Chart" dataSource="metrics" />);
    expect(screen.getByText('System Performance Chart')).toBeInTheDocument();
  });
});