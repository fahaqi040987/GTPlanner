/**
 * Workspace state management with Zustand
 */

import { create } from 'zustand';
import workspaceService from '../services/workspaceService';

export const useWorkspaceStore = create((set, get) => ({
  // State
  workspaces: [],
  currentWorkspace: null,
  members: [],
  isLoading: false,
  error: null,

  // Actions
  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspaces = await workspaceService.getWorkspaces();
      set({ workspaces, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch workspaces',
        isLoading: false,
      });
    }
  },

  fetchWorkspace: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const workspace = await workspaceService.getWorkspace(workspaceId);
      set({ currentWorkspace: workspace, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch workspace',
        isLoading: false,
      });
    }
  },

  createWorkspace: async (workspaceData) => {
    set({ isLoading: true, error: null });
    try {
      const newWorkspace = await workspaceService.createWorkspace(workspaceData);
      set((state) => ({
        workspaces: [...state.workspaces, newWorkspace],
        isLoading: false,
      }));
      return newWorkspace;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to create workspace',
        isLoading: false,
      });
      throw error;
    }
  },

  updateWorkspace: async (workspaceId, workspaceData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedWorkspace = await workspaceService.updateWorkspace(
        workspaceId,
        workspaceData
      );
      set((state) => ({
        workspaces: state.workspaces.map((ws) =>
          ws.id === workspaceId ? updatedWorkspace : ws
        ),
        currentWorkspace:
          state.currentWorkspace?.id === workspaceId
            ? updatedWorkspace
            : state.currentWorkspace,
        isLoading: false,
      }));
      return updatedWorkspace;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to update workspace',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteWorkspace: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceService.deleteWorkspace(workspaceId);
      set((state) => ({
        workspaces: state.workspaces.filter((ws) => ws.id !== workspaceId),
        currentWorkspace:
          state.currentWorkspace?.id === workspaceId
            ? null
            : state.currentWorkspace,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to delete workspace',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchMembers: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const members = await workspaceService.getWorkspaceMembers(workspaceId);
      set({ members, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch members',
        isLoading: false,
      });
    }
  },

  addMember: async (workspaceId, memberData) => {
    set({ isLoading: true, error: null });
    try {
      const newMember = await workspaceService.addWorkspaceMember(
        workspaceId,
        memberData
      );
      set((state) => ({
        members: [...state.members, newMember],
        isLoading: false,
      }));
      return newMember;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to add member',
        isLoading: false,
      });
      throw error;
    }
  },

  removeMember: async (workspaceId, userId) => {
    set({ isLoading: true, error: null });
    try {
      await workspaceService.removeWorkspaceMember(workspaceId, userId);
      set((state) => ({
        members: state.members.filter((m) => m.user_id !== userId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to remove member',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
}));

export default useWorkspaceStore;