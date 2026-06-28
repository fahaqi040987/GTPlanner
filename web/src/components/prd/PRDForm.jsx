/**
 * PRD form component for creating/editing PRDs
 */

import { useState } from 'react';
import { usePRDStore } from '../../stores/prdStore';

function PRDForm({ workspaceId, prd = null, onSuccess, onCancel }) {
  const { createPRD, updatePRD, isLoading, error, clearError } = usePRDStore();
  const [formData, setFormData] = useState(
    prd || {
      title: '',
      content: {
        sections: {
          overview: '',
          background: '',
          goals: '',
          scope: '',
          stakeholders: '',
          timeline: '',
          resources: '',
          risks: ''
        }
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (section, value) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        sections: {
          ...prev.content.sections,
          [section]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      if (prd) {
        const updated = await updatePRD(prd.id, {
          title: formData.title,
          content: formData.content,
          change_description: 'Updated via web interface'
        });
        if (onSuccess) onSuccess(updated);
      } else {
        const created = await createPRD(workspaceId, formData);
        if (onSuccess) onSuccess(created);
      }
    } catch (err) {
      // Error is already handled in the store
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          PRD Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
          placeholder="Enter PRD title"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">PRD Sections</h3>

        {Object.entries({
          overview: 'Overview',
          background: 'Background',
          goals: 'Goals & Objectives',
          scope: 'Scope & Boundaries',
          stakeholders: 'Stakeholders',
          timeline: 'Timeline',
          resources: 'Resources',
          risks: 'Risks & Mitigation'
        }).map(([key, label]) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            <textarea
              id={key}
              value={formData.content.sections[key] || ''}
              onChange={(e) => handleContentChange(key, e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
              placeholder={`Enter ${label.toLowerCase()}...`}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : prd ? 'Update PRD' : 'Create PRD'}
        </button>
      </div>
    </form>
  );
}

export default PRDForm;