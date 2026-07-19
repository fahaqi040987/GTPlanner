/**
 * Global Navigation Bar Component
 * Fixed navigation across all pages with responsive menu
 * Includes context-sensitive Export submenu on PRD detail pages
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import UserMenu from './UserMenu';
import { downloadHelpers } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { documentAPI } from '../services/api';

function NavigationBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const exportRef = useRef(null);
  const location = useLocation();

  // Determine if we're on a PRD detail page
  const isPRDDetailPage = /^\/prd\/\d+$/.test(location.pathname);
  const prdId = isPRDDetailPage ? location.pathname.split('/prd/')[1] : null;

  // Fetch PRD data only when on a PRD detail page
  const { data: prdResponse } = useQuery({
    queryKey: ['prd', prdId],
    queryFn: () => documentAPI.get(prdId),
    enabled: !!prdId,
    staleTime: 30000,
  });
  const prdData = prdResponse?.data;

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/prd/new', label: 'New PRD' },
    { path: '/settings', label: 'Settings' },
  ];

  // Close export submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavExport = async (format) => {
    if (!prdData) return;

    try {
      let content, filename, mimeType;

      if (format === 'md') {
        content = downloadHelpers.generateMarkdown(prdData);
        filename = downloadHelpers.sanitizeFilename(prdData.title, prdData.id) + '.md';
        mimeType = 'text/markdown';
      } else if (format === 'json') {
        content = downloadHelpers.generateJSON(prdData);
        filename = downloadHelpers.sanitizeFilename(prdData.title, prdData.id) + '.json';
        mimeType = 'application/json';
      }

      downloadHelpers.downloadFile(content, filename, mimeType);
      setExportStatus(`Downloaded ${filename}`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportMenuOpen(false);
    }
  };

  return (
    <nav className="navigation-bar">
      <div className="navigation-container">
        {/* Logo/Brand */}
        <div className="navigation-brand">
          <Link to="/dashboard" className="brand-link">
            <h1>GTPlanner</h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navigation-links desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}

          {/* Context-sensitive Export PRD submenu — only on PRD detail pages */}
          {isPRDDetailPage && (
            <div className="nav-export-wrapper" ref={exportRef}>
              <button
                className={`nav-link nav-export-btn ${exportMenuOpen ? 'active' : ''}`}
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                disabled={!prdData}
              >
                Export PRD ▾
              </button>

              {exportMenuOpen && (
                <div className="nav-export-dropdown">
                  <button
                    className="nav-export-option"
                    onClick={() => handleNavExport('md')}
                  >
                    <span>📄</span>
                    <span>Download .md</span>
                  </button>
                  <button
                    className="nav-export-option"
                    onClick={() => handleNavExport('json')}
                  >
                    <span>📊</span>
                    <span>Download .json</span>
                  </button>
                </div>
              )}

              {exportStatus && (
                <span className="nav-export-status">✓ {exportStatus}</span>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="navigation-user">
          <UserMenu />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-menu">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Context-sensitive export on mobile */}
          {isPRDDetailPage && (
            <>
              <button
                className="mobile-nav-link"
                onClick={() => { handleNavExport('md'); setMobileMenuOpen(false); }}
                disabled={!prdData}
              >
                📄 Export as Markdown
              </button>
              <button
                className="mobile-nav-link"
                onClick={() => { handleNavExport('json'); setMobileMenuOpen(false); }}
                disabled={!prdData}
              >
                📊 Export as JSON
              </button>
            </>
          )}

          {/* Mobile user menu — Bug 5 fix: show UserMenu on mobile */}
          <div className="mobile-nav-user">
            <UserMenu />
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavigationBar;