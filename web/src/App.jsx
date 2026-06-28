/**
 * Main App component with routing
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Pages
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import Dashboard from './components/Dashboard';
import WorkspaceDetail from './components/workspace/WorkspaceDetail';
import PRDDetail from './components/prd/PRDDetail';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    // Initialize auth state from localStorage on app load
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/:workspaceId"
          element={
            <ProtectedRoute>
              <WorkspaceDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/:workspaceId/prd/:prdId"
          element={
            <ProtectedRoute>
              <PRDDetail />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;