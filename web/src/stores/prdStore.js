/**
 * PRD state management with Zustand
 */

import { create } from 'zustand';
import { prdService } from '../services/prdService';

export const usePRDStore = create((set, get) => ({
  // State
  prds: [],
  currentPRD: null,
  versions: [],
  isLoading: false,
  error: null,

  // Actions
  fetchPRDs: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await prdService.getWorkspacePRDs(workspaceId);
      set({ prds: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch PRDs',
        isLoading: false
      });
    }
  },

  fetchPRD: async (prdId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await prdService.getPRD(prdId);
      set({ currentPRD: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch PRD',
        isLoading: false
      });
    }
  },

  createPRD: async (workspaceId, prdData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await prdService.createPRD(workspaceId, prdData);
      const newPRD = response.data;

      // Add to PRDs list
      set(state => ({
        prds: [newPRD, ...state.prds],
        isLoading: false
      }));

      return newPRD;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to create PRD',
        isLoading: false
      });
      throw error;
    }
  },

  updatePRD: async (prdId, prdData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await prdService.updatePRD(prdId, prdData);
      const updatedPRD = response.data;

      // Update in PRDs list and current PRD
      set(state => ({
        prds: state.prds.map(prd =>
          prd.id === prdId ? updatedPRD : prd
        ),
        currentPRD: state.currentPRD?.id === prdId ? updatedPRD : state.currentPRD,
        isLoading: false
      }));

      return updatedPRD;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to update PRD',
        isLoading: false
      });
      throw error;
    }
  },

  deletePRD: async (prdId) => {
    set({ isLoading: true, error: null });
    try {
      await prdService.deletePRD(prdId);

      // Remove from PRDs list
      set(state => ({
        prds: state.prds.filter(prd => prd.id !== prdId),
        currentPRD: state.currentPRD?.id === prdId ? null : state.currentPRD,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to delete PRD',
        isLoading: false
      });
      throw error;
    }
  },

  fetchVersions: async (prdId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await prdService.getPRDVersions(prdId);
      set({ versions: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch versions',
        isLoading: false
      });
    }
  },

  restoreVersion: async (prdId, versionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await prdService.restorePRDVersion(prdId, versionId);
      const restoredPRD = response.data;

      // Update current PRD
      set(state => ({
        currentPRD: restoredPRD,
        isLoading: false
      }));

      // Refresh versions
      get().fetchVersions(prdId);

      return restoredPRD;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to restore version',
        isLoading: false
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentPRD: () => set({ currentPRD: null, versions: [] })
}));