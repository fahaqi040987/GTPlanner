/**
 * User Menu Component
 * Displays user email with dropdown menu for account actions
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <span className="user-email">{user.email}</span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="user-dropdown-menu">
          <div className="user-dropdown-header">
            <span className="user-dropdown-label">Signed in as</span>
            <span className="user-dropdown-email">{user.email}</span>
          </div>

          <div className="user-dropdown-divider"></div>

          <button
            className="user-dropdown-item"
            onClick={() => {
              navigate('/settings');
              setIsOpen(false);
            }}
          >
            ⚙️ Settings
          </button>

          <button
            className="user-dropdown-item user-dropdown-logout"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;