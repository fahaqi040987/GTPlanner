/**
 * PRD detail component
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePRDStore } from '../../stores/prdStore';
import PRDForm from './PRDForm';

function PRDDetail({ workspaceId }) {
  const { prdId } = useParams();
  const navigate = useNavigate();
  const { currentPRD, fetchPRD, deletePRD, isLoading, error, clearCurrentPRD } = usePRDStore();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    if (prdId) {
      fetchPRD(prdId);
    }

    return () => {
      clearCurrentPRD();
    };
  }, [prdId, fetchPRD, clearCurrentPRD]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this PRD?')) {
      try {
        await deletePRD(prdId);
        navigate(`/workspace/${workspaceId}`);
      } catch (err) {
        // Error handled in store
      }
    }
  };

  const handleUpdate = (updatedPRD) => {
    setShowEditForm(false);
    // currentPRD is already updated in the store
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
        <button
          onClick={() => navigate(`/workspace/${workspaceId}`)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  if (!currentPRD) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">PRD not found</h3>
        <button
          onClick={() => navigate(`/workspace/${workspaceId}`)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  if (showEditForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {prd ? 'Edit PRD' : 'Create New PRD'}
            </h2>
          </div>
          <button
            onClick={() => setShowEditForm(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <PRDForm
            workspaceId={workspaceId}
            prd={currentPRD}
            onSuccess={handleUpdate}
            onCancel={() => setShowEditForm(false)}
          />
        </div>
      </div>
    );
  }

  const sections = currentPRD.content?.sections || {};

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/workspace/${workspaceId}`)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{currentPRD.title}</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Version {currentPRD.version} • Last updated {new Date(currentPRD.updated_at).toLocaleDateString()}
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0">
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            {showVersions ? 'Hide' : 'Show'} Versions
          </button>
          <button
            onClick={() => setShowEditForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Version History */}
      {showVersions && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Version History</h3>
          <VersionHistory prdId={prdId} />
        </div>
      )}

      {/* PRD Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
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
            sections[key] ? (
              <div key={key}>
                <h4 className="text-lg font-medium text-gray-900 mb-2">{label}</h4>
                <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                  {sections[key]}
                </div>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  );
}

// Version history sub-component
function VersionHistory({ prdId }) {
  const { versions, fetchVersions, restoreVersion, isLoading: restoring } = usePRDStore();

  useEffect(() => {
    fetchVersions(prdId);
  }, [prdId, fetchVersions]);

  const handleRestore = async (versionId) => {
    if (window.confirm('Restore this version? Current changes will be saved as a new version.')) {
      try {
        await restoreVersion(prdId, versionId);
        window.location.reload(); // Refresh to show restored content
      } catch (err) {
        // Error handled in store
      }
    }
  };

  if (versions.length === 0) {
    return <p className="text-sm text-gray-500">No version history available</p>;
  }

  return (
    <div className="space-y-2">
      {versions.map((version, index) => (
        <div
          key={version.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <span className="font-medium text-gray-900">
              Version {version.version}
            </span>
            {version.change_description && (
              <span className="ml-2 text-sm text-gray-600">
                - {version.change_description}
              </span>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {new Date(version.created_at).toLocaleString()}
            </p>
          </div>
          {index < versions.length - 1 && (
            <button
              onClick={() => handleRestore(version.id)}
              disabled={restoring}
              className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              Restore
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default PRDDetail;