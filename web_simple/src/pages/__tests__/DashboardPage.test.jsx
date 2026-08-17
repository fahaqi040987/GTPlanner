import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../DashboardPage';

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

describe('DashboardPage - DesignStitch Design', () => {
  test('renders My Documents header', () => {
    renderWithRouter(<DashboardPage />);
    expect(screen.getByText('My Documents')).toBeInTheDocument();
  });

  test('renders New PRD button', () => {
    renderWithRouter(<DashboardPage />);
    expect(screen.getByText('New PRD')).toBeInTheDocument();
  });

  test('shows connected user email', () => {
    renderWithRouter(<DashboardPage />);
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  test('has pagination label', () => {
    renderWithRouter(<DashboardPage />);
    expect(screen.getByText(/Showing.*PRDs/i)).toBeInTheDocument();
  });
});
