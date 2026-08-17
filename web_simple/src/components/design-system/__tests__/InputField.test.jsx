import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputField from '../InputField';

describe('InputField Component', () => {
  test('renders input with label', () => {
    render(<InputField label="Email" name="email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('renders required indicator when required', () => {
    render(<InputField label="Password" name="password" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('shows error message when provided', () => {
    render(<InputField label="Email" name="email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  test('calls onChange when input changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<InputField label="Email" name="email" value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test@example.com');

    expect(handleChange).toHaveBeenCalled();
  });

  test('renders with placeholder', () => {
    render(<InputField label="Email" name="email" placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  test('applies error styles when error is present', () => {
    render(<InputField label="Email" name="email" error="Required" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-error');
  });
});
