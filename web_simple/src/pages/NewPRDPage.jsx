/**
 * New PRD creation page with progress indicators
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { prdAPI } from '../services/api';
import ProgressBar from '../components/ProgressBar';

function NewPRDPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    prompt: '',
    tech_preferences: {
      frontend: '',
      backend: '',
      database: '',
    },
  });
  const [error, setError] = useState('');

  // Progress state
  const [progressState, setProgressState] = useState({
    progress: 0,
    status: '',
    isGenerating: false,
    error: null
  });

  // Progress simulation stages with adaptive timing
  const progressStages = [
    { progress: 20, status: "Connecting to AI service...", delay: 2500 },
    { progress: 40, status: "Analyzing your requirements...", delay: 3500 },
    { progress: 60, status: "Generating PRD structure...", delay: 4500 },
    { progress: 80, status: "Building tech stack recommendations...", delay: 3500 },
    { progress: 95, status: "Finalizing document...", delay: 2500 },
    { progress: 100, status: "Saving to database...", delay: 1500 }
  ];

  // Progress simulation function with adaptive timing
  const simulateProgress = async () => {
    for (const stage of progressStages) {
      // Add small random variance for natural feel (±20%)
      const variance = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const adaptiveDelay = stage.delay * variance;

      setProgressState(prev => ({
        ...prev,
        progress: stage.progress,
        status: stage.status
      }));

      await new Promise(resolve => setTimeout(resolve, adaptiveDelay));
    }
  };

  const generateMutation = useMutation({
    mutationFn: prdAPI.generate,
    onMutate: () => {
      // Start progress simulation
      setProgressState({
        progress: 0,
        status: 'Initializing...',
        isGenerating: true,
        error: null
      });
      simulateProgress();
    },
    onSuccess: (response) => {
      // Jump to completion
      setProgressState({
        progress: 100,
        status: 'Complete!',
        isGenerating: false,
        error: null
      });

      // Navigate after brief delay
      setTimeout(() => {
        navigate(`/prd/${response.data.id}`);
      }, 1500);
    },
    onError: (error) => {
      setProgressState({
        progress: 0,
        status: '',
        isGenerating: false,
        error: error.response?.data?.detail || 'Failed to generate PRD'
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.prompt.trim()) {
      setError('Please describe what you want to build');
      return;
    }

    // Filter out empty tech preferences
    const techPreferences = Object.fromEntries(
      Object.entries(formData.tech_preferences).filter(([_, value]) => value.trim())
    );

    generateMutation.mutate({
      prompt: formData.prompt,
      tech_preferences: techPreferences,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('tech_')) {
      const techField = name.replace('tech_', '');
      setFormData({
        ...formData,
        tech_preferences: {
          ...formData.tech_preferences,
          [techField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  return (
    <div className="new-prd-page">
      <div className="page-header">
        <h1>Create New PRD</h1>
        <p>Transform your idea into a structured Product Requirements Document</p>
      </div>

      <div className="card">
        {error && <div className="error">{error}</div>}

        {/* Progress Bar — shown during generation OR when an error occurred */}
        {(progressState.isGenerating || progressState.error) && (
          <ProgressBar
            progress={progressState.progress}
            status={progressState.status}
            error={progressState.error}
            complete={progressState.progress === 100 && !progressState.error}
          />
        )}

        {progressState.error && (
          <div style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--error-50)',
            color: 'var(--error-700)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--error-200)'
          }}>
            <strong>Error:</strong> {progressState.error}
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
              style={{ marginLeft: 'var(--space-3)', marginTop: 'var(--space-2)' }}
            >
              Try Again
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Project Description <span className="required">*</span>
            </label>
            <textarea
              name="prompt"
              value={formData.prompt}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe what you want to build in detail. Include the main features, target users, and any specific requirements..."
              required
            />
            <p className="caption" style={{ marginTop: 'var(--space-2)', color: 'var(--ink-500)' }}>
              Be specific about features, target users, and technical requirements
            </p>
          </div>

          <div className="divider-label">
            <span>Technology Preferences</span>
          </div>

          <p className="mb-6" style={{ color: 'var(--ink-500)' }}>
            Optional: Share your technology preferences and AI will consider them while making recommendations
          </p>

          <div className="tech-grid">
            <div className="form-group">
              <label className="form-label">Frontend</label>
              <input
                type="text"
                name="tech_frontend"
                value={formData.tech_preferences.frontend}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., React, Vue, Angular"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Backend</label>
              <input
                type="text"
                name="tech_backend"
                value={formData.tech_preferences.backend}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Node.js, Python, Go"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Database</label>
              <input
                type="text"
                name="tech_database"
                value={formData.tech_preferences.database}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., PostgreSQL, MongoDB, Redis"
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: 'var(--space-8)' }}>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-large"
              disabled={generateMutation.isLoading}
            >
              {generateMutation.isLoading ? (
                <>
                  <span className="spinner-small"></span>
                  Generating PRD with AI...
                </>
              ) : (
                'Generate PRD with AI ⚡'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewPRDPage;
