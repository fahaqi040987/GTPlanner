/**
 * Login page component - DesignStitch Secure Login design
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import { useAuthStore } from '../state/authStore';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const authMutation = useMutation({
    mutationFn: isRegister ? authAPI.register : authAPI.login,
    onSuccess: async (response) => {
      if (isRegister) {
        // After registration, automatically login
        setIsRegister(false);
        setError('Registration successful! Please login.');
      } else {
        const token = response.data.access_token;
        // Store token in localStorage FIRST
        localStorage.setItem('access_token', token);
        // Get user data using the stored token
        try {
          const userResponse = await authAPI.getCurrentUser();
          login(token, userResponse.data);
          navigate('/dashboard');
        } catch (error) {
          console.error('Failed to get user data:', error);
          // Clean up token on failure
          localStorage.removeItem('access_token');
        }
      }
    },
    onError: (error) => {
      setError(error.response?.data?.detail || 'Authentication failed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    authMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* Background Texture */}
      <div className="absolute inset-0 bg-tech-pattern opacity-60 pointer-events-none"></div>

      {/* Main Card Container */}
      <main className="w-full max-w-[440px] px-lg md:px-0 relative z-10">
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          {/* Branding & Header */}
          <header className="text-center mb-lg flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-md"
                 style={{ background: 'var(--ink-900)' }}>
              <span className="material-symbols-outlined text-white text-[24px]">
                terminal
              </span>
            </div>
            <div className="text-xl font-bold mb-md tracking-tight"
                 style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
              GTPlanner
            </div>
            <h1 className="text-2xl font-bold mb-sm"
                style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
              Secure Login
            </h1>
            <p className="text-sm"
               style={{ color: 'var(--ink-500)' }}>
              Authenticate to access engineering workspaces.
            </p>
          </header>

          {error && (
            <div className="mb-lg error">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="user@gtplanner.dev"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="••••••••"
                style={{ fontFamily: 'var(--font-caption)', letterSpacing: '0.05em' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-large"
              disabled={authMutation.isLoading}
            >
              {authMutation.isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="login-footer">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="link-btn"
            >
              {isRegister
                ? 'Already have an account? Sign in →'
                : "Don't have an account? Sign up →"}
            </button>
          </div>

          {/* Security Badge Footer */}
          <footer className="mt-lg flex justify-center border-t pt-lg"
                  style={{ borderColor: 'var(--slate-200)' }}>
            <div className="inline-flex items-center px-sm py-xs rounded-full"
                 style={{
                   background: 'var(--amber-100)',
                   color: '#92400e',
                   fontFamily: 'var(--font-caption)',
                   fontSize: 'var(--text-xs)',
                   fontWeight: 'var(--font-medium)',
                   textTransform: 'uppercase',
                   letterSpacing: '0.05em',
                   border: '1px solid var(--amber-300)'
                 }}>
              <span className="material-symbols-outlined text-[14px] mr-xs"
                    style={{ fontVariationSettings: '"FILL" 1' }}>
                verified_user
              </span>
              <span className="tracking-wide">JWT-Secured Environment</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
