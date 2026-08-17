import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import PRDDetailPage from '../PRDDetailPage';
import { documentAPI } from '../../services/api';

// Mock the API
vi.mock('../../services/api');

// Mock navigation
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
    useParams: () => ({ id: 'PRD-001' }),
  };
});

// Mock window.confirm
global.confirm = vi.fn(() => true);

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

describe('PRDDetailPage - DesignStitch Design', () => {
  const mockPRDData = {
    data: {
      id: 'PRD-001',
      title: 'Test PRD',
      content: '# Test Content\n\nThis is test content.\n\n## Section 1\n\nSome details.',
      status: 'Draft',
      created_at: '2023-10-24T10:00:00Z',
      updated_at: '2023-10-25T14:30:00Z',
      version: '1.0',
      tech_stack: {
        frontend: ['React', 'TailwindCSS'],
        backend: ['FastAPI', 'Python'],
        database: ['PostgreSQL'],
        devops: ['Docker', 'Kubernetes']
      },
      recommendations: {
        hardware_specs: {
          cpu_cores: 4,
          ram: '16GB',
          disk_space: '100GB SSD'
        },
        cloud_providers: [
          {
            name: 'AWS',
            estimated_monthly_cost: '$50-100'
          },
          {
            name: 'GCP',
            estimated_monthly_cost: '$45-90'
          }
        ]
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    documentAPI.get.mockResolvedValue(mockPRDData);
    documentAPI.update.mockResolvedValue({ data: { ...mockPRDData.data, content: 'Updated content' } });
    documentAPI.delete.mockResolvedValue({ success: true });
  });

  describe('Basic Rendering', () => {
    test('renders PRD title and ID', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Test PRD')).toBeInTheDocument();
        expect(screen.getByText('PRD-001')).toBeInTheDocument();
      });
    });

    test('renders status badge', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    test('renders PRD content with ReactMarkdown', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeInTheDocument();
        expect(screen.getByText('This is test content.')).toBeInTheDocument();
        expect(screen.getByText('Section 1')).toBeInTheDocument();
      });
    });

    test('renders created and modified dates', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Created/)).toBeInTheDocument();
        expect(screen.getByText(/Last Modified/)).toBeInTheDocument();
      });
    });

    test('renders version number', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('1.0')).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    test('has edit and export buttons', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText(/Export.*/)).toBeInTheDocument();
      });
    });

    test('has copy markdown and delete buttons', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Copy Markdown')).toBeInTheDocument();
        expect(screen.getByText(/Delete/)).toBeInTheDocument();
      });
    });

    test('back button navigates to dashboard', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        const backButton = screen.getByText('arrow_back');
        backButton.closest('button').click();
      });

      expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Edit Mode', () => {
    test('enters edit mode when edit button is clicked', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        editButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();
        const textarea = document.querySelector('textarea');
        expect(textarea).toBeInTheDocument();
        expect(textarea?.value).toContain('# Test Content');
      });
    });

    test('shows cancel button in edit mode', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        editButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Cancel/i)[0]).toBeInTheDocument();
      });
    });

    test('exits edit mode when cancel is clicked', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        editButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();
        // Click the cancel button in the edit form
        const saveButton = screen.getByText(/Save Changes/i).closest('button');
        const editCancelButton = saveButton.nextElementSibling;
        editCancelButton?.click();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Save Changes/i)).not.toBeInTheDocument();
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });
  });

  describe('Tech Stack Display', () => {
    test('renders tech stack section', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Technology Stack')).toBeInTheDocument();
      });
    });

    test('renders frontend technologies', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Frontend')).toBeInTheDocument();
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('TailwindCSS')).toBeInTheDocument();
      });
    });

    test('renders backend technologies', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Backend')).toBeInTheDocument();
        expect(screen.getByText('FastAPI')).toBeInTheDocument();
        expect(screen.getByText('Python')).toBeInTheDocument();
      });
    });

    test('renders database technologies', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      });
    });

    test('renders devops technologies', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('DevOps')).toBeInTheDocument();
        expect(screen.getByText('Docker')).toBeInTheDocument();
        expect(screen.getByText('Kubernetes')).toBeInTheDocument();
      });
    });
  });

  describe('Infrastructure Recommendations', () => {
    test('renders infrastructure section', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Infrastructure')).toBeInTheDocument();
      });
    });

    test('renders hardware specifications', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/CPU.*4 cores/)).toBeInTheDocument();
        expect(screen.getByText(/RAM.*16GB/)).toBeInTheDocument();
        expect(screen.getByText(/Disk.*100GB SSD/)).toBeInTheDocument();
      });
    });

    test('renders cloud providers', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Cloud Providers')).toBeInTheDocument();
        expect(screen.getByText('AWS')).toBeInTheDocument();
        expect(screen.getByText('GCP')).toBeInTheDocument();
      });
    });

    test('renders cost estimates', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/\$50-100/)).toBeInTheDocument();
        expect(screen.getByText(/\$45-90/)).toBeInTheDocument();
      });
    });
  });

  describe('Delete Functionality', () => {
    test('shows confirmation dialog when delete is clicked', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        const deleteButton = screen.getByText(/Delete/);
        deleteButton.click();
      });

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this PRD?');
    });

    test('calls delete API when confirmed', async () => {
      global.confirm.mockReturnValueOnce(true);

      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        const deleteButton = screen.getByText(/Delete/);
        deleteButton.click();
      });

      await waitFor(() => {
        expect(documentAPI.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading spinner while fetching data', () => {
      documentAPI.get.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<PRDDetailPage />);

      // Check for spinner element
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    test('shows error message when API call fails', async () => {
      documentAPI.get.mockRejectedValue(new Error('Failed to load'));

      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load PRD')).toBeInTheDocument();
      });
    });

    test('shows back button on error', async () => {
      documentAPI.get.mockRejectedValue(new Error('Failed to load'));

      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        const backButton = screen.getByText('Back to Dashboard');
        expect(backButton).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    test('calls documentAPI.get with correct ID on mount', () => {
      renderWithRouter(<PRDDetailPage />);

      expect(documentAPI.get).toHaveBeenCalledWith('PRD-001');
    });

    test('calls documentAPI.update when save is clicked', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        editButton.click();
      });

      await waitFor(() => {
        const saveButton = screen.getByText(/Save Changes/i);
        saveButton.click();
      });

      expect(documentAPI.update).toHaveBeenCalled();
    });
  });

  describe('Design System Components', () => {
    test('uses Card component for content sections', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeInTheDocument();
      });

      // Verify content is in a styled container (Card component)
      const contentContainer = screen.getByText('Test Content').closest('.bg-surface-container-lowest');
      expect(contentContainer).toBeInTheDocument();
    });

    test('uses Button component for actions', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        expect(editButton).toBeInTheDocument();
        expect(editButton.tagName).toBe('BUTTON');
      });
    });

    test('uses StatusBadge for status display', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        const statusBadge = screen.getByText('Draft');
        expect(statusBadge).toBeInTheDocument();
        expect(statusBadge.className).toContain('rounded-full');
      });
    });
  });

  describe('Responsive Layout', () => {
    test('renders responsive grid layout', async () => {
      renderWithRouter(<PRDDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Test PRD')).toBeInTheDocument();
      });

      // Check for grid classes
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer.className).toContain('lg:grid-cols-3');
    });
  });
});
