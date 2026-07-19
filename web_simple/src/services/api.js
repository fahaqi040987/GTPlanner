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

// Download Helper Functions
export const downloadHelpers = {
  generateMarkdown: (prd) => {
    const date = new Date().toISOString();
    const wordCount = prd.content?.split(/\s+/).filter(w => w.length > 0).length || 0;

    let markdown = `# ${prd.title}\n\n`;
    markdown += `**Generated:** ${date}\n`;
    markdown += `**Word Count:** ${wordCount}\n`;
    markdown += `**PRD ID:** ${prd.id}\n\n`;
    markdown += `${prd.content}\n\n`;

    if (prd.requirements && Array.isArray(prd.requirements)) {
      markdown += `## Requirements\n\n`;
      prd.requirements.forEach(req => {
        markdown += `- ${req}\n`;
      });
      markdown += `\n`;
    }

    if (prd.tech_stack) {
      markdown += `## Technology Stack\n\n`;
      markdown += `**Rationale:** ${prd.tech_stack.rationale || 'N/A'}\n\n`;

      if (prd.tech_stack.frontend && Array.isArray(prd.tech_stack.frontend)) {
        markdown += `### Frontend\n`;
        prd.tech_stack.frontend.forEach(tech => {
          markdown += `- ${tech}\n`;
        });
        markdown += `\n`;
      }

      if (prd.tech_stack.backend && Array.isArray(prd.tech_stack.backend)) {
        markdown += `### Backend\n`;
        prd.tech_stack.backend.forEach(tech => {
          markdown += `- ${tech}\n`;
        });
        markdown += `\n`;
      }

      if (prd.tech_stack.database && Array.isArray(prd.tech_stack.database)) {
        markdown += `### Database\n`;
        prd.tech_stack.database.forEach(tech => {
          markdown += `- ${tech}\n`;
        });
        markdown += `\n`;
      }

      if (prd.tech_stack.devops && Array.isArray(prd.tech_stack.devops)) {
        markdown += `### DevOps\n`;
        prd.tech_stack.devops.forEach(tech => {
          markdown += `- ${tech}\n`;
        });
        markdown += `\n`;
      }
    }

    if (prd.recommendations) {
      markdown += `## Infrastructure Recommendations\n\n`;

      if (prd.recommendations.hardware_specs) {
        markdown += `### Hardware Specifications\n`;
        markdown += `- **CPU:** ${prd.recommendations.hardware_specs.cpu_cores || 'N/A'}\n`;
        markdown += `- **RAM:** ${prd.recommendations.hardware_specs.ram || 'N/A'}\n`;
        markdown += `- **Disk:** ${prd.recommendations.hardware_specs.disk_space || 'N/A'}\n\n`;
      }

      if (prd.recommendations.cloud_providers && Array.isArray(prd.recommendations.cloud_providers)) {
        markdown += `### Cloud Providers\n`;
        prd.recommendations.cloud_providers.forEach(provider => {
          markdown += `**${provider.name}**\n`;
          markdown += `- Services: ${provider.services?.join(', ') || 'N/A'}\n`;
          markdown += `- Cost: ${provider.estimated_monthly_cost || 'N/A'}\n\n`;
        });
      }

      if (prd.recommendations.architecture) {
        markdown += `### Architecture\n${prd.recommendations.architecture}\n\n`;
      }

      if (prd.recommendations.data_stack) {
        markdown += `### Data Stack\n${prd.recommendations.data_stack}\n\n`;
      }
    }

    if (prd.implementation_plan && Array.isArray(prd.implementation_plan)) {
      markdown += `## Implementation Plan\n\n`;
      prd.implementation_plan.forEach((plan, index) => {
        markdown += `${index + 1}. ${plan}\n`;
      });
      markdown += `\n`;
    }

    if (prd.success_metrics && Array.isArray(prd.success_metrics)) {
      markdown += `## Success Metrics\n\n`;
      prd.success_metrics.forEach(metric => {
        markdown += `- ${metric}\n`;
      });
    }

    return markdown;
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
  }
};

export default api;
