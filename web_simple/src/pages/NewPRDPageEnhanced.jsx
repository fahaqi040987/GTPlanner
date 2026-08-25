/**
 * Enhanced New PRD Creation Page
 * Transforms form submission into AI-powered creation experience
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { prdAPI } from '../services/api';
import ProgressBar from '../components/ProgressBar';

function NewPRDPageEnhanced() {
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
  const [creationStage, setCreationStage] = useState('idle'); // idle, thinking, transforming, finalizing

  // Progress state with AI-themed stages
  const [progressState, setProgressState] = useState({
    progress: 0,
    status: '',
    isGenerating: false,
    error: null
  });

  // Enhanced progress stages with AI personality
  const progressStages = [
    {
      progress: 15,
      status: "🤔 AI is reading your vision...",
      stage: "thinking",
      delay: 2000
    },
    {
      progress: 35,
      status: "⚡ Identifying core requirements...",
      stage: "analyzing",
      delay: 3000
    },
    {
      progress: 55,
      status: "🧠 Structuring technical architecture...",
      stage: "structuring",
      delay: 4000
    },
    {
      progress: 75,
      status: "🎯 Recommending optimal tech stack...",
      stage: "optimizing",
      delay: 3000
    },
    {
      progress: 90,
      status: "✨ Polishing documentation...",
      stage: "polishing",
      delay: 2500
    },
    {
      progress: 100,
      status: "🚀 PRD ready!",
      stage: "complete",
      delay: 1500
    }
  ];

  const simulateProgress = async () => {
    for (const stage of progressStages) {
      const variance = 0.8 + Math.random() * 0.4;
      const adaptiveDelay = stage.delay * variance;

      setCreationStage(stage.stage);
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
      setProgressState({
        progress: 5,
        status: '🌟 Initializing AI workspace...',
        isGenerating: true,
        error: null
      });
      setCreationStage('thinking');
      simulateProgress();
    },
    onSuccess: (response) => {
      setProgressState({
        progress: 100,
        status: '✨ Transformation complete!',
        isGenerating: false,
        error: null
      });
      setCreationStage('complete');

      setTimeout(() => {
        navigate(`/prd/${response.data.id}`);
      }, 2000);
    },
    onError: (error) => {
      setProgressState({
        progress: 0,
        status: '',
        isGenerating: false,
        error: error.response?.data?.detail || 'AI transformation failed'
      });
      setCreationStage('error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setCreationStage('idle');

    if (!formData.prompt.trim()) {
      setError('⚠️ Please describe what you want to build');
      return;
    }

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
    <div className="new-prd-page-enhanced">
      {/* Page Header with AI Elements */}
      <div className="page-header-enhanced">
        <div className="header-visual">
          <div className="ai-creation-core">
            <div className={`core-stage core-${creationStage}`}>
              <div className="core-inner">
                <div className="core-pulse"></div>
                <div className="core-rings">
                  <div className="ring ring-1"></div>
                  <div className="ring ring-2"></div>
                  <div className="ring ring-3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="header-content">
          <div className="header-badge">
            <span className="ai-badge-enhanced">AI</span>
            <span className="badge-trail">Powered Creation</span>
          </div>
          <h1 className="header-title">
            <span className="title-part">Transform</span>
            <span className="title-accent"> Vision </span>
            <span className="title-part">Into Reality</span>
          </h1>
          <p className="header-description">
            Describe your project in natural language. Watch as AI structures your thoughts
            into professional technical documentation with precision and insight.
          </p>
        </div>
      </div>

      {/* Main Creation Form */}
      <div className="creation-form-container">
        <div className="form-card card-enhanced">
          {error && (
            <div className="error-message-enhanced">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* AI Progress Visualization */}
          {(progressState.isGenerating || progressState.error) && (
            <div className="ai-progress-visualization">
              <ProgressBar
                progress={progressState.progress}
                status={progressState.status}
                error={progressState.error}
                complete={progressState.progress === 100 && !progressState.error}
              />

              {progressState.isGenerating && (
                <div className="creation-stages">
                  <div className={`stage-indicator stage-${creationStage}`}>
                    <div className="stage-visual">
                      {creationStage === 'thinking' && '🤔'}
                      {creationStage === 'analyzing' && '⚡'}
                      {creationStage === 'structuring' && '🧠'}
                      {creationStage === 'optimizing' && '🎯'}
                      {creationStage === 'polishing' && '✨'}
                      {creationStage === 'complete' && '🚀'}
                    </div>
                    <div className="stage-progress">
                      <div className="stage-bar">
                        <div
                          className="stage-fill"
                          style={{ width: `${progressState.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="ai-form">
            {/* Main Project Description */}
            <div className="form-group-enhanced">
              <label className="form-label-enhanced">
                <span className="label-icon">💡</span>
                <span className="label-text">Project Vision</span>
                <span className="label-required">Required</span>
              </label>
              <textarea
                name="prompt"
                value={formData.prompt}
                onChange={handleChange}
                className="form-textarea-enhanced"
                placeholder="Describe what you want to build in detail...

Example: I want to create a project management tool for remote teams. Key features should include real-time collaboration, task tracking with Kanban boards, time tracking, and integration with popular communication tools like Slack. The target audience is startups and small businesses needing simple but powerful project management."
                required
                disabled={generateMutation.isLoading}
              />
              <div className="form-hint">
                <span className="hint-icon">✨</span>
                <span className="hint-text">
                  Be specific about features, target users, and technical requirements for best AI results
                </span>
              </div>
            </div>

            {/* Technology Preferences Section */}
            <div className="form-section-enhanced">
              <div className="section-divider">
                <div className="divider-line"></div>
                <div className="divider-content">
                  <span className="divider-icon">🛠️</span>
                  <span className="divider-text">Technology Preferences</span>
                  <span className="divider-badge">Optional</span>
                </div>
                <div className="divider-line"></div>
              </div>

              <p className="section-description">
                Share your technology preferences and AI will consider them while making recommendations.
                Leave blank for AI-optimized suggestions.
              </p>

              <div className="tech-grid-enhanced">
                <div className="tech-field-enhanced">
                  <label className="tech-label">
                    <span className="tech-icon">🎨</span>
                    <span>Frontend</span>
                  </label>
                  <input
                    type="text"
                    name="tech_frontend"
                    value={formData.tech_preferences.frontend}
                    onChange={handleChange}
                    className="tech-input-enhanced"
                    placeholder="e.g., React, Vue, Angular"
                    disabled={generateMutation.isLoading}
                  />
                  <div className="tech-suggestions">
                    <span className="suggestion-label">Popular:</span>
                    <button
                      type="button"
                      className="suggestion-chip"
                      onClick={() => handleChange({
                        target: { name: 'tech_frontend', value: 'React' }
                      })}
                      disabled={generateMutation.isLoading}
                    >
                      React
                    </button>
                    <button
                      type="button"
                      className="suggestion-chip"
                      onClick={() => handleChange({
                        target: { name: 'tech_frontend', value: 'Vue.js' }
                      })}
                      disabled={generateMutation.isLoading}
                    >
                      Vue
                    </button>
                  </div>
                </div>

                <div className="tech-field-enhanced">
                  <label className="tech-label">
                    <span className="tech-icon">⚙️</span>
                    <span>Backend</span>
                  </label>
                  <input
                    type="text"
                    name="tech_backend"
                    value={formData.tech_preferences.backend}
                    onChange={handleChange}
                    className="tech-input-enhanced"
                    placeholder="e.g., Node.js, Python, Go"
                    disabled={generateMutation.isLoading}
                  />
                  <div className="tech-suggestions">
                    <span className="suggestion-label">Popular:</span>
                    <button
                      type="button"
                      className="suggestion-chip"
                      onClick={() => handleChange({
                        target: { name: 'tech_backend', value: 'Node.js' }
                      })}
                      disabled={generateMutation.isLoading}
                    >
                      Node.js
                    </button>
                    <button
                      type="button"
                      className="suggestion-chip"
                      onClick={() => handleChange({
                        target: { name: 'tech_backend', value: 'Python' }
                      })}
                      disabled={generateMutation.isLoading}
                    >
                      Python
                    </button>
                  </div>
                </div>

                <div className="tech-field-enhanced">
                  <label className="tech-label">
                    <span className="tech-icon">🗄️</span>
                    <span>Database</span>
                  </label>
                  <input
                    type="text"
                    name="tech_database"
                    value={formData.tech_preferences.database}
                    onChange={handleChange}
                    className="tech-input-enhanced"
                    placeholder="e.g., PostgreSQL, MongoDB, Redis"
                    disabled={generateMutation.isLoading}
                  />
                  <div className="tech-suggestions">
                    <span className="suggestion-label">Popular:</span>
                    <button
                      type="button"
                      className="suggestion-chip"
                      onClick={() => handleChange({
                        target: { name: 'tech_database', value: 'PostgreSQL' }
                      })}
                      disabled={generateMutation.isLoading}
                    >
                      PostgreSQL
                    </button>
                    <button
                      type="button"
                      className="suggestion-chip"
                      onClick={() => handleChange({
                        target: { name: 'tech_database', value: 'MongoDB' }
                      })}
                      disabled={generateMutation.isLoading}
                    >
                      MongoDB
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button with AI Effect */}
            <div className="form-actions-enhanced">
              <button
                type="submit"
                className={`create-button glimmer-border ${generateMutation.isLoading ? 'creating' : ''}`}
                disabled={generateMutation.isLoading}
              >
                {generateMutation.isLoading ? (
                  <>
                    <div className="button-spinner">
                      <div className="spinner-ring"></div>
                      <div className="spinner-ring"></div>
                      <div className="spinner-ring"></div>
                    </div>
                    <span className="button-text">AI is thinking...</span>
                  </>
                ) : (
                  <>
                    <span className="button-icon">⚡</span>
                    <span className="button-text">Generate PRD with AI</span>
                    <span className="button-accent">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Side Panel - AI Capabilities */}
        {!generateMutation.isLoading && (
          <div className="ai-capabilities-panel">
            <div className="panel-header">
              <span className="panel-icon">🧠</span>
              <span className="panel-title">AI Capabilities</span>
            </div>

            <div className="capability-list">
              <div className="capability-item">
                <div className="capability-icon">🎯</div>
                <div className="capability-content">
                  <strong>Requirements Analysis</strong>
                  <span>Extracts and structures key requirements from natural language</span>
                </div>
              </div>

              <div className="capability-item">
                <div className="capability-icon">🏗️</div>
                <div className="capability-content">
                  <strong>Architecture Design</strong>
                  <span>Recommends optimal technical architecture and patterns</span>
                </div>
              </div>

              <div className="capability-item">
                <div className="capability-icon">⚙️</div>
                <div className="capability-content">
                  <strong>Tech Stack Selection</strong>
                  <span>Suggests appropriate technologies based on requirements</span>
                </div>
              </div>

              <div className="capability-item">
                <div className="capability-icon">📋</div>
                <div className="capability-content">
                  <strong>Documentation Structure</strong>
                  <span>Organizes content into professional PRD format</span>
                </div>
              </div>

              <div className="capability-item">
                <div className="capability-icon">🔍</div>
                <div className="capability-content">
                  <strong>Best Practices</strong>
                  <span>Incorporates industry standards and proven patterns</span>
                </div>
              </div>
            </div>

            <div className="panel-tip">
              <span className="tip-icon">💡</span>
              <span className="tip-text">
                <strong>Pro Tip:</strong> The more specific your description, the better the AI can tailor your PRD.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewPRDPageEnhanced;