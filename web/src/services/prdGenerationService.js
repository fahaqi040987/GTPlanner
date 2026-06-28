/**
 * PRD Generation service for AI-powered PRD creation
 */

import api from './api';

export const prdGenerationService = {
  /**
   * Generate PRD synchronously (returns complete result)
   */
  generatePRD: (description, language = 'en', context = '') =>
    api.post('/prd-generation/generate-prd-sync', {
      description,
      language,
      context: context || undefined
    }),

  /**
   * Generate and save PRD to workspace in one operation
   */
  generateAndSavePRD: (workspaceId, description, language = 'en', context = '') =>
    api.post(`/prd-generation/generate-and-save?workspace_id=${workspaceId}`, {
      description,
      language,
      context: context || undefined
    }),

  /**
   * Stream PRD generation (returns SSE stream)
   */
  generatePRDStream: (description, language = 'en', context = '') => {
    const token = localStorage.getItem('token');

    return fetch(`${api.defaults.baseURL}/prd-generation/generate-prd`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ description, language, context })
    });
  }
};
