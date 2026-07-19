/**
 * PRD Edit Form Component
 * Inline editing form for PRD title, content, and tech stack
 */
import React, { useState, useEffect } from 'react';

function PRDEditForm({ initialData, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tech_stack: {
      frontend: [],
      backend: [],
      database: [],
      devops: []
    }
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Initialize form with current PRD data
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        tech_stack: initialData.tech_stack || {
          frontend: [],
          backend: [],
          database: [],
          devops: []
        }
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('tech_')) {
      // Handle tech stack array fields
      const techField = name.replace('tech_', '');
      const techArray = value.split(',').map(t => t.trim()).filter(t => t.length > 0);

      setFormData({
        ...formData,
        tech_stack: {
          ...formData.tech_stack,
          [techField]: techArray
        }
      });
    } else {
      // Handle simple fields
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      onSave(formData);
    }
  };

  const formatTechArray = (arr) => {
    return Array.isArray(arr) ? arr.join(', ') : '';
  };

  return (
    <form onSubmit={handleSubmit} className="prd-edit-form">
      {/* Title Editing */}
      <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
        <label className="form-label">
          Title <span className="required">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`form-input ${errors.title ? 'input-error' : ''}`}
          placeholder="PRD Title"
          disabled={isSaving}
        />
        {errors.title && <div className="error-message">{errors.title}</div>}
      </div>

      {/* Content Editing */}
      <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
        <label className="form-label">
          Content <span className="required">*</span>
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          className={`form-textarea ${errors.content ? 'input-error' : ''}`}
          placeholder="# PRD Content

Describe your project requirements, features, and technical details in markdown format.

## Requirements
- Feature 1
- Feature 2

## Technical Details
..."
          rows={15}
          disabled={isSaving}
        />
        {errors.content && <div className="error-message">{errors.content}</div>}
        <p className="caption" style={{ marginTop: 'var(--space-2)', color: 'var(--ink-500)' }}>
          Markdown supported. Use # for headings, - for lists, etc.
        </p>
      </div>

      {/* Tech Stack Editing */}
      <div className="tech-stack-edit">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Technology Stack</h3>

        <div className="tech-grid">
          <div className="form-group">
            <label className="form-label">Frontend</label>
            <input
              type="text"
              name="tech_frontend"
              value={formatTechArray(formData.tech_stack.frontend)}
              onChange={handleChange}
              className="form-input"
              placeholder="React, Vue, Angular (comma-separated)"
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Backend</label>
            <input
              type="text"
              name="tech_backend"
              value={formatTechArray(formData.tech_stack.backend)}
              onChange={handleChange}
              className="form-input"
              placeholder="Node.js, Python, Go (comma-separated)"
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Database</label>
            <input
              type="text"
              name="tech_database"
              value={formatTechArray(formData.tech_stack.database)}
              onChange={handleChange}
              className="form-input"
              placeholder="PostgreSQL, MongoDB, Redis (comma-separated)"
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">DevOps</label>
            <input
              type="text"
              name="tech_devops"
              value={formatTechArray(formData.tech_stack.devops)}
              onChange={handleChange}
              className="form-input"
              placeholder="Docker, Kubernetes, CI/CD (comma-separated)"
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions" style={{
        marginTop: 'var(--space-8)',
        display: 'flex',
        gap: 'var(--space-3)',
        justifyContent: 'flex-end'
      }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="spinner-small"></span>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}

export default PRDEditForm;