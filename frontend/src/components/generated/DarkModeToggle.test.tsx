import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DarkModeToggle } from './DarkModeToggle';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('DarkModeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.classList.remove('dark');
  });

  it('renders without crashing', () => {
    render(<DarkModeToggle />);
  });

  it('displays light mode by default', () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<DarkModeToggle />);
    
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('displays dark mode when saved in localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    render(<DarkModeToggle />);
    
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles dark mode when clicked', () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<DarkModeToggle />);
    
    const toggle = screen.getByRole('switch');
    
    // Initially light mode
    expect(screen.getByText('Light')).toBeInTheDocument();
    
    // Click to toggle to dark mode
    fireEvent.click(toggle);
    
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    // Click again to toggle back to light mode
    fireEvent.click(toggle);
    
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('has proper accessibility attributes', () => {
    render(<DarkModeToggle />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-label', 'Toggle dark mode');
    expect(toggle).toHaveAttribute('aria-checked');
  });

  it('applies custom className', () => {
    const { container } = render(<DarkModeToggle className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows correct icons for light and dark modes', () => {
    render(<DarkModeToggle />);
    
    // Should show sun icon in light mode
    expect(document.querySelector('svg')).toBeInTheDocument();
    
    // Toggle to dark mode
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    
    // Should show moon icon in dark mode
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});