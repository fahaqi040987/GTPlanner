import React from 'react';
import { render, screen } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  test('renders primary button with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('renders with icon', () => {
    render(<Button icon="add">Add Item</Button>);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByText('add')).toBeInTheDocument();
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('renders secondary variant', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-fixed');
  });

  test('renders outline variant', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });

  test('renders different sizes', () => {
    const { container: smContainer } = render(<Button size="sm">Small</Button>);
    const { container: lgContainer } = render(<Button size="lg">Large</Button>);
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
  });
});
