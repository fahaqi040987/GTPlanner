/**
 * PRD Detail page component - DesignStitch Document Detail design
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { documentAPI } from '../services/api';
import Button from '../components/design-system/Button';
import Card from '../components/design-system/Card';
import StatusBadge from '../components/design-system/StatusBadge';
import ExportMenu from '../components/ExportMenu';
import CopyMarkdownButton from '../components/CopyMarkdownButton';

function PRDDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [exportStatus, setExportStatus] = useState('');

  const { data: prd, isLoading, error } = useQuery({
    queryKey: ['prd', id],
    queryFn: async () => {
      const response = await documentAPI.get(id);
      setContent(response.data.content);
      return response;
    },
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: (updatedContent) => documentAPI.update(id, { content: updatedContent }),
    onSuccess: () => {
      queryClient.invalidateQueries(['prd', id]);
      queryClient.invalidateQueries(['documents']);
      setSaveSuccess(true);
      setSaveError('');
      setTimeout(() => {
        setIsEditing(false);
        setSaveSuccess(false);
      }, 2000);
    },
    onError: (error) => {
      setSaveError(error.response?.data?.detail || 'Failed to save changes');
      setSaveSuccess(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      navigate('/dashboard');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this PRD?')) {
      deleteMutation.mutate();
    }
  };

  const handleSave = () => {
    setSaveError('');
    saveMutation.mutate(content);
  };

  const handleCancel = () => {
    setContent(prd?.data?.content || '');
    setIsEditing(false);
    setSaveError('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent
                      rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !prd?.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-error mb-md">Failed to load PRD</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const prdData = prd.data;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between
                      mb-xl gap-md">
        <div className="flex-1">
          <div className="flex items-center gap-md mb-sm">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-outline hover:text-secondary transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-headline-lg font-headline-lg text-primary">
                {prdData.title}
              </h1>
              <div className="flex items-center gap-sm mt-xs">
                <span className="text-code-md font-code-md text-outline">
                  {prdData.id}
                </span>
                <StatusBadge
                  status={prdData.status}
                  variant={prdData.status === 'Published' ? 'published' : 'draft'}
                />
              </div>
            </div>
          </div>

          {exportStatus && (
            <div className="mt-sm inline-flex items-center gap-xs px-sm py-xs rounded-full
                          bg-success-container/20 text-on-success-container text-label-caps">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {exportStatus}
            </div>
          )}
        </div>

        <div className="flex items-center gap-sm flex-wrap">
          <ExportMenu
            prd={prdData}
            trigger="button"
            onExport={(prd, format) => {
              setExportStatus(`Exported as ${format.toUpperCase()}`);
              setTimeout(() => setExportStatus(''), 3000);
            }}
          />
          <CopyMarkdownButton
            prd={prdData}
            onCopy={(format) => setExportStatus(`Copied ${format}`)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <span className="material-symbols-outlined">{isEditing ? 'close' : 'edit'}</span>
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isLoading}
          >
            <span className="material-symbols-outlined">delete</span>
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="mb-md p-md bg-success-container/20 text-on-success-container
                      rounded-lg border border-success-container/40 flex items-center gap-sm">
          <span className="material-symbols-outlined">check_circle</span>
          PRD updated successfully!
        </div>
      )}

      {saveError && (
        <div className="mb-md p-md bg-error-container/20 text-on-error-container
                      rounded-lg border border-error-container/40 flex items-center gap-sm">
          <span className="material-symbols-outlined">error</span>
          {saveError}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* PRD Content */}
        <div className="lg:col-span-2">
          <Card elevation="medium" padding="xl">
            {isEditing ? (
              <div className="space-y-lg">
                <textarea
                  className="w-full min-h-[400px] p-md bg-surface border border-outline-variant
                             rounded-lg text-body-md text-on-surface focus:outline-none
                             focus:border-secondary focus:ring-1 focus:ring-secondary
                             font-code-md resize-y"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex gap-sm">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saveMutation.isLoading}
                  >
                    <span className="material-symbols-outlined">save</span>
                    {saveMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{prdData.content}</ReactMarkdown>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Tech Stack & Infrastructure */}
        <div className="space-y-lg">
          {/* Metadata Section */}
          <Card elevation="small" padding="lg">
            <div className="space-y-md">
              <div>
                <h3 className="text-label-caps font-label-caps text-on-surface-variant mb-xs">
                  Created
                </h3>
                <p className="text-body-sm text-on-surface">
                  {new Date(prdData.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <h3 className="text-label-caps font-label-caps text-on-surface-variant mb-xs">
                  Last Modified
                </h3>
                <p className="text-body-sm text-on-surface">
                  {new Date(prdData.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <h3 className="text-label-caps font-label-caps text-on-surface-variant mb-xs">
                  Version
                </h3>
                <p className="text-body-sm text-on-surface">{prdData.version || '1.0'}</p>
              </div>
            </div>
          </Card>

          {/* Tech Stack */}
          {prdData.tech_stack && (
            <Card elevation="small" padding="lg">
              <h3 className="text-label-lg font-label-lg text-on-surface mb-md">
                Technology Stack
              </h3>
              <div className="space-y-md">
                {prdData.tech_stack.frontend && (
                  <div>
                    <span className="text-label-caps font-label-caps text-on-surface-variant">
                      Frontend
                    </span>
                    <ul className="mt-xs space-y-xs">
                      {prdData.tech_stack.frontend.map((tech, i) => (
                        <li key={i} className="text-body-sm text-on-surface flex items-center gap-xs">
                          <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {prdData.tech_stack.backend && (
                  <div>
                    <span className="text-label-caps font-label-caps text-on-surface-variant">
                      Backend
                    </span>
                    <ul className="mt-xs space-y-xs">
                      {prdData.tech_stack.backend.map((tech, i) => (
                        <li key={i} className="text-body-sm text-on-surface flex items-center gap-xs">
                          <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {prdData.tech_stack.database && (
                  <div>
                    <span className="text-label-caps font-label-caps text-on-surface-variant">
                      Database
                    </span>
                    <ul className="mt-xs space-y-xs">
                      {prdData.tech_stack.database.map((tech, i) => (
                        <li key={i} className="text-body-sm text-on-surface flex items-center gap-xs">
                          <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {prdData.tech_stack.devops && (
                  <div>
                    <span className="text-label-caps font-label-caps text-on-surface-variant">
                      DevOps
                    </span>
                    <ul className="mt-xs space-y-xs">
                      {prdData.tech_stack.devops.map((tech, i) => (
                        <li key={i} className="text-body-sm text-on-surface flex items-center gap-xs">
                          <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Infrastructure Recommendations */}
          {prdData.recommendations && (
            <Card elevation="small" padding="lg">
              <h3 className="text-label-lg font-label-lg text-on-surface mb-md">
                Infrastructure
              </h3>
              {prdData.recommendations.hardware_specs && (
                <div className="mb-md">
                  <span className="text-label-caps font-label-caps text-on-surface-variant">
                    Hardware
                  </span>
                  <div className="mt-xs space-y-xs">
                    <p className="text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-sm text-outline align-middle mr-xs">memory</span>
                      CPU: {prdData.recommendations.hardware_specs.cpu_cores} cores
                    </p>
                    <p className="text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-sm text-outline align-middle mr-xs">storage</span>
                      RAM: {prdData.recommendations.hardware_specs.ram}
                    </p>
                    <p className="text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-sm text-outline align-middle mr-xs">hard_drive</span>
                      Disk: {prdData.recommendations.hardware_specs.disk_space}
                    </p>
                  </div>
                </div>
              )}
              {prdData.recommendations.cloud_providers && (
                <div>
                  <span className="text-label-caps font-label-caps text-on-surface-variant">
                    Cloud Providers
                  </span>
                  <div className="mt-xs space-y-sm">
                    {prdData.recommendations.cloud_providers.map((provider, i) => (
                      <div key={i} className="p-sm bg-surface-container-low rounded-lg">
                        <p className="text-body-md font-body-md text-on-surface">
                          {provider.name}
                        </p>
                        <p className="text-body-sm text-outline mt-xs">
                          Est. Cost: {provider.estimated_monthly_cost}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default PRDDetailPage;
