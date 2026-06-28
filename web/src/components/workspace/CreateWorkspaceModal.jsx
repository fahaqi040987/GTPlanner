/**
 * Create workspace modal component
 */

import { useState } from 'react';
import WorkspaceForm from './WorkspaceForm';

function CreateWorkspaceModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create New Workspace</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <WorkspaceForm
          onSuccess={(newWorkspace) => {
            onClose();
            if (onSuccess) onSuccess(newWorkspace);
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

export default CreateWorkspaceModal;