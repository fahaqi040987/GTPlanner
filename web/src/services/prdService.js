/**
 * PRD service for API calls
 */

import api from './api';

export const prdService = {
  /**
   * Get all PRDs in a workspace
   */
  getWorkspacePRDs: (workspaceId) =>
    api.get(`/prds/workspaces/${workspaceId}/prds`),

  /**
   * Create a new PRD in workspace
   */
  createPRD: (workspaceId, prdData) =>
    api.post(`/prds/workspaces/${workspaceId}/prds`, prdData),

  /**
   * Get PRD details by ID
   */
  getPRD: (prdId) =>
    api.get(`/prds/${prdId}`),

  /**
   * Update PRD
   */
  updatePRD: (prdId, prdData) =>
    api.put(`/prds/${prdId}`, prdData),

  /**
   * Delete PRD
   */
  deletePRD: (prdId) =>
    api.delete(`/prds/${prdId}`),

  /**
   * Get PRD version history
   */
  getPRDVersions: (prdId) =>
    api.get(`/prds/${prdId}/versions`),

  /**
   * Restore PRD to specific version
   */
  restorePRDVersion: (prdId, versionId) =>
    api.post(`/prds/${prdId}/versions/${versionId}/restore`)
};