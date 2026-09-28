/**
 * Settings page component - Updated with DesignStitch design system
 * Includes the personal LLM override (BYO key) card from PRD v2.2.0.
 */
import React from 'react';
import { llmConfigAPI } from '../services/api';
import Card from '../components/design-system/Card';
import Button from '../components/design-system/Button';
import InputField from '../components/design-system/InputField';

function SettingsPage() {
  // Preserve existing settings logic
  const [settings, setSettings] = React.useState({
    theme: 'light',
    notifications: true,
    autoSave: true,
    language: 'en'
  });

  const handleSave = () => {
    // Preserve existing save logic
    console.log('Saving settings:', settings);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-xl">
        <h1 className="text-headline-lg font-headline-lg text-primary">
          Settings
        </h1>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-xs">
          Configure your application preferences
        </p>
      </div>

      {/* Settings Cards */}
      <div className="space-y-lg">
        <PersonalLLMCard />

        {/* Appearance Settings */}
        <Card elevation="medium" padding="xl">
          <div className="space-y-lg">
            <h2 className="text-headline-md font-headline-md text-primary">
              Appearance
            </h2>
            
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-body-md text-on-surface">Theme</label>
                  <p className="text-body-sm text-on-surface-variant">
                    Choose your preferred color scheme
                  </p>
                </div>
                <select 
                  className="px-md py-sm bg-surface border border-outline-variant 
                             rounded-lg text-body-md text-on-surface focus:outline-none 
                             focus:border-secondary"
                  value={settings.theme}
                  onChange={(e) => setSettings({...settings, theme: e.target.value})}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Editor Settings */}
        <Card elevation="medium" padding="xl">
          <div className="space-y-lg">
            <h2 className="text-headline-md font-headline-md text-primary">
              Editor
            </h2>
            
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-body-md text-on-surface">Auto Save</label>
                  <p className="text-body-sm text-on-surface-variant">
                    Automatically save changes while editing
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                  className="w-5 h-5 text-secondary rounded focus:ring-secondary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-body-md text-on-surface">Language</label>
                  <p className="text-body-sm text-on-surface-variant">
                    Select your preferred language
                  </p>
                </div>
                <select 
                  className="px-md py-sm bg-surface border border-outline-variant 
                             rounded-lg text-body-md text-on-surface focus:outline-none 
                             focus:border-secondary"
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                >
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card elevation="medium" padding="xl">
          <div className="space-y-lg">
            <h2 className="text-headline-md font-headline-md text-primary">
              Notifications
            </h2>
            
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-body-md text-on-surface">Email Notifications</label>
                  <p className="text-body-sm text-on-surface-variant">
                    Receive updates via email
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                  className="w-5 h-5 text-secondary rounded focus:ring-secondary"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-lg">
          <Button 
            variant="primary"
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Personal LLM override (BYO key) — PRD v2.2.0.
 * When configured, the user can select "My personal LLM" in the PRD
 * workflow instead of an admin preset. The key is stored encrypted and
 * only ever shown masked again.
 */
function PersonalLLMCard() {
  const [config, setConfig] = React.useState(null); // saved config (masked)
  const [form, setForm] = React.useState({ base_url: '', api_key: '', model: '' });
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const response = await llmConfigAPI.getMyConfig();
        setConfig(response.data);
        setForm({
          base_url: response.data.base_url,
          api_key: '',
          model: response.data.model,
        });
      } catch (err) {
        if (err.response?.status !== 404) {
          setError('Failed to load your LLM configuration');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSave = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await llmConfigAPI.saveMyConfig(form);
      setConfig(response.data);
      setForm((prev) => ({ ...prev, api_key: '' }));
      flash(`Saved — key now shows as ${response.data.api_key_masked}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save your LLM configuration');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError('');
    try {
      await llmConfigAPI.deleteMyConfig();
      setConfig(null);
      setForm({ base_url: '', api_key: '', model: '' });
      setTestResult(null);
      flash('Personal LLM removed');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove your LLM configuration');
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await llmConfigAPI.testConfig(form);
      setTestResult(response.data);
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.detail || 'Test failed',
      });
    } finally {
      setBusy(false);
    }
  };

  const canSave = form.base_url.trim() && form.api_key.trim() && form.model.trim();

  return (
    <Card elevation="medium" padding="xl">
      <div className="space-y-lg">
        <div>
          <h2 className="text-headline-md font-headline-md text-primary">
            Personal LLM
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-xs">
            Optional: use your own OpenAI-compatible endpoint instead of a
            platform preset. Stored encrypted; the full key is never shown
            again.
          </p>
        </div>

        {loading ? (
          <p className="text-body-sm text-on-surface-variant">Loading…</p>
        ) : (
          <>
            {config && (
              <div className="flex items-center gap-sm p-sm rounded-lg
                              bg-secondary-container/20 text-on-secondary-container
                              text-body-sm">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Configured: {config.model} — key {config.api_key_masked}
              </div>
            )}

            <InputField
              label="Base URL" name="llm-base-url" value={form.base_url}
              placeholder="https://api.openai.com/v1"
              onChange={(e) => setForm({ ...form, base_url: e.target.value })}
            />
            <InputField
              label={config ? 'API Key (leave empty to keep current)' : 'API Key'}
              name="llm-api-key" type="password" value={form.api_key}
              placeholder={config ? `Current: ${config.api_key_masked}` : 'sk-…'}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
            />
            <InputField
              label="Model" name="llm-model" value={form.model}
              placeholder="e.g. gpt-4o-mini"
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />

            {error && <p className="text-body-sm text-error">{error}</p>}
            {message && (
              <p className="text-body-sm text-secondary">{message}</p>
            )}
            {testResult && (
              <p className={`text-body-sm ${
                testResult.success ? 'text-secondary' : 'text-error'
              }`}>
                {testResult.success ? '✓ ' : '✕ '}{testResult.message}
              </p>
            )}

            <div className="flex gap-sm flex-wrap">
              <Button
                variant="primary" size="sm"
                onClick={handleSave}
                disabled={busy || (!config && !canSave)}
              >
                {config ? 'Update Personal LLM' : 'Save Personal LLM'}
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={handleTest}
                disabled={busy || !form.base_url.trim() || !form.model.trim()}
              >
                <span className="material-symbols-outlined text-[16px]">
                  network_check
                </span>
                Test Connection
              </Button>
              {config && (
                <Button variant="outline" size="sm" onClick={handleRemove}
                        disabled={busy}>
                  Remove
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

export default SettingsPage;