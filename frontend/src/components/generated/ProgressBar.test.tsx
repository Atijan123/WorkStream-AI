import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    render(<ProgressBar />);
  });

  it('displays correct percentage', () => {
    render(<ProgressBar value={50} max={100} showPercentage={true} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<ProgressBar value={75} label="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('calculates percentage correctly with custom max', () => {
    render(<ProgressBar value={25} max={50} showPercentage={true} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('caps percentage at 100%', () => {
    render(<ProgressBar value={150} max={100} showPercentage={true} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows minimum 0% for negative values', () => {
    render(<ProgressBar value={-10} max={100} showPercentage={true} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('applies correct color classes', () => {
    render(<ProgressBar value={50} color="green" />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('bg-green-500');
  });

  it('applies correct size classes', () => {
    render(<ProgressBar value={50} size="large" />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('h-4');
  });

  it('shows value/max for large size', () => {
    render(<ProgressBar value={30} max={100} size="large" />);
    expect(screen.getByText('30 / 100')).toBeInTheDocument();
  });

  it('does not show percentage when showPercentage is false', () => {
    render(<ProgressBar value={50} showPercentage={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<ProgressBar value={60} max={100} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '60');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('applies animation class when animated is true', () => {
    render(<ProgressBar value={50} animated={true} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('animate-pulse');
  });
});