import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContactFormCustomerForm } from './ContactFormCustomerForm';

describe('ContactFormCustomerForm', () => {
  it('renders without crashing', () => {
    render(<ContactFormCustomerForm  />);
  });

  it('displays the correct content', () => {
    render(<ContactFormCustomerForm  />);
        // Add specific test assertions based on component functionality
  });
});
