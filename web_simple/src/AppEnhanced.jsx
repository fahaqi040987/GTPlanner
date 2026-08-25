/**
 * Enhanced App Component with AI Transformation Theme
 * Integrates all enhanced components and design system
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './state/authStore';

// Enhanced Pages
import LoginPage from './pages/LoginPage';
import DashboardPageEnhanced from './pages/DashboardPageEnhanced';
import NewPRDPageEnhanced from './pages/NewPRDPageEnhanced';
import PRDDetailPageEnhanced from './pages/PRDDetailPageEnhanced';
import SettingsPageEnhanced from './pages/SettingsPageEnhanced';

// Enhanced Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import NavigationBarEnhanced from './components/NavigationBarEnhanced';

// Import enhanced design system
import './styles/design-system-enhanced.css';
import './styles/enhanced-pages.css';

function AppEnhanced() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="App AppEnhanced">
      {/* Enhanced Global Navigation - Always visible with AI elements */}
      <NavigationBarEnhanced isAuthenticated={isAuthenticated} />

      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />}
        />

        {/* Protected routes with enhanced layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPageEnhanced />} />
          <Route path="prd/new" element={<NewPRDPageEnhanced />} />
          <Route path="prd/:id" element={<PRDDetailPageEnhanced />} />
          <Route path="settings" element={<SettingsPageEnhanced />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Global AI ambient effects */}
      <div className="ai-ambient-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="ambient-particle"
            style={{
              animationDelay: `${i * 0.5}s`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default AppEnhanced;