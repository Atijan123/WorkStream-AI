import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserManagementTableTable } from './UserManagementTableTable';

describe('UserManagementTableTable', () => {
  it('renders without crashing', () => {
    render(<UserManagementTableTable  />);
  });

  it('displays the correct content', () => {
    render(<UserManagementTableTable  />);
        // Add specific test assertions based on component functionality
  });
});
