/**
 * Enhanced PRD Detail Page - Secure Version
 * Displays AI-generated PRD with safe markdown rendering
 */
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prdAPI } from '../services/api';
import CopyMarkdownButton from '../components/CopyMarkdownButton';
import { parseMarkdownSections, truncateMarkdown } from '../utils/markdownRenderer';

function PRDDetailPageEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('structured');
  const [copiedSection, setCopiedSection] = useState(null);

  const { data: prd, isLoading, error } = useQuery({
    queryKey: ['prd', id],
    queryFn: () => prdAPI.get(id),
  });

  const deleteMutation = useMutation({
    mutationFn: prdAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      navigate('/dashboard');
    },
  });

  const copySection = (sectionId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="prd-loading-enhanced">
        <div className="loading-core">
          <div className="core-pulse-large"></div>
          <div className="core-rings-large">
            <div className="ring"></div>
            <div className="ring"></div>
            <div className="ring"></div>
          </div>
        </div>
        <div className="loading-content">
          <p className="loading-text">Loading AI-generated PRD...</p>
          <div className="loading-particles">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="loading-particle"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  left: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prd-error-enhanced">
        <div className="error-visual">
          <div className="error-particles">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="error-particle" style={{
                animationDelay: `${i * 0.2}s`,
                transform: `rotate(${i * 45}deg)`
              }} />
            ))}
          </div>
          <span className="error-icon">⚡</span>
        </div>
        <div className="error-content">
          <h3>PRD Not Found</h3>
          <p>The AI-generated document you're looking for doesn't exist.</p>
          <Link to="/dashboard" className="error-cta">
            <span>←</span> Back to Workspace
          </Link>
        </div>
      </div>
    );
  }

  if (!prd?.data) {
    return null;
  }

  const prdData = prd.data;
  const wordCount = prdData.content?.split(/\s+/).filter(word => word.length > 0).length || 0;
  const createdDate = new Date(prdData.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="prd-detail-enhanced">
      {/* PRD Header with AI Elements */}
      <div className="prd-header-enhanced">
        <div className="header-decoration">
          <div className="ai-stream-horizontal">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="stream-dot"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  left: `${i * 3.5}%`
                }}
              />
            ))}
          </div>
        </div>

        <div className="header-content">
          {/* Breadcrumb */}
          <div className="prd-breadcrumb">
            <Link to="/dashboard" className="breadcrumb-link">
              <span className="breadcrumb-icon">🏠</span>
              <span className="breadcrumb-text">Workspace</span>
            </Link>
            <span className="breadcrumb-separator">→</span>
            <span className="breadcrumb-current">PRD Details</span>
          </div>

          {/* Title Section */}
          <div className="title-section">
            <div className="ai-badge-large">
              <span className="badge-ai">AI</span>
              <span className="badge-generated">Generated</span>
            </div>

            <h1 className="prd-title-enhanced ai-generated">
              {prdData.title || 'Untitled Project'}
            </h1>

            <div className="prd-metadata">
              <div className="metadata-item">
                <span className="metadata-icon">📅</span>
                <span className="metadata-text">Created {createdDate}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-icon">📝</span>
                <span className="metadata-text">{wordCount} words</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-icon">🤖</span>
                <span className="metadata-text">AI Enhanced</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="prd-actions">
            <div className="actions-left">
              <button
                className={`view-toggle ${viewMode === 'structured' ? 'active' : ''}`}
                onClick={() => setViewMode('structured')}
              >
                <span className="toggle-icon">📋</span>
                <span className="toggle-text">Structured</span>
              </button>
              <button
                className={`view-toggle ${viewMode === 'raw' ? 'active' : ''}`}
                onClick={() => setViewMode('raw')}
              >
                <span className="toggle-icon">📄</span>
                <span className="toggle-text">Raw Markdown</span>
              </button>
            </div>

            <div className="actions-right">
              <CopyMarkdownButton content={prdData.content} />

              <button
                className="action-btn action-edit glimmer-border"
                onClick={() => navigate(`/prd/${id}/edit`)}
              >
                <span className="btn-icon">✏️</span>
                <span className="btn-text">Edit</span>
              </button>

              <button
                className="action-btn action-delete"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this AI-generated PRD?')) {
                    deleteMutation.mutate(id);
                  }
                }}
                disabled={deleteMutation.isLoading}
              >
                <span className="btn-icon">🗑️</span>
                <span className="btn-text">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRD Content */}
      <div className="prd-content-enhanced">
        {viewMode === 'structured' ? (
          <StructuredPRDContent
            content={prdData.content}
            onCopySection={copySection}
            copiedSection={copiedSection}
          />
        ) : (
          <RawPRDContent content={prdData.content} />
        )}
      </div>

      {/* AI Insights Panel */}
      <div className="ai-insights-panel">
        <div className="insights-header">
          <span className="insights-icon">🧠</span>
          <span className="insights-title">AI Insights</span>
        </div>

        <div className="insights-content">
          <div className="insight-item">
            <div className="insight-icon">📊</div>
            <div className="insight-text">
              <strong>Complexity Level</strong>
              <span>Moderate - Well-structured with clear technical specifications</span>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">🎯</div>
            <div className="insight-text">
              <strong>Completeness</strong>
              <span>Comprehensive coverage of requirements, architecture, and implementation</span>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">⚡</div>
            <div className="insight-text">
              <strong>AI Confidence</strong>
              <span>High - All sections generated with strong contextual understanding</span>
            </div>
          </div>
        </div>

        <div className="insights-tip">
          <span className="tip-icon">💡</span>
          <span className="tip-text">
            This PRD was generated by AI based on your project description.
            You can edit it to add more specific details or refine the content.
          </span>
        </div>
      </div>
    </div>
  );
}

// Structured PRD Content Component with Safe Rendering
function StructuredPRDContent({ content, onCopySection, copiedSection }) {
  const sections = parseMarkdownSections(content);

  return (
    <div className="structured-content">
      {sections.map((section, index) => (
        <div key={index} className="content-section">
          <div className="section-header">
            <h2 className="section-title ai-generated">{section.title}</h2>
            <button
              className="section-copy-btn"
              onClick={() => onCopySection(`section-${index}`, section.content)}
              title="Copy section"
            >
              {copiedSection === `section-${index}` ? '✓' : '📋'}
            </button>
          </div>
          <div className="section-body">
            {section.type === 'code' ? (
              <pre className="code-block-enhanced">
                <code>{section.content}</code>
              </pre>
            ) : section.type === 'list' ? (
              <ul className="content-list">
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <div dangerouslySetInnerHTML={section.safeHtml} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Raw PRD Content Component
function RawPRDContent({ content }) {
  return (
    <div className="raw-content">
      <pre className="raw-markdown">
        <code>{content}</code>
      </pre>
    </div>
  );
}

export default PRDDetailPageEnhanced;