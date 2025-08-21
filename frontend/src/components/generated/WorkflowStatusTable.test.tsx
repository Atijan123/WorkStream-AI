import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkflowStatusTable } from './WorkflowStatusTable';

describe('WorkflowStatusTable', () => {
  it('renders without crashing', () => {
    render(<WorkflowStatusTable title="Workflow Status Table" dataSource="workflows" />);
  });

  it('displays the correct content', () => {
    render(<WorkflowStatusTable title="Workflow Status Table" dataSource="workflows" />);
    expect(screen.getByText('Workflow Status Table')).toBeInTheDocument();
  });
});