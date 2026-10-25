/**
 * PRD Detail page component - DualPane Workbench (PRD v1.0.0 vibe-code spec)
 * Matches prototype prd_studio_architecture_visualizer
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { documentAPI } from '../services/api';
import DualPaneWorkbench from '../components/layout/DualPaneWorkbench';
import { ArchitectureVisualizer, ERDVisualizer, SequenceFlowVisualizer } from '../components/visualizers';

const SECTIONS = [
  { key: 'summary', label: 'Summary' },
  { key: 'audience', label: 'Target Audience' },
  { key: 'stories', label: 'User Stories' },
  { key: 'stack', label: 'Tech Stack' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'architecture', label: 'System Architecture (Visual)' },
  { key: 'database', label: 'Database Schema (Visual)' },
  { key: 'sequence', label: 'API Sequence (Visual)' },
];

function PRDDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('summary');

  const { data: prd, isLoading, error } = useQuery({
    queryKey: ['prd', id],
    queryFn: async () => {
      if (id.startsWith('PRD-')) {
        return { data: { id, title: 'Vibe Code Planner Core Engine', content: 'Mock content for ' + id } };
      }
      const response = await documentAPI.get(id);
      return response;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-canvas-base">
        <div className="flex flex-col items-center gap-space-md">
          <span className="material-symbols-outlined text-[32px] text-tertiary animate-spin">progress_activity</span>
          <p className="font-label-md text-on-surface-variant">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !prd?.data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-canvas-base">
        <div className="text-center p-space-xl bg-surface-glass rounded-xl border border-white/5">
          <p className="text-error mb-space-md font-body-lg">Failed to load PRD</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-elevated text-on-surface transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const prdData = prd.data;

  // Determine what to show in the right pane based on active section
  let rightPaneContent = null;
  
  if (activeSection === 'architecture') {
    rightPaneContent = <ArchitectureVisualizer />;
  } else if (activeSection === 'database') {
    rightPaneContent = <ERDVisualizer />;
  } else if (activeSection === 'sequence') {
    rightPaneContent = (
      <div className="h-full flex flex-col">
        <div className="flex gap-2 p-2 overflow-x-auto bg-surface-container-lowest border-b border-surface-container-highest">
          <span className="font-label-sm text-outline px-2 py-1">Scenarios:</span>
          {['happy_path', 'ai_fallback', 'rate_limit_429', 'db_pool_exhaustion', 'redis_failover'].map(s => (
            <button key={s} className="px-2 py-1 text-[10px] rounded bg-surface-container text-on-surface hover:bg-surface-elevated whitespace-nowrap">
              {s.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>
        <SequenceFlowVisualizer scenario="ai_fallback" />
      </div>
    );
  } else {
    rightPaneContent = (
      <div className="p-space-md h-full overflow-y-auto">
        <div className="flex items-center gap-space-xs mb-space-md text-tertiary">
          <span className="material-symbols-outlined">info</span>
          <span className="font-label-sm text-label-sm">Select a Visual section to see interactive diagrams.</span>
        </div>
        <pre className="font-mono text-[12px] text-on-surface-variant p-4 bg-surface-container rounded-lg border border-white/5 whitespace-pre-wrap">
          {prdData.content || '# ' + prdData.title + '\n\nContent for ' + activeSection}
        </pre>
      </div>
    );
  }

  return (
    <DualPaneWorkbench
      title={prdData.title || 'PRD Document'}
      version="v1.0.0"
      workspace="Project-Alpha"
      generatedTime="4.2s"
      generatedModel="GPT-4o"
      sections={SECTIONS}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      rightPane={rightPaneContent}
      onExport={() => alert('Exporting to PDF... (Simulation)')}
      onDownload={() => alert('Downloading Markdown... (Simulation)')}
      onRegenerate={() => alert('Regenerating section... (Simulation)')}
    />
  );
}

export default PRDDetailPage;
