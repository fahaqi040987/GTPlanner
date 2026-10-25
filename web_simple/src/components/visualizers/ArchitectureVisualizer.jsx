/**
 * ArchitectureVisualizer - Interactive system architecture diagram
 * Uses React Flow untuk node-based visualization dengan Vibe Code Matrix tokens
 */
import React, { useCallback, useState } from 'react';

export function ArchitectureVisualizer({ architecture = null }) {
  const [nodes, setNodes] = useState([
    {
      id: 'client',
      label: 'Client\n(Next.js)',
      color: 'primary',
      position: { x: 0, y: 0 },
      type: 'frontend',
    },
    {
      id: 'api-gateway',
      label: 'API Gateway\n(Cloudflare)',
      color: 'tertiary',
      position: { x: 200, y: 0 },
      type: 'network',
    },
    {
      id: 'web-server',
      label: 'Web Server\n(Next.js)',
      color: 'primary',
      position: { x: 400, y: -100 },
      type: 'backend',
    },
    {
      id: 'llm-service',
      label: 'LLM Service\n(FastAPI)',
      color: 'secondary',
      position: { x: 400, y: 100 },
      type: 'backend',
    },
    {
      id: 'event-mesh',
      label: 'Event Mesh\n(Kafka)',
      color: 'tertiary',
      position: { x: 600, y: 0 },
      type: 'infra',
    },
    {
      id: 'database',
      label: 'Database\n(PostgreSQL)',
      color: 'primary',
      position: { x: 800, y: -100 },
      type: 'storage',
    },
    {
      id: 'cache',
      label: 'Cache\n(Redis)',
      color: 'secondary',
      position: { x: 800, y: 0 },
      type: 'storage',
    },
    {
      id: 'dlq',
      label: 'Dead-Letter\nQueue',
      color: 'tertiary',
      position: { x: 800, y: 100 },
      type: 'infra',
    },
  ]);

  const [selectedNode, setSelectedNode] = useState(null);
  const [connections] = useState([
    { from: 'client', to: 'api-gateway', label: 'HTTPS' },
    { from: 'api-gateway', to: 'web-server', label: 'HTTP' },
    { from: 'api-gateway', to: 'llm-service', label: 'HTTP' },
    { from: 'web-server', to: 'event-mesh', label: 'Publish' },
    { from: 'llm-service', to: 'event-mesh', label: 'Publish' },
    { from: 'event-mesh', to: 'database', label: 'Subscribe' },
    { from: 'event-mesh', to: 'cache', label: 'Subscribe' },
    { from: 'event-mesh', to: 'dlq', label: 'Dead Event' },
  ]);

  const colorMap = {
    primary: 'bg-primary text-on-primary',
    secondary: 'bg-secondary text-on-secondary',
    tertiary: 'bg-tertiary text-on-tertiary',
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface-container">
      {/* Canvas area */}
      <svg className="w-full h-full" style={{ minHeight: '600px' }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="rgba(139, 92, 246, 0.6)" />
          </marker>
        </defs>

        {/* Connection lines */}
        {connections.map((conn, idx) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;

          const x1 = fromNode.position.x + 80;
          const y1 = fromNode.position.y + 40;
          const x2 = toNode.position.x;
          const y2 = toNode.position.y + 40;

          return (
            <g key={idx}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(139, 92, 246, 0.3)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 8}
                fill="#8B5CF6"
                fontSize="11"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                {conn.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <g
            key={node.id}
            className="cursor-pointer"
            onClick={() => setSelectedNode(node.id)}
          >
            {/* Node box */}
            <rect
              x={node.position.x}
              y={node.position.y}
              width="160"
              height="80"
              rx="8"
              fill={selectedNode === node.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(31, 41, 55, 0.8)'}
              stroke={selectedNode === node.id ? '#6366F1' : 'rgba(139, 92, 246, 0.4)'}
              strokeWidth={selectedNode === node.id ? '2' : '1'}
            />

            {/* Top accent bar */}
            <rect
              x={node.position.x}
              y={node.position.y}
              width="160"
              height="4"
              rx="8"
              fill={node.color === 'primary' ? '#6366F1' : node.color === 'secondary' ? '#8B5CF6' : '#06B6D4'}
            />

            {/* Label */}
            <text
              x={node.position.x + 80}
              y={node.position.y + 45}
              fill="#E2E8F0"
              fontSize="12"
              fontFamily="Plus Jakarta Sans"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Node details panel */}
      {selectedNode && (
        <div className="border-t border-surface-container-highest p-space-md bg-surface-container-lowest">
          <div className="flex items-start justify-between mb-space-sm">
            <h3 className="font-headline text-headline-sm text-on-surface">
              {nodes.find(n => n.id === selectedNode)?.label.split('\n')[0]}
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="space-y-2 font-body text-body-sm text-on-surface-variant">
            <p><strong>Type:</strong> {nodes.find(n => n.id === selectedNode)?.type}</p>
            <p><strong>Node ID:</strong> <code className="font-mono text-code-token-accent">{selectedNode}</code></p>
            <p><strong>Connections:</strong> {connections.filter(c => c.from === selectedNode || c.to === selectedNode).length}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArchitectureVisualizer;
