/**
 * SequenceFlowVisualizer - API sequence flow dengan scenario simulation
 * Menampilkan timeline interaksi antar services dengan failure scenarios
 */
import React, { useState, useEffect } from 'react';

export function SequenceFlowVisualizer({ scenario = 'happy_path' }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [results, setResults] = useState(null);

  // Scenario definitions
  const scenarios = {
    happy_path: {
      title: 'Happy Path: Normal Flow',
      description: 'Successful request completion within SLA',
      color: '#10B981',
      steps: [
        { actor: 'User', action: 'POST /prd/generate', target: 'API Gateway', latency: 10, status: 'success' },
        { actor: 'API Gateway', action: 'Forward Request', target: 'LLM Service', latency: 5, status: 'success' },
        { actor: 'LLM Service', action: 'Call Claude 3.5 Sonnet', target: 'LLM Provider', latency: 1500, status: 'success' },
        { actor: 'LLM Provider', action: 'Return Structured Response', target: 'LLM Service', latency: 100, status: 'success' },
        { actor: 'LLM Service', action: 'Persist to PostgreSQL', target: 'Database', latency: 50, status: 'success' },
        { actor: 'LLM Service', action: 'Publish Event', target: 'Event Mesh (Kafka)', latency: 20, status: 'success' },
        { actor: 'LLM Service', action: 'Return PRD', target: 'User', latency: 15, status: 'success' },
      ],
    },
    rate_limit_429: {
      title: 'Rate Limit 429: Quota Exceeded',
      description: 'Primary provider quota exceeded, automatic backoff triggered',
      color: '#F59E0B',
      steps: [
        { actor: 'User', action: 'POST /prd/generate', target: 'API Gateway', latency: 10, status: 'success' },
        { actor: 'API Gateway', action: 'Check Rate Limit', target: 'Cache', latency: 5, status: 'warning', message: 'TPM limit reached' },
        { actor: 'API Gateway', action: 'Queue Job (Backoff)', target: 'Queue', latency: 2000, status: 'warning', message: 'Exponential backoff' },
        { actor: 'Queue', action: 'Wait & Retry', target: 'Queue', latency: 3000, status: 'warning', message: 'Retry after 3s' },
        { actor: 'LLM Service', action: 'Attempt Request', target: 'LLM Provider', latency: 50, status: 'success' },
        { actor: 'LLM Provider', action: 'Return Response', target: 'User', latency: 100, status: 'success' },
      ],
    },
    ai_fallback: {
      title: 'AI Fallback: Provider Timeout',
      description: 'Primary provider timeout, circuit breaker opens, fallback to secondary',
      color: '#EF4444',
      steps: [
        { actor: 'User', action: 'POST /prd/generate', target: 'API Gateway', latency: 10, status: 'success' },
        { actor: 'API Gateway', action: 'Forward Request', target: 'LLM Service', latency: 5, status: 'success' },
        { actor: 'LLM Service', action: 'Call Claude (Primary)', target: 'LLM Provider', latency: 8000, status: 'error', message: 'Timeout > 8s' },
        { actor: 'Circuit Breaker', action: 'OPEN (3/3 failures)', target: 'Breaker', latency: 0, status: 'error', message: 'Threshold reached' },
        { actor: 'LLM Service', action: 'Fallback to GPT-4o', target: 'LLM Provider', latency: 50, status: 'warning', message: 'Secondary attempt' },
        { actor: 'LLM Provider', action: 'Return Response', target: 'LLM Service', latency: 1200, status: 'success' },
        { actor: 'LLM Service', action: 'Return PRD (Degraded)', target: 'User', latency: 15, status: 'success', message: 'Via fallback' },
      ],
    },
    db_pool_exhaustion: {
      title: 'DB Pool Exhaustion: 503',
      description: 'Connection pool maxed out, serving from cache or degraded mode',
      color: '#F59E0B',
      steps: [
        { actor: 'User', action: 'POST /prd/generate', target: 'API Gateway', latency: 10, status: 'success' },
        { actor: 'LLM Service', action: 'Attempt DB Write', target: 'Database', latency: 50, status: 'warning', message: 'Pool: 100/100' },
        { actor: 'Database', action: 'PoolExhausted', target: 'LLM Service', latency: 0, status: 'error', message: '503 Service Unavailable' },
        { actor: 'LLM Service', action: 'Fallback: Cache Write', target: 'Cache', latency: 10, status: 'warning', message: 'Deferred persistence' },
        { actor: 'User', action: 'Receives Response (Cached)', target: 'User', latency: 0, status: 'warning', message: 'Degraded mode' },
        { actor: 'Background Job', action: 'Retry DB Write', target: 'Database', latency: 5000, status: 'success', message: 'Eventually consistent' },
      ],
    },
    redis_failover: {
      title: 'Redis Failover: Sentinel Promotion',
      description: 'Redis master crash, sentinel promotes replica (< 3s recovery)',
      color: '#EC4899',
      steps: [
        { actor: 'LLM Service', action: 'Cache Read', target: 'Redis Master', latency: 2, status: 'success' },
        { actor: 'Redis Master', action: 'CRASH', target: 'Master', latency: 0, status: 'error', message: 'Node down' },
        { actor: 'Redis Sentinel', action: 'Detect Failure', target: 'Sentinel', latency: 1000, status: 'warning', message: 'Heartbeat timeout' },
        { actor: 'Redis Sentinel', action: 'Promote Replica', target: 'Replica', latency: 1500, status: 'warning', message: 'New master elected' },
        { actor: 'LLM Service', action: 'Reconnect (Mutex)', target: 'Redis Master (new)', latency: 50, status: 'success', message: 'Single flight pattern' },
        { actor: 'Redis Master', action: 'Cache Hit', target: 'LLM Service', latency: 3, status: 'success' },
      ],
    },
  };

  const activeScenario = scenarios[scenario] || scenarios.happy_path;

  const simulateFlow = async () => {
    setIsSimulating(true);
    setActiveStep(0);

    // Animate through steps
    for (let i = 0; i < activeScenario.steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setActiveStep(i + 1);
    }

    // Calculate total latency
    const totalLatency = activeScenario.steps.reduce((sum, step) => sum + step.latency, 0);
    setResults({
      totalLatency,
      steps: activeScenario.steps.length,
      successRate: activeScenario.steps.filter(s => s.status === 'success').length / activeScenario.steps.length,
      status: activeScenario.steps[activeScenario.steps.length - 1].status,
    });

    setIsSimulating(false);
  };

  const actors = ['User', 'API Gateway', 'LLM Service', 'LLM Provider', 'Database', 'Cache', 'Queue', 'Sentinel', 'Circuit Breaker', 'Event Mesh (Kafka)'];
  const actorX = {};
  const startX = 40;
  const actorSpacing = (typeof window !== 'undefined' ? window.innerWidth - 100 : 1000) / actors.length;

  actors.forEach((actor, idx) => {
    actorX[actor] = startX + idx * actorSpacing;
  });

  const svgHeight = 100 + activeScenario.steps.length * 80;

  return (
    <div className="w-full h-full flex flex-col bg-surface-container">
      {/* Header with scenario info */}
      <div className="p-space-md border-b border-surface-container-highest bg-surface-container-lowest">
        <div className="flex items-start justify-between mb-space-sm">
          <div>
            <h3 className="font-headline text-headline-sm text-on-surface mb-1">
              {activeScenario.title}
            </h3>
            <p className="font-body text-body-sm text-on-surface-variant">
              {activeScenario.description}
            </p>
          </div>
          <button
            onClick={simulateFlow}
            disabled={isSimulating}
            className="px-space-md py-space-sm bg-primary/20 hover:bg-primary/30 disabled:opacity-50 border border-primary/40 rounded-lg text-primary font-label-md text-label-md transition-all"
          >
            <span className="material-symbols-outlined text-[16px] inline mr-1">play_arrow</span>
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        {/* Results display */}
        {results && (
          <div className="grid grid-cols-4 gap-space-sm pt-space-sm border-t border-surface-container-highest">
            <div className="p-space-sm bg-surface-container rounded">
              <p className="font-label-sm text-label-sm text-outline uppercase mb-1">Total Latency</p>
              <p className="font-headline text-headline-sm text-tertiary">{results.totalLatency}ms</p>
            </div>
            <div className="p-space-sm bg-surface-container rounded">
              <p className="font-label-sm text-label-sm text-outline uppercase mb-1">Steps</p>
              <p className="font-headline text-headline-sm text-primary">{results.steps}</p>
            </div>
            <div className="p-space-sm bg-surface-container rounded">
              <p className="font-label-sm text-label-sm text-outline uppercase mb-1">Success Rate</p>
              <p className={`font-headline text-headline-sm ${results.successRate === 1 ? 'text-green-500' : 'text-yellow-500'}`}>
                {Math.round(results.successRate * 100)}%
              </p>
            </div>
            <div className="p-space-sm bg-surface-container rounded">
              <p className="font-label-sm text-label-sm text-outline uppercase mb-1">Status</p>
              <p className={`font-headline text-headline-sm capitalize ${
                results.status === 'success' ? 'text-green-500' :
                results.status === 'warning' ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {results.status}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sequence diagram */}
      <svg className="w-full flex-1" viewBox={`0 0 ${typeof window !== 'undefined' ? window.innerWidth - 40 : 1000} ${svgHeight}`} style={{ minHeight: '500px' }}>
        {/* Actor swimlanes */}
        {actors.map((actor, idx) => (
          <g key={actor}>
            {/* Header box */}
            <rect
              x={actorX[actor] - actorSpacing / 2 + 5}
              y="10"
              width={actorSpacing - 10}
              height="30"
              rx="4"
              fill="rgba(99, 102, 241, 0.1)"
              stroke="rgba(139, 92, 246, 0.3)"
              strokeWidth="1"
            />
            {/* Actor name */}
            <text
              x={actorX[actor]}
              y="30"
              fill="#E2E8F0"
              fontSize="11"
              fontFamily="JetBrains Mono"
              fontWeight="600"
              textAnchor="middle"
            >
              {actor}
            </text>
            {/* Lifeline */}
            <line
              x1={actorX[actor]}
              y1="40"
              x2={actorX[actor]}
              y2={svgHeight}
              stroke="rgba(139, 92, 246, 0.2)"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          </g>
        ))}

        {/* Steps */}
        {activeScenario.steps.map((step, idx) => {
          if (idx >= activeStep) return null;

          const fromX = actorX[step.actor];
          const toX = actorX[step.target];
          const y = 50 + (idx + 1) * 80;
          const statusColor = step.status === 'success' ? '#10B981' : step.status === 'warning' ? '#F59E0B' : '#EF4444';

          return (
            <g key={idx}>
              {/* Arrow */}
              <line
                x1={Math.min(fromX, toX)}
                y1={y}
                x2={Math.max(fromX, toX)}
                y2={y}
                stroke={statusColor}
                strokeWidth="2"
              />
              <polygon
                points={`${toX},${y} ${toX - 8},${y - 4} ${toX - 8},${y + 4}`}
                fill={statusColor}
              />

              {/* Action label */}
              <rect
                x={Math.min(fromX, toX)}
                y={y - 14}
                width={Math.max(fromX, toX) - Math.min(fromX, toX)}
                height="12"
                fill="rgba(31, 41, 55, 0.9)"
              />
              <text
                x={(fromX + toX) / 2}
                y={y - 6}
                fill={statusColor}
                fontSize="10"
                fontFamily="JetBrains Mono"
                fontWeight="500"
                textAnchor="middle"
              >
                {step.action}
              </text>

              {/* Latency annotation */}
              {step.latency > 0 && (
                <text
                  x={(fromX + toX) / 2}
                  y={y + 14}
                  fill="#8B8C99"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  +{step.latency}ms
                </text>
              )}

              {/* Status message */}
              {step.message && (
                <text
                  x={(fromX + toX) / 2}
                  y={y + 26}
                  fill="#8B5CF6"
                  fontSize="8"
                  fontFamily="JetBrains Mono"
                  fontStyle="italic"
                  textAnchor="middle"
                >
                  {step.message}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default SequenceFlowVisualizer;
