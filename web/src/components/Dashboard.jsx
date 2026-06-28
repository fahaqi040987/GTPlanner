/**
 * Dashboard component - updated with workspace functionality
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import WorkspaceList from './workspace/WorkspaceList';
import CreateWorkspaceModal from './workspace/CreateWorkspaceModal';

function Dashboard() {
  const { user, logout } = useAuthStore();
  const { workspaces, fetchWorkspaces, isLoading: workspacesLoading } = useWorkspaceStore();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleWorkspaceCreated = (newWorkspace) => {
    // Refresh the workspace list
    fetchWorkspaces();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation bar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1
                  className="text-xl font-bold text-gray-900 cursor-pointer"
                  onClick={() => navigate('/dashboard')}
                >
                  GTPlanner
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.name || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Workspaces</h2>
              <p className="text-gray-600 mt-1">
                Collaborate with your team on PRDs
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Workspace
            </button>
          </div>

          {/* Workspace List */}
          {workspacesLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <WorkspaceList />
          )}

          {/* Status Section */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-green-900 mb-2">
                  ✅ Phase 1 Complete
                </h4>
                <p className="text-xs text-green-800">
                  Foundation setup, database, and authentication
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-green-900 mb-2">
                  ✅ Phase 2 Complete
                </h4>
                <p className="text-xs text-green-800">
                  Frontend authentication and user management
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  🚀 Phase 3 In Progress
                </h4>
                <p className="text-xs text-blue-800">
                  Workspace management and team collaboration
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  📋 Coming Soon
                </h4>
                <p className="text-xs text-gray-800">
                  Phase 4: PRD creation and editing
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleWorkspaceCreated}
      />
    </div>
  );
}

export default Dashboard;