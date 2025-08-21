import React from 'react';
import { render, screen } from '@testing-library/react';
import { QuickActionButton } from './QuickActionButton';

describe('QuickActionButton', () => {
  it('renders without crashing', () => {
    render(<QuickActionButton title="Execute Workflow" action="execute" />);
  });

  it('displays the correct content', () => {
    render(<QuickActionButton title="Execute Workflow" action="execute" />);
    expect(screen.getByText('Execute Workflow')).toBeInTheDocument();
  });
});