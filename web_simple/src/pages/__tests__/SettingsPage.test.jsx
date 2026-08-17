import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SettingsPage from '../SettingsPage';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SettingsPage - DesignStitch Design', () => {
  test('renders Settings header', () => {
    renderWithRouter(<SettingsPage />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('has appearance settings section', () => {
    renderWithRouter(<SettingsPage />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  test('has editor settings section', () => {
    renderWithRouter(<SettingsPage />);
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Auto Save')).toBeInTheDocument();
  });

  test('has save settings button', () => {
    renderWithRouter(<SettingsPage />);
    expect(screen.getByText('Save Settings')).toBeInTheDocument();
  });
});
