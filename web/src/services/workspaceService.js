/**
 * Workspace service for API calls
 */

import api from './api';

export const workspaceService = {
  /**
   * Get all user workspaces
   */
  async getWorkspaces() {
    const response = await api.get('/api/web/workspaces');
    return response.data;
  },

  /**
   * Get workspace by ID
   */
  async getWorkspace(workspaceId) {
    const response = await api.get(`/api/web/workspaces/${workspaceId}`);
    return response.data;
  },

  /**
   * Create new workspace
   */
  async createWorkspace(workspaceData) {
    const response = await api.post('/api/web/workspaces', workspaceData);
    return response.data;
  },

  /**
   * Update workspace
   */
  async updateWorkspace(workspaceId, workspaceData) {
    const response = await api.put(`/api/web/workspaces/${workspaceId}`, workspaceData);
    return response.data;
  },

  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId) {
    const response = await api.delete(`/api/web/workspaces/${workspaceId}`);
    return response.data;
  },

  /**
   * Get workspace members
   */
  async getWorkspaceMembers(workspaceId) {
    const response = await api.get(`/api/web/workspaces/${workspaceId}/members`);
    return response.data;
  },

  /**
   * Add workspace member
   */
  async addWorkspaceMember(workspaceId, memberData) {
    const response = await api.post(`/api/web/workspaces/${workspaceId}/members`, memberData);
    return response.data;
  },

  /**
   * Remove workspace member
   */
  async removeWorkspaceMember(workspaceId, userId) {
    const response = await api.delete(`/api/web/workspaces/${workspaceId}/members/${userId}`);
    return response.data;
  },
};

export default workspaceService;