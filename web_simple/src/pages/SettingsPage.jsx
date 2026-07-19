/**
 * Settings Page
 * User preferences and application settings
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your application preferences</p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 'var(--space-4)' }}>User Preferences</h2>

        <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--bg-50)', borderRadius: 'var(--radius-1)' }}>
          <p style={{ color: 'var(--ink-500)', marginBottom: 'var(--space-4)' }}>
            Settings functionality coming soon. This will include:
          </p>
          <ul style={{ color: 'var(--ink-500)', marginLeft: 'var(--space-4)' }}>
            <li>API key management</li>
            <li>Theme preferences</li>
            <li>Export format defaults</li>
            <li>Notification settings</li>
          </ul>
        </div>

        <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-500)', fontSize: 'var(--font-size-sm)' }}>
            For now, you can manage your PRDs from the <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-ghost"
              style={{ padding: '0 0.25rem' }}
            >Dashboard</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;