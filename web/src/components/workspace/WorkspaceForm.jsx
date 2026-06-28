/**
 * Workspace form component for creating/editing workspaces
 */

import { useState } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';

function WorkspaceForm({ workspace = null, onSuccess, onCancel }) {
  const { createWorkspace, updateWorkspace, isLoading, error, clearError } = useWorkspaceStore();

  const [formData, setFormData] = useState({
    name: workspace?.name || '',
    description: workspace?.description || '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
    // Clear auth error when user starts typing
    if (error) clearError();
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Workspace name is required';
    } else if (formData.name.length > 255) {
      errors.name = 'Workspace name must be less than 255 characters';
    }
    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (workspace) {
        await updateWorkspace(workspace.id, formData);
      } else {
        const newWorkspace = await createWorkspace(formData);
        if (onSuccess) onSuccess(newWorkspace);
      }
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Workspace Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border ${
            validationErrors.name ? 'border-red-300' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          placeholder="My Team Workspace"
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border ${
            validationErrors.description ? 'border-red-300' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          placeholder="A workspace for our team to collaborate on PRDs..."
        />
        {validationErrors.description && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : workspace ? 'Update Workspace' : 'Create Workspace'}
        </button>
      </div>
    </form>
  );
}

export default WorkspaceForm;