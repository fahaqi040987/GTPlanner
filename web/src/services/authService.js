/**
 * Authentication service for user registration, login, and logout
 */

import api from './api';

export const authService = {
  /**
   * Register a new user
   */
  async register(userData) {
    const response = await api.post('/api/web/auth/register', userData);
    return response.data;
  },

  /**
   * Login user
   */
  async login(credentials) {
    const response = await api.post('/api/web/auth/login', credentials);
    return response.data;
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/api/web/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user info
   */
  async getCurrentUser() {
    const response = await api.get('/api/web/auth/me');
    return response.data;
  },

  /**
   * Store authentication data
   */
  storeAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Get stored user
   */
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  },
};

export default authService;