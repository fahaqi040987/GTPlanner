/**
 * Dashboard page showing user's PRDs
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { documentAPI } from '../services/api';

function DashboardPage() {
  const {
    data: documents,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentAPI.list(),
  });

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p className="caption">Loading your workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        Failed to load documents: {error.message}
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Your Workspace</h1>
          <p>Manage and generate product requirements documents</p>
        </div>
        <Link to="/prd/new" className="btn btn-primary">
          <span>+</span> New PRD
        </Link>
      </div>

      {!documents?.data?.length ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h2 className="empty-state-title">No PRDs yet</h2>
          <p className="empty-state-text">
            Start by creating your first Product Requirements Document. Transform your ideas into structured technical documentation.
          </p>
          <Link to="/prd/new" className="btn btn-primary btn-large">
            Create Your First PRD
          </Link>
        </div>
      ) : (
        <div className="dashboard-grid">
          {documents.data.map((prd) => (
            <Link key={prd.id} to={`/prd/${prd.id}`} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{prd.title}</h3>
                  <p className="card-subtitle">
                    {new Date(prd.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <span className="label">PRD</span>
              </div>
              <p className="prd-summary">
                {prd.content?.substring(0, 150) || 'No content available'}
                {prd.content?.length > 150 && '...'}
              </p>
              <div className="card-footer">
                <span className="caption">View details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
