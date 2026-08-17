import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge Component', () => {
  test('renders draft variant', () => {
    render(<StatusBadge status="Draft" variant="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  test('renders published variant', () => {
    const { container } = render(<StatusBadge status="Published" variant="published" />);
    expect(screen.getByText('Published')).toBeInTheDocument();
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-secondary-container/20');
  });

  test('renders error variant', () => {
    const { container } = render(<StatusBadge status="Error" variant="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    const badge = container.firstChild;
    expect(badge).toHaveClass('bg-error-container/20');
  });

  test('renders status dot for draft', () => {
    const { container } = render(<StatusBadge status="Draft" variant="draft" />);
    const badge = container.firstChild;
    const dot = badge.querySelector('span');
    expect(dot).toHaveClass('bg-primary');
  });

  test('renders status dot for published', () => {
    const { container } = render(<StatusBadge status="Published" variant="published" />);
    const badge = container.firstChild;
    const dot = badge.querySelector('span');
    expect(dot).toHaveClass('bg-secondary');
  });

  test('renders status dot for error', () => {
    const { container } = render(<StatusBadge status="Error" variant="error" />);
    const badge = container.firstChild;
    const dot = badge.querySelector('span');
    expect(dot).toHaveClass('bg-error');
  });
});
