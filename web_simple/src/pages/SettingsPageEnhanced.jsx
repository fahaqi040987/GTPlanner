/**
 * Enhanced Settings Page
 * User preferences and AI configuration with theme customization
 */
import React, { useState } from 'react';
import { useAuthStore } from '../state/authStore';

function SettingsPageEnhanced() {
  const { user, logout } = useAuthStore();
  const [settings, setSettings] = useState({
    theme: 'ai-dark', // ai-dark, ai-light, system
    aiEffects: true,
    animations: true,
    notifications: true,
    emailUpdates: false,
    language: 'en'
  });
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error

  const handleSave = async () => {
    setSaveStatus('saving');

    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handleReset = () => {
    setSettings({
      theme: 'ai-dark',
      aiEffects: true,
      animations: true,
      notifications: true,
      emailUpdates: false,
      language: 'en'
    });
  };

  const themes = [
    {
      id: 'ai-dark',
      name: 'AI Dark',
      description: 'Deep void with electric accents',
      preview: {
        background: 'linear-gradient(135deg, #0a0a0f, #13131f)',
        accent: '#8b5cf6'
      }
    },
    {
      id: 'ai-light',
      name: 'AI Light',
      description: 'Clean clarity with subtle presence',
      preview: {
        background: 'linear-gradient(135deg, #fafbff, #f0f4ff)',
        accent: '#8b5cf6'
      }
    },
    {
      id: 'system',
      name: 'System',
      description: 'Follows your system preference',
      preview: {
        background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
        accent: '#6366f1'
      }
    }
  ];

  return (
    <div className="settings-page-enhanced">
      {/* Page Header */}
      <div className="settings-header-enhanced">
        <div className="header-visual">
          <div className="settings-core">
            <div className="core-gear">⚙️</div>
            <div className="core-pulse-settings"></div>
          </div>
        </div>

        <div className="header-content">
          <div className="header-badge">
            <span className="ai-badge-small">AI</span>
            <span className="badge-text">Configuration</span>
          </div>
          <h1 className="header-title">Settings & Preferences</h1>
          <p className="header-description">
            Customize your AI workspace experience and configure your preferences
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="settings-grid-enhanced">
        {/* Profile Section */}
        <div className="settings-card">
          <div className="card-header-enhanced">
            <div className="header-icon">👤</div>
            <div className="header-text">
              <h2>Profile</h2>
              <p>Your account information and AI identity</p>
            </div>
          </div>

          <div className="card-body">
            <div className="profile-section">
              <div className="profile-avatar-large">
                <span className="avatar-initial-large">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                <div className="avatar-ring-large"></div>
              </div>

              <div className="profile-info">
                <div className="profile-email">{user?.email || 'user@example.com'}</div>
                <div className="profile-status">
                  <span className="status-dot"></span>
                  <span>AI Connected</span>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button className="profile-action-btn">
                <span className="btn-icon">✏️</span>
                <span>Edit Profile</span>
              </button>
              <button
                className="profile-action-btn profile-logout"
                onClick={logout}
              >
                <span className="btn-icon">🚪</span>
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="settings-card">
          <div className="card-header-enhanced">
            <div className="header-icon">🎨</div>
            <div className="header-text">
              <h2>Appearance</h2>
              <p>Customize your AI workspace visual experience</p>
            </div>
          </div>

          <div className="card-body">
            <div className="setting-group">
              <label className="setting-label">Theme</label>
              <div className="theme-selector">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    className={`theme-option ${settings.theme === theme.id ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, theme: theme.id })}
                  >
                    <div
                      className="theme-preview"
                      style={{
                        background: theme.preview.background
                      }}
                    >
                      <div
                        className="theme-accent"
                        style={{ background: theme.preview.accent }}
                      />
                    </div>
                    <div className="theme-info">
                      <div className="theme-name">{theme.name}</div>
                      <div className="theme-description">{theme.description}</div>
                    </div>
                    {settings.theme === theme.id && (
                      <div className="theme-check">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <div className="setting-toggle">
                <div className="toggle-info">
                  <strong>AI Effects</strong>
                  <span>Enable glimmer effects and particle animations</span>
                </div>
                <button
                  className={`toggle-switch ${settings.aiEffects ? 'on' : 'off'}`}
                  onClick={() => setSettings({ ...settings, aiEffects: !settings.aiEffects })}
                  aria-label="Toggle AI effects"
                >
                  <div className="toggle-slider"></div>
                </button>
              </div>

              <div className="setting-toggle">
                <div className="toggle-info">
                  <strong>Animations</strong>
                  <span>Enable smooth transitions and micro-interactions</span>
                </div>
                <button
                  className={`toggle-switch ${settings.animations ? 'on' : 'off'}`}
                  onClick={() => setSettings({ ...settings, animations: !settings.animations })}
                  aria-label="Toggle animations"
                >
                  <div className="toggle-slider"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-card">
          <div className="card-header-enhanced">
            <div className="header-icon">🔔</div>
            <div className="header-text">
              <h2>Notifications</h2>
              <p>Manage how AI updates reach you</p>
            </div>
          </div>

          <div className="card-body">
            <div className="setting-group">
              <div className="setting-toggle">
                <div className="toggle-info">
                  <strong>Push Notifications</strong>
                  <span>Get notified when AI completes PRD generation</span>
                </div>
                <button
                  className={`toggle-switch ${settings.notifications ? 'on' : 'off'}`}
                  onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                  aria-label="Toggle notifications"
                >
                  <div className="toggle-slider"></div>
                </button>
              </div>

              <div className="setting-toggle">
                <div className="toggle-info">
                  <strong>Email Updates</strong>
                  <span>Receive weekly AI activity summaries</span>
                </div>
                <button
                  className={`toggle-switch ${settings.emailUpdates ? 'on' : 'off'}`}
                  onClick={() => setSettings({ ...settings, emailUpdates: !settings.emailUpdates })}
                  aria-label="Toggle email updates"
                >
                  <div className="toggle-slider"></div>
                </button>
              </div>
            </div>

            <div className="setting-info">
              <span className="info-icon">ℹ️</span>
              <span>
                Notifications help you stay updated with AI processing and important updates.
              </span>
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="settings-card">
          <div className="card-header-enhanced">
            <div className="header-icon">🌐</div>
            <div className="header-text">
              <h2>Language</h2>
              <p>Choose your preferred language for AI interactions</p>
            </div>
          </div>

          <div className="card-body">
            <div className="setting-group">
              <label className="setting-label">Interface Language</label>
              <div className="language-selector">
                {[
                  { code: 'en', name: 'English', native: 'English' },
                  { code: 'zh', name: 'Chinese', native: '中文' },
                  { code: 'ja', name: 'Japanese', native: '日本語' },
                  { code: 'es', name: 'Spanish', native: 'Español' },
                  { code: 'fr', name: 'French', native: 'Français' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-option ${settings.language === lang.code ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, language: lang.code })}
                  >
                    <div className="language-name">{lang.name}</div>
                    <div className="language-native">{lang.native}</div>
                    {settings.language === lang.code && (
                      <div className="language-check">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="settings-actions">
        <div className="actions-status">
          {saveStatus === 'saved' && (
            <div className="status-message status-success">
              <span className="status-icon">✓</span>
              <span>Settings saved successfully</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="status-message status-error">
              <span className="status-icon">✗</span>
              <span>Failed to save settings</span>
            </div>
          )}
        </div>

        <div className="actions-buttons">
          <button
            className="action-btn action-reset"
            onClick={handleReset}
          >
            <span>Reset to Defaults</span>
          </button>
          <button
            className={`action-btn action-save glimmer-border ${saveStatus === 'saving' ? 'saving' : ''}`}
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="btn-spinner"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="btn-icon">💾</span>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPageEnhanced;