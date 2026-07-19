/**
 * Main App component with routing
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './state/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewPRDPage from './pages/NewPRDPage';
import PRDDetailPage from './pages/PRDDetailPage';
import SettingsPage from './pages/SettingsPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import NavigationBar from './components/NavigationBar';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="App">
      {/* Global Navigation Bar */}
      {isAuthenticated && <NavigationBar />}

      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="prd/new" element={<NewPRDPage />} />
          <Route path="prd/:id" element={<PRDDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
