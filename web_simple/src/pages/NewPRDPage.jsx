/**
 * New PRD creation page
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { prdAPI } from '../services/api';

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

  const generateMutation = useMutation({
    mutationFn: prdAPI.generate,
    onSuccess: (response) => {
      // Navigate to the generated PRD
      navigate(`/prd/${response.data.id}`);
    },
    onError: (error) => {
      setError(error.response?.data?.detail || 'Failed to generate PRD');
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
