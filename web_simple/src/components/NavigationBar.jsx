/**
 * Global Navigation Bar Component
 * Fixed navigation across all pages with responsive menu
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserMenu from './UserMenu';

function NavigationBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/prd/new', label: 'New PRD' },
    { path: '/settings', label: 'Settings' },
  ];

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
        </div>
      )}
    </nav>
  );
}

export default NavigationBar;