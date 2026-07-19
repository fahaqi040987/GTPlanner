/**
 * PRD detail page with viewing, editing, and export
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { documentAPI } from '../services/api';
import PRDEditForm from '../components/PRDEditForm';
import ExportMenu from '../components/ExportMenu';

function PRDDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [exportStatus, setExportStatus] = useState('');

  const { data: prd, isLoading, error } = useQuery({
    queryKey: ['prd', id],
    queryFn: () => documentAPI.get(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      navigate('/dashboard');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => documentAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prd', id]);
      queryClient.invalidateQueries(['documents']);
      setSaveSuccess(true);
      setSaveError('');
      setTimeout(() => {
        setEditMode(false);
        setSaveSuccess(false);
      }, 2000);
    },
    onError: (error) => {
      setSaveError(error.response?.data?.detail || 'Failed to save changes');
      setSaveSuccess(false);
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this PRD?')) {
      deleteMutation.mutate();
    }
  };

  const handleSave = (formData) => {
    setSaveError('');
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setEditMode(false);
    setSaveError('');
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setSaveError('');
    setSaveSuccess(false);
  };

  // Export handler
  const handleExport = async (data, format) => {
    try {
      const { downloadHelpers } = await import('../services/api');

      let content, filename, mimeType;

      if (format === 'md') {
        content = downloadHelpers.generateMarkdown(data);
        filename = downloadHelpers.sanitizeFilename(data.title, data.id) + '.md';
        mimeType = 'text/markdown';
      } else if (format === 'json') {
        content = downloadHelpers.generateJSON(data);
        filename = downloadHelpers.sanitizeFilename(data.title, data.id) + '.json';
        mimeType = 'application/json';
      }

      downloadHelpers.downloadFile(content, filename, mimeType);
      setExportStatus(`Exported ${filename}`);

      // Clear status after 3 seconds
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed - please try again');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="caption">Loading PRD...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        Failed to load PRD: {error.message}
      </div>
    );
  }

  const prdData = prd?.data;

  // Show edit mode
  if (editMode && prdData) {
    return (
      <div className="prd-detail-page">
        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost"
            style={{ marginBottom: 'var(--space-4)' }}
          >
            ← Back to Dashboard
          </button>
          <div>
            <h1>Edit PRD</h1>
            <p className="caption">Make changes to your PRD below</p>
          </div>
        </div>

        <div className="card">
          {saveSuccess && (
            <div className="success-message" style={{
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              backgroundColor: 'var(--success-50)',
              color: 'var(--success-700)',
              borderRadius: 'var(--radius-1)',
              border: '1px solid var(--success-200)'
            }}>
              ✓ PRD updated successfully!
            </div>
          )}

          {saveError && (
            <div className="error-message" style={{
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              backgroundColor: 'var(--error-50)',
              color: 'var(--error-700)',
              borderRadius: 'var(--radius-1)',
              border: '1px solid var(--error-200)'
            }}>
              {saveError}
            </div>
          )}

          <PRDEditForm
            initialData={prdData}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={updateMutation.isLoading}
          />
        </div>
      </div>
    );
  }

  // Show view mode
  return (
    <div className="prd-detail-page">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-ghost"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          ← Back to Dashboard
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ marginBottom: 'var(--space-2)' }}>{prdData?.title}</h1>
            <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
              <span className="caption">
                Created: {new Date(prdData?.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="caption">
                Updated: {new Date(prdData?.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <ExportMenu
              prd={prdData}
              trigger="button"
            />
            <button
              onClick={toggleEditMode}
              className="btn btn-primary"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-secondary"
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          {exportStatus && (
            <div style={{
              marginTop: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--success-700)',
              backgroundColor: 'var(--success-50)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--success-200)'
            }}>
              ✓ {exportStatus}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: 'var(--space-8)' }}>
        <div className="card">
          <div className="prd-content">
            <ReactMarkdown>{prdData?.content}</ReactMarkdown>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {prdData?.tech_stack && (
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Technology Stack</h3>
              <div className="tech-stack-list">
                {prdData.tech_stack.frontend && (
                  <div className="tech-item" style={{ marginBottom: 'var(--space-4)' }}>
                    <span className="label">Frontend</span>
                    <ul>
                      {prdData.tech_stack.frontend.map((tech, i) => (
                        <li key={i}>{tech}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {prdData.tech_stack.backend && (
                  <div className="tech-item" style={{ marginBottom: 'var(--space-4)' }}>
                    <span className="label">Backend</span>
                    <ul>
                      {prdData.tech_stack.backend.map((tech, i) => (
                        <li key={i}>{tech}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {prdData.tech_stack.database && (
                  <div className="tech-item" style={{ marginBottom: 'var(--space-4)' }}>
                    <span className="label">Database</span>
                    <ul>
                      {prdData.tech_stack.database.map((tech, i) => (
                        <li key={i}>{tech}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {prdData.tech_stack.devops && (
                  <div className="tech-item">
                    <span className="label">DevOps</span>
                    <ul>
                      {prdData.tech_stack.devops.map((tech, i) => (
                        <li key={i}>{tech}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {prdData?.recommendations && (
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Infrastructure</h3>
              {prdData.recommendations.hardware_specs && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <span className="label">Hardware</span>
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <p className="caption">CPU: {prdData.recommendations.hardware_specs.cpu_cores}</p>
                    <p className="caption">RAM: {prdData.recommendations.hardware_specs.ram}</p>
                    <p className="caption">Disk: {prdData.recommendations.hardware_specs.disk_space}</p>
                  </div>
                </div>
              )}
              {prdData.recommendations.cloud_providers && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <span className="label">Cloud Providers</span>
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    {prdData.recommendations.cloud_providers.map((provider, i) => (
                      <div key={i} style={{ marginBottom: 'var(--space-2)' }}>
                        <p style={{ fontWeight: 'var(--font-semibold)' }}>{provider.name}</p>
                        <p className="caption">Cost: {provider.estimated_monthly_cost}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PRDDetailPage;
