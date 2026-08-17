/**
 * Settings page component - Updated with DesignStitch design system
 */
import React from 'react';
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

export default SettingsPage;