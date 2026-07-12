/**
 * Login page component
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
    <div className="login-page">
      <div className="login-container card">
        <div className="login-header">
          <div className="empty-state-icon">⚡</div>
          <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="subtitle">
            {isRegister
              ? 'Transform ideas into structured PRDs with AI'
              : 'Login to your GTPlanner workspace'}
          </p>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="you@technical.io"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password {isRegister && <span className="required">*</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="••••••••"
              minLength={isRegister ? 8 : 1}
            />
            {isRegister && (
              <p className="caption" style={{ marginTop: 'var(--space-2)', color: 'var(--ink-500)' }}>
                Minimum 8 characters for security
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-large"
            disabled={authMutation.isLoading}
          >
            {authMutation.isLoading ? (
              <>
                <span className="spinner-small"></span>
                {isRegister ? 'Creating Account...' : 'Logging in...'}
              </>
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Login to Workspace'
            )}
          </button>
        </form>

        <div className="login-footer">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="link-btn"
          >
            {isRegister
              ? 'Already have an account? Login →'
              : "Don't have an account? Sign up →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
