/**
 * New PRD page — guided generation workflow (PRD v1.0.0 vibe-code spec)
 * 
 * Implements DesignStitch "Prompt Hub AI PRD Generator" (Step 1)
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowAPI, llmConfigAPI } from '../services/api';

function NewPRDPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('');
  const [error, setError] = useState('');

  // Workflow state
  const [workflow, setWorkflow] = useState(null);

  // Step 1 — intake form
  const [idea, setIdea] = useState('');
  const [techPrefs, setTechPrefs] = useState({ frontend: '', backend: '', database: '' });
  const [llmChoice, setLlmChoice] = useState('default');
  const [presets, setPresets] = useState([]);
  const [complexity, setComplexity] = useState('comprehensive');

  const stepIndex = workflow
    ? { clarify: 1, review: 2 }[workflow.current_step] ?? 0
    : 0;

  useEffect(() => {
    resumeWorkflow();
    loadPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumeWorkflow = async () => {
    try {
      const response = await workflowAPI.getCurrent();
      adoptWorkflow(response.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || 'Failed to load your workflow');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPresets = async () => {
    try {
      const response = await llmConfigAPI.getPublicPresets();
      if (Array.isArray(response.data)) {
        setPresets(response.data);
      }
    } catch (err) {
      console.error('Failed to load presets', err);
    }
  };

  const adoptWorkflow = (wfData) => {
    setWorkflow(wfData);
    setIdea(wfData.prompt || '');
    setTechPrefs(wfData.tech_preferences || { frontend: '', backend: '', database: '' });
    setError('');
  };

  const handleStart = async (e) => {
    if (e) e.preventDefault();
    if (!idea.trim()) {
      setError('Please provide a project idea');
      return;
    }
    setBusy(true);
    setBusyLabel('Synthesizing architecture...');
    setError('');
    try {
      const payload = {
        prompt: idea,
        tech_preferences: techPrefs,
      };
      if (llmChoice !== 'default' && llmChoice !== 'personal') {
        payload.preset_id = parseInt(llmChoice, 10);
      } else if (llmChoice === 'personal') {
        payload.llm_choice = { use_personal: true };
      }
      
      const response = await workflowAPI.create(payload);
      adoptWorkflow(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start generation workflow');
    } finally {
      setBusy(false);
    }
  };

  const handleApplyPreset = (presetText) => {
    setIdea(presetText);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-canvas-base">
        <div className="flex flex-col items-center gap-space-md">
          <span className="material-symbols-outlined text-[32px] text-tertiary animate-spin">progress_activity</span>
          <p className="font-label-md text-on-surface-variant">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-canvas-base text-on-surface pb-space-2xl overflow-x-hidden">
      {/* Chromatic Ambient Glow Elements */}
      <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-primary/10 rounded-full blur-[120px] z-0"></div>
      <div className="pointer-events-none absolute top-48 right-12 w-[380px] h-[300px] bg-tertiary/10 rounded-full blur-[100px] z-0"></div>
      
      {/* Header Block */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto pt-space-md pb-space-lg px-gutter">
        <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-high text-tertiary mb-space-md shadow-sm border border-border-subtle">
          <span className="material-symbols-outlined text-[16px] text-tertiary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <span className="font-label-sm text-label-sm tracking-wide uppercase">Multi-Agent Architectural Synthesis</span>
          <span className="w-1 h-1 rounded-full bg-tertiary/60 mx-space-xs"></span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">v2.4 Core</span>
        </div>
        <h1 className="font-headline text-headline-xl text-on-surface tracking-tight max-w-3xl leading-[1.1]">
          Transform Any Project Idea into a <span className="bg-gradient-to-r from-primary via-tertiary to-secondary bg-clip-text text-transparent">Production-Ready PRD</span> & Architecture
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant mt-space-md max-w-2xl leading-relaxed">
          Instant user stories, deterministic architecture diagrams, and tailored tech stack recommendations powered by coordinated LLMs.
        </p>

        {/* Pipeline State Indicators */}
        <div className="flex items-center justify-center gap-space-lg mt-space-lg text-on-surface-variant">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
            <span className="font-label-sm text-label-sm text-on-surface">Claude 3.5 Sonnet</span>
            <span className="font-label-sm text-label-sm text-outline">System Topology</span>
          </div>
          <span className="text-outline">/</span>
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="font-label-sm text-label-sm text-on-surface">GPT-4o</span>
            <span className="font-label-sm text-label-sm text-outline">Spec & Data Model</span>
          </div>
          <span className="text-outline">/</span>
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[14px] text-tertiary">bolt</span>
            <span className="font-label-sm text-label-sm text-on-surface">142ms Engine</span>
          </div>
        </div>
      </div>

      {/* Main Workbench Area */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-gutter mt-space-md">
        {error && (
          <div className="mb-space-md p-space-md bg-error-container/10 border border-error/30 rounded-xl flex items-start gap-space-sm text-error animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="material-symbols-outlined">error</span>
            <p className="font-body text-body-sm pt-0.5">{error}</p>
          </div>
        )}

        {/* Hero Prompt Entry Panel */}
        {stepIndex === 0 && (
          <div className="relative group transition-all duration-500">
            {/* Neon Aura Background */}
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary via-tertiary to-secondary opacity-30 blur-lg transition duration-700 group-hover:opacity-50"></div>
            
            <div className="relative rounded-2xl bg-surface-glass/95 backdrop-blur-2xl p-space-lg shadow-2xl flex flex-col gap-space-md border border-white/5">
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm border-b border-white/5">
                <div className="flex items-center gap-space-xs">
                  <span className="p-space-xs rounded-md bg-surface-container-highest text-tertiary">
                    <span className="material-symbols-outlined text-[18px]">terminal</span>
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold tracking-wide uppercase">Concept Prompt</span>
                  <span className="font-mono text-[11px] text-outline ml-space-xs opacity-60">MARKDOWN SUPPORTED</span>
                </div>
                
                {/* Provider Selector */}
                <div className="flex items-center gap-space-xs bg-surface-container-lowest p-1 rounded-xl border border-white/5">
                  <button 
                    type="button" 
                    className={`px-space-md py-1 rounded-lg font-label-sm text-label-sm transition-all duration-200 flex items-center gap-space-xs ${llmChoice === 'default' ? 'bg-surface-elevated text-on-surface shadow-sm border border-white/10' : 'text-on-surface-variant hover:text-on-surface'}`}
                    onClick={() => setLlmChoice('default')}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                    Deep Reasoning
                  </button>
                  {presets.map(p => (
                    <button 
                      key={p.id}
                      type="button" 
                      className={`px-space-md py-1 rounded-lg font-label-sm text-label-sm transition-all duration-200 flex items-center gap-space-xs ${llmChoice === p.id.toString() ? 'bg-surface-elevated text-on-surface shadow-sm border border-white/10' : 'text-on-surface-variant hover:text-on-surface'}`}
                      onClick={() => setLlmChoice(p.id.toString())}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea 
                  id="prompt-input" 
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe your product concept, user personas, and target platforms... (e.g., An AI-driven fitness coaching SaaS with gamification and Stripe billing)" 
                  rows="5"
                  className="w-full bg-surface-container-lowest text-on-surface font-body text-body-md leading-relaxed rounded-xl p-space-md placeholder:text-outline/40 border border-white/5 focus:border-tertiary/50 focus:ring-1 focus:ring-tertiary/20 resize-none min-h-[160px] transition-all duration-300"
                  disabled={busy}
                ></textarea>
                <div className="absolute bottom-3 right-3 flex items-center gap-space-xs text-outline/50 font-mono text-[11px] pointer-events-none">
                  <span>{idea.length}</span> / 4000
                </div>
              </div>

              {/* Quick Preset Tags */}
              <div className="flex flex-col gap-space-sm">
                <div className="flex flex-wrap items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-outline/70 mr-space-xs uppercase tracking-wider text-[11px]">Presets:</span>
                  
                  <button 
                    type="button" 
                    onClick={() => handleApplyPreset('B2B multi-tenant SaaS with hierarchical workspace permissions, audit log, telemetry, Stripe billing, and Supabase RLS.')}
                    className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-elevated hover:text-on-surface text-[12px] font-label-sm transition-all flex items-center gap-1 border border-white/5"
                  >
                    <span className="material-symbols-outlined text-[14px] text-primary">cloud_done</span> SaaS Platform
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => handleApplyPreset('Native cross-platform mobile application (React Native / Expo) with offline SQLite caching and biometric auth.')}
                    className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-elevated hover:text-on-surface text-[12px] font-label-sm transition-all flex items-center gap-1 border border-white/5"
                  >
                    <span className="material-symbols-outlined text-[14px] text-tertiary">devices</span> Mobile App
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => handleApplyPreset('Autonomous AI workflow agent operating asynchronously via LangGraph, utilizing tool calling and vector memory.')}
                    className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-elevated hover:text-on-surface text-[12px] font-label-sm transition-all flex items-center gap-1 border border-white/5"
                  >
                    <span className="material-symbols-outlined text-[14px] text-secondary">smart_toy</span> AI Agent
                  </button>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-sm mt-space-xs border-t border-white/5">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <span className="font-label-sm text-label-sm text-outline/70 mr-space-xs uppercase tracking-wider text-[11px]">Depth:</span>
                    <button 
                      type="button" 
                      onClick={() => setComplexity('comprehensive')}
                      className={`px-space-md py-1.5 rounded-lg font-label-sm text-label-sm flex items-center gap-1.5 transition-all border ${complexity === 'comprehensive' ? 'bg-surface-elevated text-tertiary border-tertiary/30' : 'bg-surface-container text-on-surface-variant hover:text-on-surface border-white/5'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">account_tree</span>
                      Comprehensive
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setComplexity('mvp')}
                      className={`px-space-md py-1.5 rounded-lg font-label-sm text-label-sm flex items-center gap-1.5 transition-all border ${complexity === 'mvp' ? 'bg-surface-elevated text-tertiary border-tertiary/30' : 'bg-surface-container text-on-surface-variant hover:text-on-surface border-white/5'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">speed</span>
                      Sprint MVP
                    </button>
                  </div>

                  <div className="flex items-center gap-space-sm ml-auto">
                    <button 
                      type="button" 
                      onClick={handleStart}
                      disabled={busy || !idea.trim()}
                      className="group relative px-space-lg py-space-sm rounded-lg bg-gradient-to-r from-primary-container to-secondary-container hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white font-headline text-headline-sm font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-space-sm border border-white/10"
                    >
                      {busy ? (
                        <>
                          <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                          <span>{busyLabel}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">electric_bolt</span>
                          <span>Generate PRD & Architecture</span>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 text-tertiary text-label-sm font-medium border border-tertiary/20">
                            <span>Step 2</span>
                            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Progression State */}
        {stepIndex > 0 && (
          <div className="p-space-xl bg-surface-glass border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-space-md mb-space-lg">
              <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center border border-tertiary/20">
                <span className="material-symbols-outlined text-tertiary text-[28px] animate-spin">progress_activity</span>
              </div>
              <div>
                <h3 className="font-headline text-headline-md text-on-surface">Architectural Synthesis Active</h3>
                <p className="font-body text-body-sm text-on-surface-variant">The AI is currently building your multi-pane PRD workbench.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-space-md mb-space-lg">
              <div className="p-space-md rounded-xl bg-surface-container-lowest border border-white/5">
                <span className="font-mono text-[10px] text-outline uppercase">Module 1</span>
                <p className="font-label-md text-on-surface mt-1">PRD Markdown</p>
                <div className="mt-2 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse w-3/4"></div>
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest border border-white/5">
                <span className="font-mono text-[10px] text-outline uppercase">Module 2</span>
                <p className="font-label-md text-on-surface mt-1">Diagram Topology</p>
                <div className="mt-2 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary animate-pulse w-1/2"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-space-md">
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-space-md py-space-sm bg-surface-elevated text-on-surface rounded-lg hover:bg-surface-variant transition-colors border border-white/10 font-label-md text-label-md"
              >
                Go to Dashboard
              </button>
              <span className="font-mono text-[12px] text-tertiary">ESTIMATED COMPLETION: 45s</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewPRDPage;
