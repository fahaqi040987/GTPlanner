/**
 * AdminAnalyticsPage - LLM configuration analytics & token cost tracker
 * Sesuai prototype admin_portal_llm_configuration_analytics
 */
import React from 'react';
import AdminLayout from '../components/layout/AdminLayout';

const MODEL_MATRIX = [
  {
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    status: 'healthy',
    role: 'Primary — Deep Reasoning',
    tokens_24h: 1842300,
    cost_24h: 24.15,
    p95_latency: 1820,
    success_rate: 99.2,
  },
  {
    name: 'GPT-4o',
    provider: 'openai',
    status: 'healthy',
    role: 'Secondary — Fast Spec',
    tokens_24h: 912400,
    cost_24h: 11.08,
    p95_latency: 940,
    success_rate: 99.7,
  },
  {
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    status: 'degraded',
    role: 'Tertiary — Long Context',
    tokens_24h: 204100,
    cost_24h: 2.84,
    p95_latency: 2340,
    success_rate: 96.4,
  },
  {
    name: 'Llama-3-70B',
    provider: 'self-hosted',
    status: 'circuit_open',
    role: 'Offline — Fallback Only',
    tokens_24h: 0,
    cost_24h: 0,
    p95_latency: null,
    success_rate: 88.1,
  },
];

const STATUS_STYLES = {
  healthy: { dot: 'bg-tertiary', pill: 'bg-tertiary/10 text-tertiary border-tertiary/30', label: 'HEALTHY' },
  degraded: { dot: 'bg-tertiary animate-pulse', pill: 'bg-primary/10 text-primary border-primary/30', label: 'DEGRADED' },
  circuit_open: { dot: 'bg-error', pill: 'bg-error-container/20 text-error border-error/40', label: 'BREAKER OPEN' },
};

function AdminAnalyticsPage() {
  return (
    <AdminLayout
      title="LLM Analytics & Governance"
      subtitle="Token consumption, cost tracking, latency budgets, and circuit breaker health across all model providers."
      actions={
        <button className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-all active:scale-95">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV (24h)
        </button>
      }
    >
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {[
          { label: 'Total Tokens (24h)', value: '2.96M', delta: '+12.4%', deltaUp: true, icon: 'token' },
          { label: 'Est. Cost (24h)', value: '$38.07', delta: '+8.1%', deltaUp: true, icon: 'payments' },
          { label: 'PRDs Generated', value: '142', delta: '+23', deltaUp: true, icon: 'auto_awesome' },
          { label: 'Avg P95 Latency', value: '1.4s', delta: '-180ms', deltaUp: false, icon: 'speed' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="relative rounded-xl bg-surface-glass/85 p-space-md shadow-lg overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-tertiary"></div>
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                {kpi.label}
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                {kpi.icon}
              </span>
            </div>
            <div className="flex items-baseline gap-space-sm">
              <span className="font-headline text-headline-md text-on-surface font-semibold">
                {kpi.value}
              </span>
              <span
                className={`font-label-sm text-label-sm ${
                  kpi.deltaUp ? 'text-tertiary' : 'text-primary'
                }`}
              >
                {kpi.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Model Matrix table */}
      <div className="rounded-xl bg-surface-glass/85 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-space-md py-space-sm border-b border-subtle">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[18px] text-tertiary">grid_view</span>
            <span className="font-headline text-headline-sm text-on-surface font-semibold">
              LLM Model Matrix
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-outline">
            Auto-failover order: Primary → Secondary → Tertiary
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-subtle">
                {['Model', 'Status', 'Tokens 24h', 'Cost 24h', 'P95 Latency', 'Success', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-space-md py-space-sm font-label-sm text-label-sm text-outline uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {MODEL_MATRIX.map((m) => {
                const s = STATUS_STYLES[m.status];
                return (
                  <tr key={m.name} className="hover:bg-surface-container/50 transition-colors">
                    <td className="px-space-md py-space-sm">
                      <div className="flex flex-col">
                        <span className="font-body-sm text-body-sm text-on-surface font-medium">
                          {m.name}
                        </span>
                        <span className="font-label-sm text-label-sm text-outline">
                          {m.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-space-md py-space-sm">
                      <span
                        className={`inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full border ${s.pill}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-space-md py-space-sm font-mono text-[12px] text-on-surface">
                      {m.tokens_24h.toLocaleString()}
                    </td>
                    <td className="px-space-md py-space-sm font-mono text-[12px] text-tertiary">
                      ${m.cost_24h.toFixed(2)}
                    </td>
                    <td className="px-space-md py-space-sm font-mono text-[12px] text-on-surface-variant">
                      {m.p95_latency ? `${m.p95_latency}ms` : '—'}
                    </td>
                    <td className="px-space-md py-space-sm">
                      <span
                        className={`font-mono text-[12px] ${
                          m.success_rate >= 99
                            ? 'text-tertiary'
                            : m.success_rate >= 95
                              ? 'text-primary'
                              : 'text-error'
                        }`}
                      >
                        {m.success_rate}%
                      </span>
                    </td>
                    <td className="px-space-md py-space-sm text-right">
                      <button className="text-outline hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Vault + Circuit Breakers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-space-md">
        {/* API Vault */}
        <div className="rounded-xl bg-surface-glass/85 p-space-md shadow-lg flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[18px] text-primary">key</span>
              <span className="font-headline text-headline-sm text-on-surface font-semibold">
                API Key Vault
              </span>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/30">
              AES-256 GCM
            </span>
          </div>

          {[
            { label: 'OPENAI_API_KEY', masked: 'sk-••••••••••••4x9F', rotated: '12d ago' },
            { label: 'ANTHROPIC_API_KEY', masked: 'sk-ant-••••••7kQ2', rotated: '3d ago' },
            { label: 'GEMINI_API_KEY', masked: 'AIza••••••••pL0m', rotated: '31d ago' },
          ].map((key) => (
            <div
              key={key.label}
              className="flex items-center justify-between bg-surface-container-lowest px-space-sm py-space-xs rounded-lg"
            >
              <div className="flex flex-col">
                <span className="font-mono text-[12px] text-on-surface">{key.label}</span>
                <span className="font-mono text-[11px] text-outline">{key.masked}</span>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="font-label-sm text-label-sm text-outline">
                  rotated {key.rotated}
                </span>
                <button className="p-1 rounded text-outline hover:text-tertiary hover:bg-surface-container transition-all">
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Circuit Breaker monitor */}
        <div className="rounded-xl bg-surface-glass/85 p-space-md shadow-lg flex flex-col gap-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[18px] text-tertiary">
              electric_bolt
            </span>
            <span className="font-headline text-headline-sm text-on-surface font-semibold">
              Circuit Breakers
            </span>
          </div>

          {[
            { name: 'anthropic', failures: 0, threshold: 3, state: 'CLOSED' },
            { name: 'openai', failures: 0, threshold: 3, state: 'CLOSED' },
            { name: 'gemini', failures: 1, threshold: 3, state: 'CLOSED' },
            { name: 'llama-3-70b', failures: 3, threshold: 3, state: 'OPEN · 30s cooldown' },
          ].map((b) => {
            const isOpen = b.state.startsWith('OPEN');
            return (
              <div
                key={b.name}
                className="flex items-center justify-between bg-surface-container-lowest px-space-sm py-space-xs rounded-lg"
              >
                <span className="font-mono text-[12px] text-on-surface">{b.name}</span>
                <div className="flex items-center gap-space-sm">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: b.threshold }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < b.failures ? 'bg-error' : 'bg-surface-container-highest'
                        }`}
                      ></span>
                    ))}
                  </div>
                  <span
                    className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full border ${
                      isOpen
                        ? 'bg-error-container/20 text-error border-error/40'
                        : 'bg-tertiary/10 text-tertiary border-tertiary/30'
                    }`}
                  >
                    {b.state}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminAnalyticsPage;
