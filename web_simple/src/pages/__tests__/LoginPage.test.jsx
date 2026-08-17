import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '../LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const renderWithRouter = (component) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('LoginPage - DesignStitch Design', () => {
  test('renders Secure Login header', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('Secure Login')).toBeInTheDocument();
  });

  test('shows GTPlanner branding', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('GTPlanner')).toBeInTheDocument();
  });

  test('displays JWT security badge', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('JWT-Secured Environment')).toBeInTheDocument();
  });

  test('has email and password input fields', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('shows authentication description', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('Authenticate to access engineering workspaces.')).toBeInTheDocument();
  });

  test('has sign in button', () => {
    renderWithRouter(<LoginPage />);
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
  });

  test('has toggle link for registration', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  test('shows terminal icon in branding', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('terminal')).toBeInTheDocument();
  });
});
