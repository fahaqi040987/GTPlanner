/**
 * Dashboard page showing user's PRDs
 * Enhanced with studio workspace design and download functionality
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { documentAPI } from '../services/api';

function DashboardPage() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState('');

  const downloadPRD = async (prd, format) => {
    try {
      const { downloadHelpers } = await import('../services/api');
      const filename = downloadHelpers.exportPRD(prd, format);
      setDownloadStatus(`Downloaded ${filename}`);

      // Clear status after 3 seconds
      setTimeout(() => setDownloadStatus(''), 3000);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('Download failed - please try again');
      setTimeout(() => setDownloadStatus(''), 3000);
    }
  };

  const {
    data: documents,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentAPI.list(),
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getWordCount = (content) => {
    if (!content) return 0;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  if (isLoading) {
    return (
      <div className="studio-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Preparing your studio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="studio-error">
        <div className="error-icon">!</div>
        <div className="error-content">
          <h3>Unable to load your workspace</h3>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasDocuments = documents?.data?.length > 0;

  return (
    <div className="studio-dashboard">
      {/* Hero Section - Studio Introduction */}
      <div className="studio-hero">
        <div className="hero-content">
          <div className="hero-greeting">
            <span className="greeting-emoji">✨</span>
            <h1>Welcome back</h1>
          </div>
          <p className="hero-subtitle">
            {hasDocuments
              ? `You have ${documents.data.length} PRD${documents.data.length > 1 ? 's' : ''} in progress`
              : 'Your studio is ready for your first project'
            }
          </p>
          {downloadStatus && (
            <div style={{
              marginTop: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--success-700)',
              backgroundColor: 'var(--success-50)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--success-200)'
            }}>
              ✓ {downloadStatus}
            </div>
          )}
        </div>
        <Link to="/prd/new" className="studio-cta">
          <span className="cta-icon">+</span>
          <span className="cta-text">New PRD</span>
          <span className="cta-accent">→</span>
        </Link>
      </div>

      {/* Main Content */}
      {!hasDocuments ? (
        <div className="studio-empty">
          <div className="empty-illustration">
            <div className="illustration-grid">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="grid-cell" style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
            <div className="illustration-center">
              <span className="center-icon">📋</span>
            </div>
          </div>

          <div className="empty-content">
            <h2 className="empty-title">Create your first PRD</h2>
            <p className="empty-description">
              Transform your ideas into structured technical documentation.
              Start with a simple description and let AI help you build comprehensive requirements.
            </p>

            <div className="empty-features">
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div className="feature-text">
                  <strong>Quick generation</strong>
                  <span>From idea to PRD in seconds</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <div className="feature-text">
                  <strong>Structured output</strong>
                  <span>Professional technical documentation</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔄</span>
                <div className="feature-text">
                  <strong>Iterative refinement</strong>
                  <span>Update and improve anytime</span>
                </div>
              </div>
            </div>

            <Link to="/prd/new" className="empty-cta">
              <span>Start Creating</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="studio-grid">
          {documents.data.map((prd, index) => (
            <Link
              key={prd.id}
              to={`/prd/${prd.id}`}
              className={`prd-card ${hoveredCard === prd.id ? 'prd-card-hovered' : ''}`}
              onMouseEnter={() => setHoveredCard(prd.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Blueprint-style corners */}
              <div className="card-corner top-left"></div>
              <div className="card-corner top-right"></div>
              <div className="card-corner bottom-left"></div>
              <div className="card-corner bottom-right"></div>

              <div className="card-content">
                {/* Card header */}
                <div className="prd-header">
                  <div className="prd-meta">
                    <span className="prd-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="prd-type">PRD</span>
                  </div>
                  <span className="prd-date">{formatDate(prd.updated_at)}</span>
                </div>

                {/* Card body */}
                <h3 className="prd-title">{prd.title || 'Untitled Project'}</h3>

                <p className="prd-excerpt">
                  {prd.content?.substring(0, 120) || 'No description available'}
                  {prd.content?.length > 120 && '...'}
                </p>

                {/* Card footer */}
                <div className="prd-footer">
                  <div className="prd-stats">
                    <span className="stat-item">
                      <span className="stat-icon">📝</span>
                      {getWordCount(prd.content)} words
                    </span>
                  </div>

                  {/* Download buttons */}
                  <div className="prd-card-download">
                    <button
                      className="card-download-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadPRD(prd, 'md');
                      }}
                      title="Download as Markdown"
                    >
                      <span className="card-download-icon">📄</span>
                    </button>
                    <button
                      className="card-download-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadPRD(prd, 'json');
                      }}
                      title="Download as JSON"
                    >
                      <span className="card-download-icon">📊</span>
                    </button>
                  </div>

                  <span className="prd-action">View →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions bar */}
      {hasDocuments && (
        <div className="studio-actions">
          <div className="actions-info">
            <span className="actions-count">{documents.data.length} projects</span>
            <span className="actions-hint">Keep the momentum going</span>
          </div>
          <Link to="/prd/new" className="actions-secondary">
            <span>+ Quick Add</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
