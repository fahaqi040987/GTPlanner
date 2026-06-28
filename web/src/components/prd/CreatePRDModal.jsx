/**
 * Create PRD modal component
 */

import { useState } from 'react';
import PRDForm from './PRDForm';

function CreatePRDModal({ workspaceId, isOpen, onClose, onSuccess }) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (createdPRD) => {
    setIsCreating(true);
    if (onSuccess) onSuccess(createdPRD);
    setIsCreating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Create New PRD
                </h3>

                <PRDForm
                  workspaceId={workspaceId}
                  onSuccess={handleCreate}
                  onCancel={onClose}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePRDModal;