/**
 * Main layout component
 */
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';

function Layout() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <Link to="/dashboard" className="logo">
            GTPlanner
          </Link>
          <nav className="nav">
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/prd/new" className="nav-link">
              New PRD
            </Link>
          </nav>
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
