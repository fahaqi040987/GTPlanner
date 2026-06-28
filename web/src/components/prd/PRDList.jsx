/**
 * PRD list component
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePRDStore } from '../../stores/prdStore';

function PRDList({ workspaceId }) {
  const navigate = useNavigate();
  const { prds, fetchPRDs, isLoading, error } = usePRDStore();

  useEffect(() => {
    fetchPRDs(workspaceId);
  }, [workspaceId, fetchPRDs]);

  const handlePRDClick = (prdId) => {
    navigate(`/workspace/${workspaceId}/prd/${prdId}`);
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (prds.length === 0) {
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No PRDs yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first PRD.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {prds.map((prd) => (
        <div
          key={prd.id}
          onClick={() => handlePRDClick(prd.id)}
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {prd.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Version {prd.version} • {prd.status}
              </p>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {prd.content?.sections?.overview || 'No description'}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {new Date(prd.updated_at).toLocaleDateString()}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
              {prd.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PRDList;