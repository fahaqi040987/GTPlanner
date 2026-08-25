/**
 * Enhanced Navigation Bar with AI Transformation Elements
 * Features AI badge, glimmer effects, and intelligent presence
 */
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';

function NavigationBarEnhanced({ isAuthenticated }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiPulse, setAiPulse] = useState(false);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    // Subtle AI pulse animation every 8 seconds
    const pulseInterval = setInterval(() => {
      setAiPulse(true);
      setTimeout(() => setAiPulse(false), 2000);
    }, 8000);

    return () => clearInterval(pulseInterval);
  }, []);

  const navLinks = isAuthenticated ? [
    { path: '/dashboard', label: 'Workspace', icon: '🏠' },
    { path: '/prd/new', label: 'Create', icon: '⚡' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ] : [];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`navigation-bar ai-enhanced ${aiPulse ? 'ai-pulse-active' : ''}`}>
      <div className="navigation-container">
        {/* Enhanced Brand with AI Badge */}
        <div className="navigation-brand">
          <Link to="/" className="brand-link">
            <div className="brand-ai-badge">
              <span className="badge-icon">🤖</span>
              <span className="badge-text">AI</span>
            </div>
            <h1 className="brand-title">GTPlanner</h1>
            <div className="brand-glow"></div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <div className="navigation-links desktop-nav">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-label">{link.label}</span>
                {isActive(link.path) && (
                  <div className="nav-indicator">
                    <div className="indicator-dot"></div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* User Menu / Login CTA */}
        <div className="navigation-user">
          {isAuthenticated ? (
            <div className="user-menu-enhanced">
              <button
                className="user-trigger glimmer-border"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="User menu"
              >
                <div className="user-avatar">
                  <span className="avatar-initial">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                  <div className="avatar-ring"></div>
                </div>
                <div className="user-info">
                  <span className="user-email">{user?.email || 'user@example.com'}</span>
                  <span className="user-status">
                    <span className="status-dot"></span>
                    AI Connected
                  </span>
                </div>
                <span className={`dropdown-arrow ${mobileMenuOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </button>

              {mobileMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-header">
                    <div className="header-ai-badge">AI</div>
                    <span className="header-email">{user?.email || 'user@example.com'}</span>
                  </div>

                  <div className="dropdown-divider"></div>

                  <button className="dropdown-item">
                    <span className="item-icon">👤</span>
                    <span className="item-label">Profile</span>
                  </button>

                  <button className="dropdown-item">
                    <span className="item-icon">⚙️</span>
                    <span className="item-label">Preferences</span>
                  </button>

                  <button className="dropdown-item">
                    <span className="item-icon">📊</span>
                    <span className="item-label">Usage Stats</span>
                  </button>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item dropdown-logout"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="item-icon">🚪</span>
                    <span className="item-label">Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="login-cta glimmer-border">
              <span className="cta-icon">🔐</span>
              <span className="cta-text">Connect AI</span>
              <span className="cta-arrow">→</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        {isAuthenticated && (
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <div className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="mobile-nav-menu">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="mobile-nav-icon">{link.icon}</span>
              <span className="mobile-nav-label">{link.label}</span>
              {isActive(link.path) && (
                <span className="mobile-nav-indicator">●</span>
              )}
            </Link>
          ))}

          <div className="mobile-nav-user">
            <div className="mobile-user-info">
              <span className="mobile-user-email">{user?.email || 'user@example.com'}</span>
              <span className="mobile-user-status">
                <span className="status-dot"></span>
                AI Connected
              </span>
            </div>
            <button
              className="mobile-logout-btn"
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
            >
              <span>🚪 Disconnect</span>
            </button>
          </div>
        </div>
      )}

      {/* AI Ambient Effect */}
      <div className="nav-ambient-glow"></div>
    </nav>
  );
}

export default NavigationBarEnhanced;