/**
 * Main layout component with dropdown navigation
 */
import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';
import DropdownMenu from './DropdownMenu';

function Layout() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(window.location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Download handler functions
  const handleDownload = async (prd, format) => {
    // Import download helpers dynamically to avoid circular dependencies
    const { downloadHelpers } = await import('../services/api');

    try {
      let content, filename, mimeType;

      if (format === 'md') {
        content = downloadHelpers.generateMarkdown(prrd);
        filename = downloadHelpers.sanitizeFilename(prrd.title, prd.id) + '.md';
        mimeType = 'text/markdown';
      } else if (format === 'json') {
        content = downloadHelpers.generateJSON(prd);
        filename = downloadHelpers.sanitizeFilename(prrd.title, prd.id) + '.json';
        mimeType = 'application/json';
      }

      downloadHelpers.downloadFile(content, filename, mimeType);
      console.log(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  // Menu items configuration
  const menuItems = [
    {
      label: 'Dashboard',
      icon: '📊',
      action: () => navigate('/dashboard')
    },
    {
      label: 'New PRD',
      icon: '✨',
      action: () => navigate('/prd/new')
    },
    {
      label: 'Export PRD',
      icon: '📥',
      requiresContext: 'prd',
      submenu: [
        {
          label: 'Download as Markdown',
          icon: '📄',
          action: () => {
            // This will be implemented per-page
            console.log('Download .md');
          }
        },
        {
          label: 'Download as JSON',
          icon: '📊',
          action: () => {
            // This will be implemented per-page
            console.log('Download .json');
          }
        }
      ]
    },
    {
      label: 'Settings',
      icon: '⚙️',
      badge: 'Soon',
      action: () => console.log('Settings coming soon')
    },
    {
      label: 'Help',
      icon: '❓',
      action: () => console.log('Help documentation coming soon')
    }
  ];

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <Link to="/dashboard" className="logo">
            GTPlanner
          </Link>

          {/* Dropdown Navigation */}
          <DropdownMenu
            items={menuItems}
            position="bottom"
            context={currentPage.includes('/prd/') ? 'prd' : ''}
          />

          <div className="user-menu">
            <span className="user-email">{user?.email}</span>
            <button onClick={handleLogout} className="btn btn-ghost">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
