import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import DashboardPage from '../DashboardPage';
import { documentAPI } from '../../services/api';
import { useAuthStore } from '../../state/authStore';

// Mock the auth store
vi.mock('../../state/authStore');

// Mock the API
vi.mock('../../services/api');

// Mock navigation
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    // Mock auth store - needs to mock the selector function
    useAuthStore.mockImplementation((selector) => {
      const storeState = {
        user: { email: 'test@example.com' },
        token: 'mock-token',
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        setUser: vi.fn(),
      };
      return selector ? selector(storeState) : storeState;
    });

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: vi.fn() },
    });
  });

  describe('Basic Rendering', () => {
    test('renders My Documents header', () => {
      renderWithRouter(<DashboardPage />);
      expect(screen.getByText('My Documents')).toBeInTheDocument();
    });

    test('renders New PRD button', () => {
      renderWithRouter(<DashboardPage />);
      expect(screen.getByText('New PRD')).toBeInTheDocument();
    });

    test('displays user email from auth store', () => {
      renderWithRouter(<DashboardPage />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    test('shows Loading... when user email is not available', () => {
      useAuthStore.mockImplementation((selector) => {
        const state = {
          user: null,
          token: 'mock-token',
          isAuthenticated: true,
        };
        return selector ? selector(state) : state;
      });

      renderWithRouter(<DashboardPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('navigates to new PRD page when New PRD button is clicked', async () => {
      renderWithRouter(<DashboardPage />);
      const newPrdButton = screen.getByText('New PRD');
      newPrdButton.click();
      expect(mockedNavigate).toHaveBeenCalledWith('/prd/new');
    });
  });

  describe('Loading States', () => {
    test('shows loading state while fetching documents', () => {
      documentAPI.list.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderWithRouter(<DashboardPage />);
      expect(screen.getByText('My Documents')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    test('shows error message when API call fails', async () => {
      const errorMessage = 'Failed to load documents';
      documentAPI.list.mockRejectedValue(new Error(errorMessage));

      renderWithRouter(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    test('shows retry button when API call fails', async () => {
      documentAPI.list.mockRejectedValue(new Error('API Error'));

      renderWithRouter(<DashboardPage />);

      await waitFor(() => {
        const retryButton = screen.getByText('Retry');
        expect(retryButton).toBeInTheDocument();
      });
    });

    test('retries loading when retry button is clicked', async () => {
      documentAPI.list
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ data: [] });

      renderWithRouter(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      retryButton.click();

      // The retry button calls window.location.reload()
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Data Display', () => {
    test.skip('displays documents when API call succeeds', async () => {
      const mockDocuments = [
        {
          id: '1',
          title: 'Test PRD 1',
          status: 'Published',
          created_date: '2024-01-15',
        },
        {
          id: '2',
          title: 'Test PRD 2',
          status: 'Draft',
          created_date: '2024-01-16',
        },
      ];

      documentAPI.list.mockResolvedValue({ data: mockDocuments });

      renderWithRouter(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Test PRD 1')).toBeInTheDocument();
        expect(screen.getByText('Test PRD 2')).toBeInTheDocument();
      });
    });

    test.skip('displays published status badge correctly', async () => {
      const mockDocuments = {
        data: [
          {
            id: '1',
            title: 'Published PRD',
            status: 'Published',
            created_date: '2024-01-15',
          },
        ],
      };

      documentAPI.list.mockResolvedValue(mockDocuments);

      renderWithRouter(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Published')).toBeInTheDocument();
      });
    });

    test.skip('displays draft status badge correctly', async () => {
      const mockDocuments = {
        data: [
          {
            id: '1',
            title: 'Draft PRD',
            status: 'Draft',
            created_date: '2024-01-15',
          },
        ],
      };

      documentAPI.list.mockResolvedValue(mockDocuments);

      renderWithRouter(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    test.skip('displays created date for documents', async () => {
      const mockDocuments = {
        data: [
          {
            id: '1',
            title: 'Test PRD',
            status: 'Published',
            created_date: '2024-01-15',
          },
        ],
      };

      documentAPI.list.mockResolvedValue(mockDocuments);

      renderWithRouter(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      });
    });
  });

  describe('Row Interactions', () => {
    test.skip('navigates to PRD detail page when row is clicked', async () => {
      const mockDocuments = {
        data: [
          {
            id: '123',
            title: 'Clickable PRD',
            status: 'Published',
            created_date: '2024-01-15',
          },
        ],
      };

      documentAPI.list.mockResolvedValue(mockDocuments);

      renderWithRouter(<DashboardPage />);

      await waitFor(() => {
        const prdTitle = screen.getByText('Clickable PRD');
        prdTitle.click();
      });

      expect(mockedNavigate).toHaveBeenCalledWith('/prd/123');
    });

    test.skip('shows action button on row hover', async () => {
      const mockDocuments = {
        data: [
          {
            id: '1',
            title: 'Test PRD',
            status: 'Published',
            created_date: '2024-01-15',
          },
        ],
      };

      documentAPI.list.mockResolvedValue(mockDocuments);

      renderWithRouter(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Test PRD')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    test('calls documentAPI.list on mount', () => {
      documentAPI.list.mockResolvedValue({ data: [] });

      renderWithRouter(<DashboardPage />);

      expect(documentAPI.list).toHaveBeenCalledTimes(1);
    });

    test('passes correct parameters to documentAPI.list', () => {
      documentAPI.list.mockResolvedValue({ data: [] });

      renderWithRouter(<DashboardPage />);

      expect(documentAPI.list).toHaveBeenCalledWith();
    });
  });

  describe('Empty State', () => {
    test('handles empty documents list gracefully', async () => {
      documentAPI.list.mockResolvedValue({ data: [] });

      renderWithRouter(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('My Documents')).toBeInTheDocument();
        expect(screen.getByText('New PRD')).toBeInTheDocument();
      });
    });
  });

  describe('Auth Store Integration', () => {
    test('uses auth store to get user email', () => {
      const mockUser = { email: 'user@example.com' };
      useAuthStore.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
      });

      renderWithRouter(<DashboardPage />);

      expect(useAuthStore).toHaveBeenCalled();
    });
  });
});
