/**
 * Enhanced Dashboard Page - AI Transformation Theme
 * Makes PRD generation feel magical, not mechanical
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { documentAPI } from '../services/api';

function DashboardPageEnhanced() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState('');

  const downloadPRD = async (prd, format) => {
    try {
      const { downloadHelpers } = await import('../services/api');
      const filename = downloadHelpers.exportPRD(prd, format);
      setDownloadStatus(`✓ Downloaded ${filename}`);
      setTimeout(() => setDownloadStatus(''), 3000);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('✗ Download failed');
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
      <div className="ai-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Initializing AI workspace...</p>
        <div className="loading-particles">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                animationDelay: `${i * 0.1}s`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <div className="error-visual">
            <div className="error-particles">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="error-particle"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    transform: `rotate(${i * 45}deg) translateY(-20px)`
                  }}
                />
              ))}
            </div>
            <span className="error-icon">⚡</span>
          </div>
          <div className="error-content">
            <h3>Connection Lost</h3>
            <p>AI services are temporarily unavailable. Your ideas are safe.</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Reconnect to AI
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasDocuments = documents?.data?.length > 0;

  return (
    <div className="ai-dashboard">
      {/* Hero Section - AI Command Center */}
      <div className="ai-hero">
        <div className="hero-visual">
          <div className="ai-core">
            <div className="core-inner">
              <div className="core-pulse"></div>
              <div className="core-ring"></div>
            </div>
          </div>
          <div className="ai-stream">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="stream-particle"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  left: `${5 + Math.random() * 90}%`
                }}
              />
            ))}
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="ai-badge">AI</span>
            <span className="badge-text">Powered Workspace</span>
          </div>
          <h1 className="hero-title">
            <span className="title-morph">Transform</span>
            <span className="title-accent">Ideas</span>
            <span className="title-morph">Into</span>
            <span className="title-glow">Reality</span>
          </h1>
          <p className="hero-description">
            {hasDocuments
              ? `${documents.data.length} PRD${documents.data.length > 1 ? 's' : ''} transformed from concept to clarity`
              : 'Your AI workspace is ready. What will you create today?'
            }
          </p>

          {downloadStatus && (
            <div className="status-toast status-success">
              <span className="toast-icon">✓</span>
              {downloadStatus}
            </div>
          )}
        </div>

        <Link to="/prd/new" className="hero-cta glimmer-border">
          <span className="cta-icon">⚡</span>
          <span className="cta-text">Create with AI</span>
          <span className="cta-arrow">→</span>
        </Link>
      </div>

      {/* Main Content */}
      {!hasDocuments ? (
        <div className="ai-empty">
          <div className="empty-visual">
            <div className="idea-particles">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className="idea-particle"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    left: `${10 + (i % 4) * 25}%`,
                    top: `${10 + Math.floor(i / 4) * 25}%`
                  }}
                />
              ))}
            </div>
            <div className="empty-center">
              <div className="center-icon">💡</div>
              <div className="center-ring"></div>
            </div>
          </div>

          <div className="empty-content">
            <h2 className="empty-title">Your First AI Transformation</h2>
            <p className="empty-description">
              Describe your vision in natural language. Watch as AI structures your thoughts
              into professional technical documentation with precision and insight.
            </p>

            <div className="empty-features">
              <div className="feature-orb">
                <div className="orb-glow"></div>
                <span className="orb-icon">🧠</span>
                <div className="orb-content">
                  <strong>Intelligent Analysis</strong>
                  <span>AI understands context and requirements</span>
                </div>
              </div>
              <div className="feature-orb">
                <div className="orb-glow"></div>
                <span className="orb-icon">⚡</span>
                <div className="orb-content">
                  <strong>Instant Generation</strong>
                  <span>From idea to PRD in seconds</span>
                </div>
              </div>
              <div className="feature-orb">
                <div className="orb-glow"></div>
                <span className="orb-icon">🎯</span>
                <div className="orb-content">
                  <strong>Precision Output</strong>
                  <span>Professional technical documentation</span>
                </div>
              </div>
            </div>

            <Link to="/prd/new" className="empty-cta glimmer-border">
              <span>Begin Transformation</span>
              <span className="cta-glow">→</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="ai-grid">
          {documents.data.map((prd, index) => (
            <Link
              key={prd.id}
              to={`/prd/${prd.id}`}
              className={`prd-orb ${hoveredCard === prd.id ? 'prd-orb-active' : ''}`}
              onMouseEnter={() => setHoveredCard(prd.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {/* AI Glimmer Border */}
              <div className="orb-glimmer"></div>

              {/* Orb Content */}
              <div className="orb-content">
                {/* Processing indicator */}
                <div className="orb-header">
                  <div className="orb-meta">
                    <span className="orb-number glimmer-text">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="orb-status status-processing">
                      <span className="status-dot"></span>
                      AI Enhanced
                    </span>
                  </div>
                  <span className="orb-date">{formatDate(prd.updated_at)}</span>
                </div>

                {/* Title with AI accent */}
                <h3 className="orb-title ai-generated">
                  {prd.title || 'Untitled Project'}
                </h3>

                {/* Content preview */}
                <p className="orb-preview">
                  {prd.content?.substring(0, 100) || 'No content available'}
                  {prd.content?.length > 100 && '...'}
                </p>

                {/* Orb Footer */}
                <div className="orb-footer">
                  <div className="orb-stats">
                    <span className="stat-item">
                      <span className="stat-icon">📝</span>
                      <span className="stat-value">{getWordCount(prd.content)}</span>
                      <span className="stat-label">words</span>
                    </span>
                  </div>

                  {/* Quick actions */}
                  <div className="orb-actions">
                    <button
                      className="orb-action-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadPRD(prd, 'md');
                      }}
                      title="Download as Markdown"
                    >
                      <span className="action-icon">📄</span>
                    </button>
                    <button
                      className="orb-action-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadPRD(prd, 'json');
                      }}
                      title="Download as JSON"
                    >
                      <span className="action-icon">📊</span>
                    </button>
                  </div>

                  <span className="orb-cta">Explore →</span>
                </div>
              </div>

              {/* Hover glow effect */}
              <div className="orb-glow" />
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions Bar */}
      {hasDocuments && (
        <div className="ai-actions">
          <div className="actions-status">
            <span className="status-count">{documents.data.length}</span>
            <span className="status-label">
              {documents.data.length === 1 ? 'project transformed' : 'projects transformed'}
            </span>
            <span className="status-hint">Keep creating with AI</span>
          </div>
          <Link to="/prd/new" className="actions-cta glimmer-border">
            <span>⚡</span>
            <span>Quick Transform</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default DashboardPageEnhanced;