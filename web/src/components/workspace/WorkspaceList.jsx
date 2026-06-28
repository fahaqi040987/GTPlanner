/**
 * Workspace list component
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';

function WorkspaceList() {
  const navigate = useNavigate();
  const { workspaces, isLoading, fetchWorkspaces, error } = useWorkspaceStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleWorkspaceClick = (workspaceId) => {
    navigate(`/workspace/${workspaceId}`);
  };

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

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No workspaces</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((workspace) => (
        <div
          key={workspace.id}
          onClick={() => handleWorkspaceClick(workspace.id)}
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition cursor-pointer"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 flex-1">
                <h3 className="text-lg font-medium text-gray-900">{workspace.name}</h3>
                <p className="text-sm text-gray-500">
                  {workspace.member_count} member{workspace.member_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {workspace.description && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {workspace.description}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default WorkspaceList;