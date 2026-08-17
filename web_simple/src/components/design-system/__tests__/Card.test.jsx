import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card Component', () => {
  test('renders children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  test('renders with different padding', () => {
    const { container: smContainer } = render(<Card padding="sm">Small</Card>);
    const { container: lgContainer } = render(<Card padding="lg">Large</Card>);
    const { container: xlContainer } = render(<Card padding="xl">Extra</Card>);

    expect(smContainer.firstChild).toHaveClass('p-sm');
    expect(lgContainer.firstChild).toHaveClass('p-lg');
    expect(xlContainer.firstChild).toHaveClass('p-xl');
  });

  test('renders with different elevations', () => {
    const { container: noneContainer } = render(<Card elevation="none">None</Card>);
    const { container: smallContainer } = render(<Card elevation="small">Small</Card>);
    const { container: mediumContainer } = render(<Card elevation="medium">Medium</Card>);
    const { container: largeContainer } = render(<Card elevation="large">Large</Card>);

    expect(noneContainer.firstChild).toHaveClass('shadow-none');
    expect(smallContainer.firstChild).toHaveClass('shadow-[0_2px_4px_-1px_rgba(0,0,0,0.1)]');
    expect(mediumContainer.firstChild).toHaveClass('shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)]');
    expect(largeContainer.firstChild).toHaveClass('shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]');
  });

  test('renders with default elevation medium', () => {
    const { container } = render(<Card>Default</Card>);
    expect(container.firstChild).toHaveClass('shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)]');
  });

  test('renders with no padding when padding is none', () => {
    const { container } = render(<Card padding="none">No Padding</Card>);
    const card = container.firstChild;
    const classes = card.className;
    expect(classes).not.toContain('p-');
  });
});
