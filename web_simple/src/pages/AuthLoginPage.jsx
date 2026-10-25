/**
 * AuthLoginPage - Sign In interface with SSO + corporate credentials
 * Sesuai prototype auth_portal_login_register_forgot_password (tab 1)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('alex.chen@company.dev');
  const [password, setPassword] = useState('VibeSecured2025#');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  const handleSSO = (provider) => {
    setLoading(true);
    // Simulate SSO
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-canvas-base text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Action Breadcrumb */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">route</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider hidden md:inline">
            Workflow Journey:
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 font-label-sm text-label-sm">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary border-primary/30 font-semibold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span>0. Auth Portal</span>
          </div>
          <span className="text-on-surface-variant opacity-70">→</span>
          <a href="#" className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
            <span className="text-[11px] opacity-75">1.</span>
            <span>Prompt Hub</span>
          </a>
          <span className="text-on-surface-variant opacity-70">→</span>
          <span className="flex items-center gap-1 px-2.5 py-1 text-on-surface-variant opacity-70">
            <span className="text-[11px]">2.</span>
            <span>PRD & Arch</span>
          </span>
          <span className="text-on-surface-variant opacity-70">→</span>
          <span className="flex items-center gap-1 px-2.5 py-1 text-on-surface-variant opacity-70">
            <span className="text-[11px]">3.</span>
            <span>ERD & Seq</span>
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-7xl px-6 py-8">
        {/* Left: Auth Form */}
        <div className="relative rounded-2xl bg-surface-container-low p-8 shadow-2xl backdrop-blur-2xl overflow-hidden">
          {/* Chromatic Glows */}
          <div className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl"></div>

          {/* Header */}
          <div className="relative z-10 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                <span className="material-symbols-outlined text-[24px]">architecture</span>
              </div>
              <div>
                <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                  Vibe Code Planner
                </h1>
                <p className="font-label-sm text-label-sm text-tertiary">
                  AI-Powered PRD & Distributed Architecture Studio
                </p>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Masuk ke workspace teknik Anda untuk generate PRD instan, diagram Mermaid, dan microservice orchestration specs.
            </p>
          </div>

          {/* Tab navigation (Sign In active) */}
          <div className="relative z-10 flex p-1 rounded-xl bg-surface-container-lowest mb-6">
            <button
              type="button"
              className="flex-1 py-2 px-3 rounded-lg font-label-md text-label-md transition-all text-center flex items-center justify-center gap-1.5 bg-surface-container-high text-on-surface shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Sign In</span>
            </button>
            <a
              href="/register"
              className="flex-1 py-2 px-3 rounded-lg font-label-md text-label-md transition-all text-center flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Register</span>
            </a>
            <a
              href="/forgot-password"
              className="flex-1 py-2 px-3 rounded-lg font-label-md text-label-md transition-all text-center flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">key</span>
              <span>Recovery</span>
            </a>
          </div>

          {/* SSO Quick Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
            <button
              type="button"
              onClick={() => handleSSO('github')}
              className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-all shadow-sm group"
            >
              <svg className="w-4 h-4 fill-current text-on-surface group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="font-label-md text-label-md">GitHub SSO</span>
            </button>
            <button
              type="button"
              onClick={() => handleSSO('google')}
              className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-all shadow-sm group"
            >
              <svg className="w-4 h-4 fill-current text-on-surface group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              <span className="font-label-md text-label-md">Google Workspace</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full h-px bg-surface-container-highest"></div>
            <span className="absolute px-3 bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">
              or company credential
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
                Corporate Work Email
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">mail</span>
                <input
                  className="w-full bg-surface-container-lowest rounded-lg pl-10 pr-4 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  placeholder="alex.chen@company.dev"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-label-sm text-label-sm text-on-surface-variant">
                  Password
                </label>
                <a href="/forgot-password" className="font-label-sm text-label-sm text-tertiary hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">lock</span>
                <input
                  className="w-full bg-surface-container-lowest rounded-lg pl-10 pr-10 py-2.5 font-code-inline text-code-inline text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-on-surface-variant hover:text-on-surface focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between text-on-surface-variant">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded bg-surface-container-lowest text-primary accent-primary cursor-pointer"
                  type="checkbox"
                />
                <span className="font-body-sm text-body-sm">Remember device (30 days)</span>
              </label>
              <span className="flex items-center gap-1 font-label-sm text-label-sm text-tertiary">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                <span>SAML Enforced</span>
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-primary-container via-inverse-primary to-primary text-on-primary-container font-headline-sm text-headline-sm flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_24px_rgba(99,102,241,0.45)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="font-semibold">
                {loading ? 'Authenticating...' : 'Sign In & Launch Step 1: Prompt Hub'}
              </span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Need a dedicated enterprise cluster?
              <a href="/register" className="text-primary hover:underline font-semibold ml-1">
                Create free workspace
              </a>
            </p>
          </div>

          {/* Footer */}
          <div className="relative z-10 mt-6 pt-4 border-t border-surface-container-highest/40 flex flex-wrap items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              Auth Gate v3.14 • TLS 1.3
            </span>
            <span className="text-tertiary">Zero-Knowledge Vault</span>
          </div>
        </div>

        {/* Right: Live Architecture Preview */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col space-y-6 mt-6 lg:mt-0">
          <div className="rounded-2xl bg-surface-container-low p-6 backdrop-blur-xl relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  AI PRD Studio v2.4
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">
                  Execution Benchmark: 11.2s
                </span>
              </div>
              <span className="font-code-inline text-code-inline text-tertiary bg-surface-container-lowest px-2 py-0.5 rounded">
                SPEC-ID: #PRD-9810
              </span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
              Turn Casual Engineering Prompts into Production Architecture
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-5">
              Otomatisasi pembuatan dokumen PRD teknis komprehensif, skema event streaming, API contracts, hingga topology database terdistribusi.
            </p>

            {/* Interactive Micro Node Topology */}
            <div className="rounded-xl bg-surface-container-lowest p-4 relative mb-5 overflow-hidden">
              <div className="flex items-center justify-between mb-3 text-on-surface-variant font-label-sm text-label-sm">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">account_tree</span>
                  <span>Active Graph Flow Synthesis</span>
                </div>
                <span className="text-tertiary">200 OK • Latency 14ms</span>
              </div>

              {/* Nodes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-label-sm text-label-sm">
                <div className="p-2.5 rounded-lg bg-surface-container text-center hover:bg-surface-container-high transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-tertiary mx-auto mb-1"></div>
                  <div className="text-on-surface font-semibold">Edge Ingress</div>
                  <div className="text-on-surface-variant text-[10px]">Cloudflare CDN</div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container text-center hover:bg-surface-container-high transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mb-1"></div>
                  <div className="text-on-surface font-semibold">Kong Gateway</div>
                  <div className="text-on-surface-variant text-[10px]">mTLS Auth Node</div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container text-center hover:bg-surface-container-high transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary mx-auto mb-1"></div>
                  <div className="text-on-surface font-semibold">FastAPI Engine</div>
                  <div className="text-on-surface-variant text-[10px]">Worker Pods x12</div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container text-center hover:bg-surface-container-high transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim mx-auto mb-1"></div>
                  <div className="text-on-surface font-semibold">Kafka Broker</div>
                  <div className="text-on-surface-variant text-[10px]">Dead-Letter Telemetry</div>
                </div>
              </div>

              {/* Tech Badges */}
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-surface-container-highest/30">
                <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">PostgreSQL 16 + pgvector</span>
                <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">Redis 7 Cluster</span>
                <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">OpenTelemetry Hooks</span>
              </div>
            </div>

            {/* Trust Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center pt-2">
              <div className="p-3 rounded-xl bg-surface-container">
                <div className="font-headline-sm text-headline-sm text-primary">24,000+</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Engineers & PMs</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-container">
                <div className="font-headline-sm text-headline-sm text-tertiary">&lt; 15s</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">PRD Draft SLA</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-container">
                <div className="font-headline-sm text-headline-sm text-secondary">99.99%</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Uptime Engine</div>
              </div>
            </div>
          </div>

          {/* Compliance Strip */}
          <div className="rounded-2xl bg-surface-container-low p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Enterprise Compliance Badges
              </span>
              <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Audited 2025
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-label-sm text-label-sm text-on-surface">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container">
                <span className="material-symbols-outlined text-tertiary text-[18px]">security</span>
                <div>
                  <div className="font-semibold">SOC2 Type II</div>
                  <div className="text-[10px] text-on-surface-variant">Verified Trust</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container">
                <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                <div>
                  <div className="font-semibold">ISO 27001</div>
                  <div className="text-[10px] text-on-surface-variant">ISMS Standard</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container">
                <span className="material-symbols-outlined text-secondary text-[18px]">enhanced_encryption</span>
                <div>
                  <div className="font-semibold">AES-256 GCM</div>
                  <div className="text-[10px] text-on-surface-variant">At Rest & Transit</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container">
                <span className="material-symbols-outlined text-tertiary-fixed text-[18px]">key</span>
                <div>
                  <div className="font-semibold">Okta / SAML</div>
                  <div className="text-[10px] text-on-surface-variant">SCIM Provisioning</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Footer */}
      <div className="fixed bottom-6 left-0 right-0 text-center text-on-surface-variant font-label-sm text-label-sm space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <a href="#" className="hover:text-on-surface transition-colors">Master Services Agreement (MSA)</a>
          <span>•</span>
          <a href="#" className="hover:text-on-surface transition-colors">Data Processing Addendum (GDPR)</a>
          <span>•</span>
          <a href="#" className="hover:text-on-surface transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-on-surface transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}

export default AuthLoginPage;
