/**
 * Login page component - DesignStitch Secure Login design
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import { useAuthStore } from '../state/authStore';
import Card from '../components/design-system/Card';
import InputField from '../components/design-system/InputField';
import Button from '../components/design-system/Button';
import StatusBadge from '../components/design-system/StatusBadge';

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
        <Card elevation="medium" padding="xl">
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
            <div className="mb-lg">
              <StatusBadge status={error} variant="error" />
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-lg">
            <InputField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="user@gtplanner.dev"
            />

            <InputField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="font-mono"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={authMutation.isLoading}
              className="w-full"
            >
              {authMutation.isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-lg flex justify-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-sm text-primary hover:text-secondary transition-colors duration-200 underline"
            >
              {isRegister
                ? 'Already have an account? Sign in →'
                : "Don't have an account? Sign up →"}
            </button>
          </div>

          {/* Security Badge Footer */}
          <footer className="mt-lg flex justify-center border-t pt-lg"
                  style={{ borderColor: 'var(--slate-200)' }}>
            <StatusBadge status="JWT-Secured Environment" variant="published" />
          </footer>
        </Card>
      </main>
    </div>
  );
}

export default LoginPage;
