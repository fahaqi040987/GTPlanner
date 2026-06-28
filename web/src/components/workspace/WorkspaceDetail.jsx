/**
 * Workspace detail component with PRD integration
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useAuthStore } from '../../stores/authStore';
import PRDList from '../prd/PRDList';
import CreatePRDModal from '../prd/CreatePRDModal';
import AIPRDGenerator from '../prd/AIPRDGenerator';

function WorkspaceDetail() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentWorkspace,
    members,
    isLoading,
    error,
    fetchWorkspace,
    fetchMembers,
    deleteWorkspace,
  } = useWorkspaceStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('viewer');
  const [showCreatePRD, setShowCreatePRD] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  useEffect(() => {
    fetchWorkspace(workspaceId);
    fetchMembers(workspaceId);
  }, [workspaceId, fetchWorkspace, fetchMembers]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      try {
        await deleteWorkspace(workspaceId);
        navigate('/dashboard');
      } catch (error) {
        // Error handled by store
      }
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      // In a real app, you'd need to look up the user ID from the email
      // For now, we'll use the email as the user_id (this won't work with the current API)
      await useWorkspaceStore.getState().addMember(workspaceId, {
        user_id: newMemberEmail, // This should be a real user ID
        role: newMemberRole,
      });
      setShowAddMember(false);
      setNewMemberEmail('');
      setNewMemberRole('viewer');
      // Refresh members list
      fetchMembers(workspaceId);
    } catch (error) {
      // Error handled by store
    }
  };

  const isOwner = currentWorkspace?.owner_id === user?.id;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Workspace not found</h3>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-indigo-600 hover:text-indigo-500"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentWorkspace.name}</h1>
            {currentWorkspace.description && (
              <p className="mt-2 text-gray-600">{currentWorkspace.description}</p>
            )}
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
              <span>Created: {new Date(currentWorkspace.created_at).toLocaleDateString()}</span>
              <span>Members: {members.length}</span>
              {isOwner && <span className="text-indigo-600">Owner</span>}
            </div>
          </div>
          {isOwner && (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PRDs Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Product Requirements Documents</h2>
            <p className="text-sm text-gray-500 mt-1">Create and manage PRDs for your projects</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAIGenerator(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Generate
            </button>
            <button
              onClick={() => setShowCreatePRD(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New PRD
            </button>
          </div>
        </div>

        <PRDList workspaceId={workspaceId} />
      </div>

      {/* Members Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          {isOwner && (
            <button
              onClick={() => setShowAddMember(true)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Member
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No members yet</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                    {member.role}
                  </span>
                  {isOwner && member.user_id !== user?.id && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${member.name} from workspace?`)) {
                          useWorkspaceStore.getState().removeMember(workspaceId, member.user_id);
                          fetchMembers(workspaceId);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Workspace</h3>
            <WorkspaceForm
              workspace={currentWorkspace}
              onSuccess={(updated) => {
                setShowEditForm(false);
                fetchWorkspace(workspaceId);
              }}
              onCancel={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User Email
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="user@example.com"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Note: In a real application, you'd search for users by email
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMember(false);
                    setNewMemberEmail('');
                    setNewMemberRole('viewer');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create PRD Modal */}
      <CreatePRDModal
        workspaceId={workspaceId}
        isOpen={showCreatePRD}
        onClose={() => setShowCreatePRD(false)}
        onSuccess={() => {
          setShowCreatePRD(false);
          // Refresh PRD list by navigating away and back
          window.location.reload();
        }}
      />

      {/* AI PRD Generator Modal */}
      {showAIGenerator && (
        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowAIGenerator(false)}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      AI-Powered PRD Generator
                    </h3>
                    <AIPRDGenerator
                      workspaceId={workspaceId}
                      onSuccess={() => {
                        setShowAIGenerator(false);
                        window.location.reload();
                      }}
                      onCancel={() => setShowAIGenerator(false)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspaceDetail;