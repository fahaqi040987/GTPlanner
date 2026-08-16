/**
 * API service for GTPlanner frontend
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:11211';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getCurrentUser: () => api.get('/api/auth/me'),
};

// PRD Generation APIs
export const prdAPI = {
  generate: (data) => api.post('/api/prd/generate', data),
  regenerate: (id, data) => api.post(`/api/prd/regenerate/${id}`, data),
};

// Document APIs
export const documentAPI = {
  list: (params) => api.get('/api/documents', { params }),
  search: (query, params) => api.get('/api/documents/search', { params: { query, ...params } }),
  get: (id) => api.get(`/api/documents/${id}`),
  update: (id, data) => api.put(`/api/documents/${id}`, data),
  delete: (id) => api.delete(`/api/documents/${id}`),
};

import { formatPRDMarkdown } from './markdownFormatter';

// Download Helper Functions
export const downloadHelpers = {
  generateMarkdown: (prd) => {
    return formatPRDMarkdown(prd);
  },

  generateJSON: (prd) => {
    return JSON.stringify(prd, null, 2); // Pretty-printed JSON
  },

  sanitizeFilename: (title, id) => {
    const sanitized = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `prd-${sanitized}-${date}-${id}`;
  },

  downloadFile: (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`Downloaded: ${filename}`);
  },

  exportPRD: (prd, format) => {
    if (!prd) return null;
    
    let content, filename, mimeType;

    if (format === 'md') {
      content = downloadHelpers.generateMarkdown(prd);
      filename = downloadHelpers.sanitizeFilename(prd.title, prd.id) + '.md';
      mimeType = 'text/markdown';
    } else if (format === 'json') {
      content = downloadHelpers.generateJSON(prd);
      filename = downloadHelpers.sanitizeFilename(prd.title, prd.id) + '.json';
      mimeType = 'application/json';
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    downloadHelpers.downloadFile(content, filename, mimeType);
    return filename;
  }
};

export default api;
