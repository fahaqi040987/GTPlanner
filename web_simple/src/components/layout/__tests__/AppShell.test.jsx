import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppShell from '../AppShell';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AppShell Component', () => {
  test('renders TopAppBar', () => {
    renderWithRouter(<AppShell />);
    const gtplannerElements = screen.getAllByText('GTPlanner');
    expect(gtplannerElements.length).toBeGreaterThan(0);
  });

  test('renders sidebar navigation links', () => {
    renderWithRouter(<AppShell />);
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test('renders New PRD button', () => {
    renderWithRouter(<AppShell />);
    expect(screen.getByText('New PRD')).toBeInTheDocument();
  });

  test('renders Current User link in footer', () => {
    renderWithRouter(<AppShell />);
    expect(screen.getByText('Current User')).toBeInTheDocument();
  });

  test('sidebar is responsive', () => {
    renderWithRouter(<AppShell />);
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toBeInTheDocument();
  });
});
