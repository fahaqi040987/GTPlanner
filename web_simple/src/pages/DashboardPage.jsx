/**
 * DashboardPage - Personal & Team PRD Workspace Directory
 * Sesuai prototype workspace_prd_document_history
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { documentAPI } from '../services/api';

const MOCK_DOCS = [
  {
    id: 'PRD-8821',
    title: 'Vibe Code Planner Core Engine',
    desc: 'Autonomous multi-agent orchestration, pgvector index, and reactive dual-pane workbench.',
    status: 'Ready',
    statusTone: 'tertiary',
    version: 'v1.0.0',
    framework: 'Next.js + FastAPI',
    tokens: '42.8k',
    timeAgo: '2 hours ago',
    gitSync: true,
  },
  {
    id: 'PRD-7402',
    title: 'B2B Multi-tenant SaaS Ledger',
    desc: 'Stripe metered billing, hierarchical permissions, audit logs, and Supabase RLS.',
    status: 'In Review',
    statusTone: 'primary',
    version: 'v0.9.4',
    framework: 'Remix + Go',
    tokens: '28.1k',
    timeAgo: '1 day ago',
    gitSync: true,
  },
  {
    id: 'PRD-6190',
    title: 'Real-time Telemetry & Edge Gateway',
    desc: 'Distributed trace aggregation, Envoy proxy rate limiter, and Kafka broker topology.',
    status: 'Draft',
    statusTone: 'outline',
    version: 'v0.3.0',
    framework: 'Rust + gRPC',
    tokens: '14.5k',
    timeAgo: '3 days ago',
    gitSync: false,
  },
];

const TONE_STYLES = {
  tertiary: 'bg-tertiary/10 text-tertiary border-tertiary/30',
  primary: 'bg-primary/10 text-primary border-primary/30',
  outline: 'bg-surface-container text-outline border-transparent',
};

function DashboardPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const { data: realDocs, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      try {
        const response = await documentAPI.list();
        return response.data;
      } catch {
        return null;
      }
    },
  });

  // Use real docs if available, fallback to mock prototype docs
  const docs = realDocs && realDocs.length > 0 ? realDocs.map(d => ({
    id: `PRD-${d.id}`,
    title: d.title,
    desc: d.content ? d.content.substring(0, 100) + '...' : 'No description',
    status: 'Ready',
    statusTone: 'tertiary',
    version: 'v1.0.0',
    framework: 'FastAPI',
    tokens: '—',
    timeAgo: d.created_at ? new Date(d.created_at).toLocaleDateString() : 'recently',
    gitSync: false,
    rawId: d.id,
  })) : MOCK_DOCS;

  return (
    <div className="relative min-h-screen bg-canvas-base text-on-surface pb-space-2xl">
      {/* Top Ambient Glow Field */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-12 right-1/4 w-80 h-80 bg-tertiary/10 rounded-full blur-[90px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col gap-space-lg max-w-7xl mx-auto px-gutter pt-space-md">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-label-sm text-label-sm px-space-sm py-space-xs rounded-full bg-surface-container-high text-tertiary flex items-center gap-1.5 border border-border-subtle">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                Workspace Directory
              </span>
              <span className="font-label-sm text-label-sm px-space-sm py-space-xs rounded-full bg-surface-container-highest text-on-surface-variant font-medium">
                {docs.length} Documents Created
              </span>
            </div>
            <h1 className="font-headline text-headline-lg text-on-surface tracking-tight mt-space-xs">
              Personal & Team PRD Workspace
            </h1>
            <p className="font-body text-body-md text-on-surface-variant max-w-2xl">
              Centralized specification repository, architectural blueprints, and prompt lineage tracking for active multi-agent builds.
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-space-sm self-start md:self-auto">
            <button
              onClick={() => navigate('/prd/new')}
              className="px-space-md py-space-sm rounded-lg bg-gradient-to-r from-primary-container to-secondary-container text-white hover:brightness-110 font-label-md text-label-md flex items-center gap-space-xs shadow-md transition-all border border-white/10"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span className="font-semibold">New PRD Project</span>
            </button>
          </div>
        </div>

        {/* Bento KPI strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {[
            { label: 'Total PRDs Generated', value: docs.length, sub: '+4 this week', icon: 'description', tone: 'primary' },
            { label: 'Avg. Generation Time', value: '3.8s', sub: 'Fast Engine v2', icon: 'speed', tone: 'tertiary' },
            { label: 'Exported Documents', value: '42', sub: 'PDF & Markdown', icon: 'output', tone: 'secondary' },
            { label: 'Active Token Usage', value: '184k', sub: '92% budget left', icon: 'token', tone: 'tertiary' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="relative overflow-hidden rounded-xl bg-surface-glass/85 border border-white/5 p-space-md flex flex-col justify-between shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    {kpi.label}
                  </span>
                  <span className="font-headline text-headline-lg text-on-surface mt-space-xs font-bold">
                    {kpi.value}
                  </span>
                </div>
                <span className="p-space-xs rounded-lg bg-surface-container-highest text-tertiary material-symbols-outlined text-[22px]">
                  {kpi.icon}
                </span>
              </div>
              <div className="flex items-center justify-between mt-space-md pt-space-xs border-t border-white/5">
                <span className="font-label-sm text-label-sm text-tertiary">{kpi.sub}</span>
                <span className="font-mono text-[11px] text-outline">LIVE</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pb-space-xs border-b border-white/5">
          <div className="flex items-center gap-space-xs bg-surface-container-lowest p-1 rounded-xl border border-white/5">
            {['all', 'ready', 'in-review', 'draft'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-space-md py-1 rounded-lg font-label-sm text-label-sm capitalize transition-all ${
                  filter === tab
                    ? 'bg-surface-elevated text-on-surface shadow-sm border border-white/10'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search specifications, stacks..."
              className="w-full bg-surface-container-lowest pl-9 pr-3 py-2 rounded-xl border border-white/5 font-body text-body-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-tertiary/50"
            />
          </div>
        </div>

        {/* Document Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
          {docs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => navigate(doc.rawId ? `/prd/${doc.rawId}` : '/prd/new')}
              className="group relative rounded-xl bg-surface-glass/85 border border-white/5 p-space-md hover:bg-surface-elevated/90 transition-all duration-300 flex flex-col justify-between shadow-lg cursor-pointer hover:border-tertiary/30"
            >
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-outline">{doc.id}</span>
                  <div className="flex items-center gap-space-xs">
                    {doc.gitSync && (
                      <span className="material-symbols-outlined text-outline text-[16px]" title="Synced to Git">
                        sync
                      </span>
                    )}
                    <span
                      className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full border ${
                        TONE_STYLES[doc.statusTone]
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                </div>

                <h3 className="font-headline text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">
                  {doc.title}
                </h3>
                <p className="font-body text-body-sm text-on-surface-variant line-clamp-2">
                  {doc.desc}
                </p>
              </div>

              <div className="pt-space-md mt-space-sm border-t border-white/5 flex items-center justify-between text-outline font-label-sm text-label-sm">
                <span className="font-mono text-[11px] text-on-surface-variant">{doc.framework}</span>
                <div className="flex items-center gap-1 group-hover:text-tertiary transition-colors">
                  <span>{doc.timeAgo}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
