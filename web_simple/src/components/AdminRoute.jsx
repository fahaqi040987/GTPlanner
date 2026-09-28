/**
 * Admin-only route guard (PRD v2.2.0)
 * Requires authentication AND the 'admin' role; redirects otherwise.
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';

function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
