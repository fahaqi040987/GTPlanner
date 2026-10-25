/**
 * AdminDLQPage - Dead-Letter Queue alert & incident console
 * Sesuai prototype admin_portal_dead_letter_queue_dlq_alert_incident_console
 */
import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';

const MOCK_DLQ_EVENTS = [
  {
    id: 'dlq-evt-9f2a',
    topic: 'prd.generated.v1',
    partition: 3,
    offset: 128451,
    error_type: 'JSONParseError',
    message: 'LLM response failed schema validation (missing tech_stack)',
    attempts: 5,
    first_seen: '2026-10-25T09:14:22Z',
    last_seen: '2026-10-25T09:41:03Z',
    severity: 'critical',
    payload: {
      project_id: '7c1e...',
      section_key: 'tech_stack',
      provider: 'claude-3-5-sonnet',
      raw_length: 4021,
    },
  },
  {
    id: 'dlq-evt-3k7d',
    topic: 'embedding.upsert.v1',
    partition: 1,
    offset: 88214,
    error_type: 'VectorDimensionMismatch',
    message: 'Embedding dim 768 != expected 1536',
    attempts: 5,
    first_seen: '2026-10-25T08:02:11Z',
    last_seen: '2026-10-25T08:33:47Z',
    severity: 'warning',
    payload: {
      project_id: '4b9f...',
      section_key: 'executive_summary',
      model_used: 'text-embedding-3-small',
      actual_dim: 768,
    },
  },
  {
    id: 'dlq-evt-5m1x',
    topic: 'export.pdf.render',
    partition: 0,
    offset: 31099,
    error_type: 'RenderTimeout',
    message: 'Puppeteer page.render exceeded 30s budget',
    attempts: 3,
    first_seen: '2026-10-25T07:44:56Z',
    last_seen: '2026-10-25T07:58:20Z',
    severity: 'critical',
    payload: {
      document_id: 'a20c...',
      page_count: 48,
      dpi: 300,
    },
  },
];

const SEVERITY_STYLES = {
  critical: 'bg-error-container/20 text-error border-error/40',
  warning: 'bg-tertiary/10 text-tertiary border-tertiary/30',
  info: 'bg-primary/10 text-primary border-primary/30',
};

function AdminDLQPage() {
  const [events, setEvents] = useState(MOCK_DLQ_EVENTS);
  const [selected, setSelected] = useState(null);
  const [editingPayload, setEditingPayload] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = events.filter(
    (e) => filter === 'all' || e.severity === filter
  );

  const handleReplay = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelected(null);
  };

  return (
    <AdminLayout
      title="Dead-Letter Queue Console"
      subtitle="Inspect failed Kafka events, edit payloads, and replay to production consumers without redeploy."
      actions={
        <>
          <div className="flex items-center gap-space-xs bg-surface-container p-1 rounded-lg border border-subtle">
            {['all', 'critical', 'warning'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-space-md py-1 rounded-md font-label-sm text-label-sm capitalize transition-all ${
                  filter === f
                    ? 'bg-surface-elevated text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary-container hover:brightness-110 font-body-sm text-body-sm font-semibold transition-all shadow-md shadow-primary/20 active:scale-95">
            <span className="material-symbols-outlined text-[18px]">replay</span>
            Replay All Safe
          </button>
        </>
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
        {[
          { label: 'DLQ Depth', value: events.length, sub: 'messages', icon: 'inventory_2', tone: 'error' },
          { label: 'P95 Replay Latency', value: '412ms', sub: 'last 24h', icon: 'speed', tone: 'tertiary' },
          { label: 'Circuit Breakers', value: '0 open', sub: '2 half-open', icon: 'electric_bolt', tone: 'primary' },
          { label: 'Replay Success', value: '97.2%', sub: 'last 7d', icon: 'task_alt', tone: 'tertiary' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="relative rounded-xl bg-surface-glass/85 p-space-md shadow-lg overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-tertiary"></div>
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                {stat.label}
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                {stat.icon}
              </span>
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-headline text-headline-md text-on-surface font-semibold">
                {stat.value}
              </span>
              <span className="font-label-sm text-label-sm text-outline">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Event list */}
      <div className="flex flex-col gap-space-sm">
        {filtered.length === 0 && (
          <div className="p-space-lg rounded-xl bg-surface-container text-center">
            <span className="material-symbols-outlined text-[32px] text-tertiary mb-space-xs block">
              verified
            </span>
            <p className="font-body text-body-md text-on-surface-variant">
              No dead-letter events matching this filter. Queue is clean.
            </p>
          </div>
        )}

        {filtered.map((evt) => (
          <div
            key={evt.id}
            className="rounded-xl bg-surface-glass/85 p-space-md shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-sm min-w-0">
                <span
                  className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full border uppercase tracking-wide ${
                    SEVERITY_STYLES[evt.severity]
                  }`}
                >
                  {evt.severity}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-[12px] text-tertiary truncate">
                    {evt.topic} · p{evt.partition}@{evt.offset}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface truncate">
                    {evt.message}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-space-sm flex-wrap shrink-0">
                <span className="font-label-sm text-label-sm text-outline">
                  {evt.error_type}
                </span>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                  {evt.attempts} attempts
                </span>
                <button
                  onClick={() => {
                    setSelected(evt);
                    setEditingPayload(JSON.stringify(evt.payload, null, 2));
                  }}
                  className="px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-all active:scale-95 flex items-center gap-space-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  Inspect
                </button>
                <button
                  onClick={() => handleReplay(evt.id)}
                  className="px-space-md py-space-xs rounded-lg bg-tertiary/10 hover:bg-tertiary/20 text-tertiary border border-tertiary/30 font-body-sm text-body-sm transition-all active:scale-95 flex items-center gap-space-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">replay</span>
                  Replay
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inspector modal */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-space-lg bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-surface-glass border border-subtle shadow-2xl p-space-lg flex flex-col gap-space-md">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-headline text-headline-sm text-on-surface font-semibold">
                  Edit Payload & Replay
                </h3>
                <p className="font-label-sm text-label-sm text-outline font-mono mt-1">
                  {selected.id} · {selected.topic}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Error stack
              </span>
              <pre className="p-space-sm rounded-lg bg-surface-container-lowest border border-subtle font-mono text-[12px] text-error overflow-x-auto">
{`${selected.error_type}: ${selected.message}
  at KafkaConsumer.process (${selected.topic}#${selected.partition})
  attempts=${selected.attempts} first_seen=${selected.first_seen}`}
              </pre>
            </div>

            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Payload (editable JSON)
              </span>
              <textarea
                value={editingPayload}
                onChange={(e) => setEditingPayload(e.target.value)}
                rows={10}
                className="w-full p-space-sm rounded-lg bg-surface-container-lowest border border-subtle font-mono text-[12px] text-on-surface resize-y focus:outline-none focus:border-tertiary/50"
              />
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-sm border-t border-subtle">
              <button
                onClick={() => setSelected(null)}
                className="px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-body-sm text-body-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReplay(selected.id)}
                className="px-space-lg py-space-sm rounded-lg bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white font-body-sm text-body-sm font-semibold transition-all shadow-lg shadow-primary/25 active:scale-95 flex items-center gap-space-xs"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                Replay to Production
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDLQPage;
