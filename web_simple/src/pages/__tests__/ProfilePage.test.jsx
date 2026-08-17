import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../ProfilePage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../state/authStore';
import { vi } from 'vitest';

vi.mock('@tanstack/react-query');
vi.mock('../../services/api');
vi.mock('../../state/authStore');

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProfilePage - DesignStitch Design', () => {
  beforeEach(() => {
    useAuthStore.mockReturnValue({
      user: { name: 'Test User', email: 'test@example.com' },
      isAuthenticated: true
    });
    
    useQuery.mockReturnValue({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        bio: 'Test bio',
        document_count: 5,
        published_count: 3,
        member_since: '2023'
      },
      isLoading: false,
      error: null
    });

    useMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders User Profile header', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('User Profile')).toBeInTheDocument();
  });

  test('displays user information', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getAllByText('Test User')[0]).toBeInTheDocument();
    expect(screen.getAllByText('test@example.com')[0]).toBeInTheDocument();
  });

  test('has edit profile button', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  test('displays account statistics', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('5')).toBeInTheDocument(); // Documents
    expect(screen.getByText('3')).toBeInTheDocument(); // Published
  });

  describe('Edit Mode', () => {
    test('enters edit mode when edit button is clicked', async () => {
      renderWithRouter(<ProfilePage />);
      
      const editButton = screen.getByText('Edit Profile');
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
        const textarea = document.querySelector('textarea');
        expect(textarea).toBeInTheDocument();
        expect(textarea.value).toContain('Test bio');
      });
    });

    test('exits edit mode when cancel is clicked', async () => {
      renderWithRouter(<ProfilePage />);
      
      // Enter edit mode
      fireEvent.click(screen.getByText('Edit Profile'));
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      // Click the second cancel button (inside the form)
      const saveButton = screen.getByText('Save Changes').closest('button');
      const editCancelButton = saveButton.nextElementSibling;
      fireEvent.click(editCancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });
    });
  });
});
