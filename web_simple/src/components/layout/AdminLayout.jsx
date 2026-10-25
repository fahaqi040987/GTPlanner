/**
 * AdminLayout - Sidebar + topbar layout untuk Admin Portal
 * Sesuai prototype admin_portal_* (fixed sidebar w-64, topbar h-16)
 */
import React from 'react';
import { NavLink } from 'react-router-dom';

export function AdminLayout({ title, subtitle, actions, children }) {
  const navItems = [
    { to: '/admin', icon: 'dashboard', label: 'Overview', end: true },
    { to: '/admin/llm', icon: 'tune', label: 'LLM Configuration' },
    { to: '/admin/analytics', icon: 'monitoring', label: 'Analytics' },
    { to: '/admin/dlq', icon: 'report', label: 'DLQ Console' },
    { to: '/admin/users', icon: 'group', label: 'Users & Roles' },
  ];

  return (
    <div className="bg-canvas-base text-on-surface min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-glass/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.35)] flex items-center justify-between px-space-md">
        <div className="flex items-center gap-space-sm">
          <span className="relative p-space-xs rounded-lg bg-primary/15 text-primary">
            <span className="material-symbols-outlined text-[22px]">graphic_eq</span>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-tertiary"></span>
          </span>
          <div className="flex flex-col">
            <span className="font-headline text-headline-sm text-on-surface font-semibold leading-none">
              GTPlanner Admin
            </span>
            <span className="font-label-sm text-label-sm text-outline">Platform Governance</span>
          </div>
        </div>

        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container text-tertiary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
            </span>
            <span className="font-label-sm text-label-sm">All Systems Operational</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-label-md text-label-md font-semibold">
              A
            </span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-glass/90 backdrop-blur-2xl z-40 flex flex-col justify-between py-space-md px-space-sm shadow-[1px_0_12px_rgba(0,0,0,0.35)]">
        <nav className="flex flex-col gap-space-xs">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-space-md px-space-md py-space-sm rounded-lg transition-all font-body-sm text-body-sm ${
                  isActive
                    ? 'bg-surface-elevated text-on-surface font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col gap-space-xs">
          <NavLink
            to="/settings"
            className="flex items-center gap-space-md px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-body-sm text-body-sm"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            Settings
          </NavLink>
          <div className="p-space-sm rounded-lg bg-surface-container-lowest border border-subtle">
            <div className="flex items-center justify-between font-label-sm text-label-sm text-outline">
              <span>Version</span>
              <span className="font-mono text-tertiary">v2.4.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-space-lg flex flex-col gap-space-lg">
          {/* Page header */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <h1 className="font-headline text-headline-md text-on-surface font-semibold tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="font-body text-body-sm text-on-surface-variant">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-space-sm">{actions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
