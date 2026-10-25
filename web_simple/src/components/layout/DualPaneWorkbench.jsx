/**
 * DualPaneWorkbench - Reusable layout untuk PRD Studio visualizers
 * Left pane: Scrollable PRD content dengan TOC navigation
 * Right pane: Interactive visualization (React Flow / Mermaid)
 */
import React, { useState } from 'react';

export function DualPaneWorkbench({
  title,
  version = 'v1.0.0-draft',
  workspace = 'Project-Alpha',
  generatedTime = '4.2s',
  generatedModel = 'GPT-4o',
  sections = [],
  activeSection = null,
  onSectionChange = () => {},
  rightPane,
  onExport = () => {},
  onDownload = () => {},
  onRegenerate = () => {},
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-canvas-base text-on-surface overflow-hidden">
      {/* Top Header Bar */}
      <div className="w-full bg-surface-container-low/90 backdrop-blur-xl rounded-xl m-space-md p-space-md shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-space-md relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-tertiary/10 rounded-full blur-2xl pointer-events-none"></div>
        
        {/* Left section: Title & metadata */}
        <div className="flex flex-wrap items-center gap-space-md z-10">
          <div className="flex items-center gap-space-sm">
            <span className="p-space-xs rounded-lg bg-surface-container text-tertiary">
              <span className="material-symbols-outlined text-[24px]">description</span>
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm">
                <h1 className="font-headline text-headline-md text-on-surface font-semibold tracking-tight">
                  {title}
                </h1>
                <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded-full bg-surface-container-high text-secondary font-medium">
                  {version}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline">
                Workspace: {workspace}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-lowest text-tertiary shadow-inner">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-label-sm text-label-sm">Generated in {generatedTime} ({generatedModel})</span>
          </div>
        </div>

        {/* Right section: Action buttons */}
        <div className="flex items-center flex-wrap gap-space-xs z-10">
          <button
            onClick={onExport}
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>Export PDF</span>
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">markdown</span>
            <span>Download Markdown</span>
          </button>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary-container text-on-primary-container hover:brightness-110 font-body-sm text-body-sm font-semibold transition-all shadow-md shadow-primary/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Dual-Pane Workbench */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg w-full items-start px-space-md pb-space-xl">
        {/* LEFT PANE: PRD Specification */}
        <div className="xl:col-span-5 flex flex-col gap-space-md bg-surface-container-lowest/80 backdrop-blur-xl rounded-xl p-space-md shadow-2xl overflow-hidden max-h-[calc(100vh-200px)]">
          {/* Top mini-toolbar */}
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-highest">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[18px]">menu_book</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Structured Specification
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded bg-surface-container text-outline">
                Synced to Git
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-all"
                title="Toggle Edit Mode"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isEditing ? 'close' : 'edit'}
                </span>
              </button>
            </div>
          </div>

          {/* TOC Navigation Pills */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs scrollbar-none py-1">
            {sections.map((section, idx) => (
              <button
                key={section.key}
                onClick={() => onSectionChange(section.key)}
                className={`whitespace-nowrap px-space-sm py-1 rounded-full font-label-sm text-label-sm transition-all ${
                  activeSection === section.key
                    ? 'bg-surface-elevated text-primary'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {idx + 1}. {section.label}
              </button>
            ))}
          </div>

          {/* Document Content Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-space-xs selection:bg-primary-container selection:text-on-primary-container text-on-surface">
            <div className="space-y-space-md">
              <section className="flex flex-col gap-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-tertiary"># 01</span>
                  <h2 className="font-headline text-headline-sm text-on-surface font-semibold">
                    Executive Summary
                  </h2>
                </div>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                  Vibe Code Planner bridges the gap between chaotic multi-model engineering prompts and high-fidelity production architectures. It autonomously extracts user stories, defines schemas, and renders real-time Mermaid diagrams within an ergonomic dual-screen IDE workbench.
                </p>
              </section>

              <section className="flex flex-col gap-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-tertiary"># 02</span>
                  <h2 className="font-headline text-headline-sm text-on-surface font-semibold">
                    Target Audience
                  </h2>
                </div>
                <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                  Staff Engineers & System Architects require deterministic microservice topology layouts, latency budgets, and exportable Mermaid syntaxes for RFC docs.
                </p>
              </section>

              {/* Additional sections can be rendered here based on activeSection */}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Interactive Visualization */}
        <div className="xl:col-span-7 flex flex-col gap-space-md bg-surface-container-lowest/80 backdrop-blur-xl rounded-xl p-space-md shadow-2xl overflow-hidden max-h-[calc(100vh-200px)]">
          {/* Visualization header */}
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-highest">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-tertiary text-[18px]">architecture</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Interactive Visualization
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded bg-surface-container-highest text-tertiary">
                Live Preview
              </span>
            </div>
          </div>

          {/* Visualization content */}
          <div className="flex-1 overflow-hidden rounded-lg bg-surface-container border border-surface-container-highest">
            {rightPane}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DualPaneWorkbench;
