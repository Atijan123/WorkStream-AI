import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserProfileCard } from './UserProfileCard';

describe('UserProfileCard', () => {
  it('renders without crashing', () => {
    render(<UserProfileCard />);
  });

  it('displays the correct content', () => {
    render(<UserProfileCard name="Jane Smith" email="jane@example.com" role="Admin" />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('displays default values when no props provided', () => {
    render(<UserProfileCard />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('displays avatar when provided', () => {
    render(<UserProfileCard avatar="https://example.com/avatar.jpg" name="Test User" />);
    const avatar = screen.getByAltText('Test User');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('displays default avatar icon when no avatar provided', () => {
    render(<UserProfileCard />);
    const defaultAvatar = screen.getByRole('img', { hidden: true });
    expect(defaultAvatar).toBeInTheDocument();
  });
});