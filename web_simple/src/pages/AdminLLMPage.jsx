/**
 * Admin LLM presets page (PRD v2.2.0)
 *
 * Admin-only management of named platform LLM presets: create, edit,
 * delete, activate (exactly one active = the platform default), and test
 * connection. Keys are masked everywhere — the full key is never returned
 * by the API after save.
 */
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { llmConfigAPI } from '../services/api';
import Button from '../components/design-system/Button';
import Card from '../components/design-system/Card';
import InputField from '../components/design-system/InputField';
import StatusBadge from '../components/design-system/StatusBadge';

const EMPTY_FORM = { name: '', base_url: '', api_key: '', model: '' };

function AdminLLMPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', base_url: '', model: '', api_key: '' });
  const [testResults, setTestResults] = useState({});
  const [message, setMessage] = useState('');

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['llm-presets'],
    queryFn: async () => {
      const response = await llmConfigAPI.getPresets();
      return response.data;
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['llm-presets'] });

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleError = (err, fallback) => {
    const detail = err.response?.data?.detail || fallback;
    setFormError(detail);
    setTimeout(() => setFormError(''), 5000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await llmConfigAPI.createPreset(form);
      setForm(EMPTY_FORM);
      flash('Preset created');
      refresh();
    } catch (err) {
      handleError(err, 'Failed to create preset');
    }
  };

  const startEdit = (preset) => {
    setEditingId(preset.id);
    setEditForm({
      name: preset.name,
      base_url: preset.base_url,
      model: preset.model,
      api_key: '',
    });
  };

  const handleUpdate = async (id) => {
    setFormError('');
    const data = { name: editForm.name, base_url: editForm.base_url, model: editForm.model };
    if (editForm.api_key.trim()) data.api_key = editForm.api_key;
    try {
      await llmConfigAPI.updatePreset(id, data);
      setEditingId(null);
      flash('Preset updated');
      refresh();
    } catch (err) {
      handleError(err, 'Failed to update preset');
    }
  };

  const handleDelete = async (preset) => {
    if (!window.confirm(`Delete preset "${preset.name}"?`)) return;
    try {
      await llmConfigAPI.deletePreset(preset.id);
      flash('Preset deleted');
      refresh();
    } catch (err) {
      handleError(err, 'Failed to delete preset');
    }
  };

  const handleActivate = async (id) => {
    try {
      await llmConfigAPI.activatePreset(id);
      flash('Active preset updated — this is now the platform default');
      refresh();
    } catch (err) {
      handleError(err, 'Failed to activate preset');
    }
  };

  const handleTest = async (preset) => {
    setTestResults((prev) => ({ ...prev, [preset.id]: { running: true } }));
    try {
      const response = await llmConfigAPI.testPreset(preset.id);
      setTestResults((prev) => ({
        ...prev,
        [preset.id]: { running: false, ...response.data },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [preset.id]: {
          running: false,
          success: false,
          message: err.response?.data?.detail || 'Test failed',
        },
      }));
    }
  };

  const handleTestUnsaved = async () => {
    setFormError('');
    setTestResults((prev) => ({ ...prev, unsaved: { running: true } }));
    try {
      const response = await llmConfigAPI.testConfig(form);
      setTestResults((prev) => ({
        ...prev,
        unsaved: { running: false, ...response.data },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        unsaved: {
          running: false,
          success: false,
          message: err.response?.data?.detail || 'Test failed',
        },
      }));
    }
  };

  const testBadge = (key) => {
    const result = testResults[key];
    if (!result) return null;
    if (result.running) {
      return <span className="text-body-sm text-on-surface-variant">Testing…</span>;
    }
    return (
      <span className={`text-body-sm ${result.success ? 'text-secondary' : 'text-error'}`}>
        {result.success ? '✓ ' : '✕ '}
        {result.message}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-lg">
        <h1 className="text-headline-lg font-headline-lg text-primary">
          LLM Presets
        </h1>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-xs">
          Named platform LLM configurations. The active preset is the default
          for all generations; users can still add a personal LLM in Settings.
        </p>
      </div>

      {message && (
        <div className="mb-md p-sm px-md rounded-lg bg-secondary-container/20
                        text-on-secondary-container text-body-sm inline-flex
                        items-center gap-xs">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          {message}
        </div>
      )}

      {/* Create form */}
      <Card elevation="medium" padding="xl" className="mb-lg">
        <h2 className="text-headline-md font-headline-md text-primary mb-md">
          Add a preset
        </h2>
        <form onSubmit={handleCreate} className="space-y-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <InputField
              label="Name" name="name" required value={form.name}
              placeholder='e.g. "Fast" or "Strong"'
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <InputField
              label="Model" name="model" required value={form.model}
              placeholder="e.g. gpt-4o-mini"
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          <InputField
            label="Base URL" name="base_url" required value={form.base_url}
            placeholder="https://api.openai.com/v1 (or any OpenAI-compatible endpoint)"
            onChange={(e) => setForm({ ...form, base_url: e.target.value })}
          />
          <InputField
            label="API Key" name="api_key" type="password" required value={form.api_key}
            placeholder="Stored encrypted — never shown again in full"
            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
          />

          {formError && (
            <p className="text-body-sm text-error">{formError}</p>
          )}
          <div className="flex items-center gap-sm flex-wrap">
            <Button type="submit" variant="primary" size="sm">
              <span className="material-symbols-outlined text-[16px]">add</span>
              Create preset
            </Button>
            <Button type="button" variant="outline" size="sm"
                    onClick={handleTestUnsaved}
                    disabled={!form.base_url || !form.api_key || !form.model}>
              <span className="material-symbols-outlined text-[16px]">network_check</span>
              Test before saving
            </Button>
            {testBadge('unsaved')}
          </div>
        </form>
      </Card>

      {/* Preset list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent
                          rounded-full animate-spin" />
        </div>
      ) : presets.length === 0 ? (
        <Card elevation="small" padding="xl">
          <p className="text-body-md text-on-surface-variant text-center">
            No presets yet. Add one above — the first preset becomes the
            active platform default automatically.
          </p>
        </Card>
      ) : (
        <div className="space-y-md">
          {presets.map((preset) => (
            <Card key={preset.id} elevation="small" padding="lg">
              {editingId === preset.id ? (
                <div className="space-y-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <InputField
                      label="Name" name="edit-name" value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <InputField
                      label="Model" name="edit-model" value={editForm.model}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    />
                  </div>
                  <InputField
                    label="Base URL" name="edit-url" value={editForm.base_url}
                    onChange={(e) => setEditForm({ ...editForm, base_url: e.target.value })}
                  />
                  <InputField
                    label="API Key (leave empty to keep current)" name="edit-key"
                    type="password" value={editForm.api_key}
                    placeholder={`Current: ${preset.api_key_masked}`}
                    onChange={(e) => setEditForm({ ...editForm, api_key: e.target.value })}
                  />
                  <div className="flex gap-sm">
                    <Button variant="primary" size="sm"
                            onClick={() => handleUpdate(preset.id)}>
                      Save changes
                    </Button>
                    <Button variant="outline" size="sm"
                            onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center
                                  justify-between gap-sm mb-sm">
                    <div className="flex items-center gap-sm">
                      <h3 className="text-headline-md font-headline-md text-primary">
                        {preset.name}
                      </h3>
                      {preset.is_active ? (
                        <StatusBadge status="Active default" variant="published" />
                      ) : (
                        <StatusBadge status="Inactive" variant="draft" />
                      )}
                    </div>
                    <div className="flex gap-xs flex-wrap">
                      {!preset.is_active && (
                        <Button variant="secondary" size="sm"
                                onClick={() => handleActivate(preset.id)}>
                          <span className="material-symbols-outlined text-[16px]">
                            star
                          </span>
                          Set active
                        </Button>
                      )}
                      <Button variant="outline" size="sm"
                              onClick={() => handleTest(preset)}>
                        <span className="material-symbols-outlined text-[16px]">
                          network_check
                        </span>
                        Test
                      </Button>
                      <Button variant="outline" size="sm"
                              onClick={() => startEdit(preset)}>
                        <span className="material-symbols-outlined text-[16px]">
                          edit
                        </span>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm"
                              onClick={() => handleDelete(preset)}>
                        <span className="material-symbols-outlined text-[16px]">
                          delete
                        </span>
                        Delete
                      </Button>
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 md:grid-cols-3 gap-sm
                                 text-body-sm text-on-surface-variant">
                    <div>
                      <dt className="text-label-caps font-label-caps uppercase
                                     tracking-widest text-outline">Model</dt>
                      <dd className="text-on-surface font-code-md">{preset.model}</dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-label-caps font-label-caps uppercase
                                     tracking-widest text-outline">Base URL</dt>
                      <dd className="text-on-surface font-code-md break-all">
                        {preset.base_url}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-label-caps font-label-caps uppercase
                                     tracking-widest text-outline">API Key</dt>
                      <dd className="text-on-surface font-code-md">
                        {preset.api_key_masked}
                      </dd>
                    </div>
                  </dl>
                  {testBadge(preset.id) && (
                    <p className="mt-sm">{testBadge(preset.id)}</p>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminLLMPage;
