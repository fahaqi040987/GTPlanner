/**
 * ERDVisualizer - Entity Relationship Diagram visualizer
 * Menampilkan database schema dengan tabel, kolom, tipe data, dan relationships
 */
import React, { useState } from 'react';

export function ERDVisualizer({ schema = null }) {
  const [selectedTable, setSelectedTable] = useState('prd_projects');
  const [showForeignKeys, setShowForeignKeys] = useState(true);

  // Sample schema matching PRD v1.0.0
  const tables = {
    team_workspaces: {
      name: 'team_workspaces',
      columns: [
        { name: 'id', type: 'UUID', pk: true, nn: true },
        { name: 'name', type: 'VARCHAR(255)', nn: true },
        { name: 'slug', type: 'VARCHAR(128)', nn: true, unique: true },
        { name: 'plan_tier', type: 'VARCHAR(32)', default: "'enterprise'" },
        { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
      ],
      color: '#6366F1',
      position: { x: 50, y: 50 },
    },
    users: {
      name: 'users',
      columns: [
        { name: 'id', type: 'INT', pk: true, nn: true },
        { name: 'workspace_id', type: 'UUID', fk: 'team_workspaces.id' },
        { name: 'email', type: 'VARCHAR(255)', nn: true, unique: true },
        { name: 'full_name', type: 'VARCHAR(255)', nn: true },
        { name: 'role', type: 'VARCHAR(32)', default: "'pm'" },
        { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
      ],
      color: '#8B5CF6',
      position: { x: 350, y: 50 },
    },
    prd_projects: {
      name: 'prd_projects',
      columns: [
        { name: 'id', type: 'UUID', pk: true, nn: true },
        { name: 'workspace_id', type: 'UUID', nn: true, fk: 'team_workspaces.id' },
        { name: 'created_by', type: 'INT', nn: true, fk: 'users.id' },
        { name: 'title', type: 'VARCHAR(255)', nn: true },
        { name: 'status', type: 'ENUM', default: "'draft'" },
        { name: 'llm_model_used', type: 'VARCHAR(64)' },
        { name: 'total_token_usage', type: 'INT', default: '0' },
        { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
      ],
      color: '#06B6D4',
      position: { x: 50, y: 300 },
    },
    prd_sections: {
      name: 'prd_sections',
      columns: [
        { name: 'id', type: 'UUID', pk: true, nn: true },
        { name: 'project_id', type: 'UUID', nn: true, fk: 'prd_projects.id' },
        { name: 'section_type', type: 'ENUM', nn: true },
        { name: 'title', type: 'VARCHAR(255)', nn: true },
        { name: 'order_index', type: 'INT', default: '0' },
        { name: 'content_markdown', type: 'TEXT', default: "''" },
        { name: 'version', type: 'INT', default: '1' },
        { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
      ],
      color: '#10B981',
      position: { x: 350, y: 300 },
    },
    vector_spec_embeddings: {
      name: 'vector_spec_embeddings',
      columns: [
        { name: 'id', type: 'UUID', pk: true, nn: true },
        { name: 'project_id', type: 'UUID', nn: true, fk: 'prd_projects.id' },
        { name: 'document_id', type: 'UUID', nn: true, fk: 'prd_sections.id' },
        { name: 'section_key', type: 'VARCHAR(64)', nn: true },
        { name: 'content_chunk', type: 'TEXT', nn: true },
        { name: 'embedding', type: 'VECTOR(1536)', nn: true },
        { name: 'token_count', type: 'INT' },
        { name: 'created_at', type: 'TIMESTAMPTZ', default: 'NOW()' },
      ],
      color: '#F59E0B',
      position: { x: 650, y: 300 },
    },
  };

  const relationships = [
    { from: 'team_workspaces', to: 'users', label: '1:N' },
    { from: 'team_workspaces', to: 'prd_projects', label: '1:N' },
    { from: 'users', to: 'prd_projects', label: '1:N' },
    { from: 'prd_projects', to: 'prd_sections', label: '1:N' },
    { from: 'prd_projects', to: 'vector_spec_embeddings', label: '1:N' },
    { from: 'prd_sections', to: 'vector_spec_embeddings', label: '1:N' },
  ];

  const getTableColor = (tableName) => tables[tableName]?.color || '#6B7280';

  const renderTable = (tableKey) => {
    const table = tables[tableKey];
    if (!table) return null;

    const isSelected = selectedTable === tableKey;
    const width = 220;
    const headerHeight = 40;
    const rowHeight = 24;

    return (
      <g key={tableKey} className="cursor-pointer" onClick={() => setSelectedTable(tableKey)}>
        {/* Table box */}
        <rect
          x={table.position.x}
          y={table.position.y}
          width={width}
          height={headerHeight + table.columns.length * rowHeight}
          rx="6"
          fill="rgba(31, 41, 55, 0.9)"
          stroke={isSelected ? table.color : 'rgba(139, 92, 246, 0.3)'}
          strokeWidth={isSelected ? '2' : '1'}
        />

        {/* Table header */}
        <rect
          x={table.position.x}
          y={table.position.y}
          width={width}
          height={headerHeight}
          rx="6"
          fill={table.color}
          fillOpacity="0.2"
          stroke={table.color}
          strokeWidth="1"
        />

        {/* Table name */}
        <text
          x={table.position.x + width / 2}
          y={table.position.y + 12}
          fill={table.color}
          fontSize="12"
          fontFamily="JetBrains Mono"
          fontWeight="600"
          textAnchor="middle"
        >
          {table.name}
        </text>

        {/* Column count */}
        <text
          x={table.position.x + width / 2}
          y={table.position.y + 28}
          fill="#8B8C99"
          fontSize="10"
          fontFamily="Inter"
          textAnchor="middle"
        >
          {table.columns.length} columns
        </text>

        {/* Columns */}
        {table.columns.map((col, idx) => (
          <g key={col.name}>
            {/* Column row background */}
            <rect
              x={table.position.x}
              y={table.position.y + headerHeight + idx * rowHeight}
              width={width}
              height={rowHeight}
              fill={idx % 2 === 0 ? 'rgba(99, 102, 241, 0.05)' : 'transparent'}
            />

            {/* Column icon (PK/FK) */}
            <text
              x={table.position.x + 6}
              y={table.position.y + headerHeight + idx * rowHeight + 14}
              fill={col.pk ? '#06B6D4' : col.fk ? '#F59E0B' : '#8B8C99'}
              fontSize="9"
              fontFamily="JetBrains Mono"
              fontWeight="700"
            >
              {col.pk ? '🔑' : col.fk ? '🔗' : col.unique ? '✓' : '-'}
            </text>

            {/* Column name */}
            <text
              x={table.position.x + 22}
              y={table.position.y + headerHeight + idx * rowHeight + 14}
              fill="#E2E8F0"
              fontSize="10"
              fontFamily="JetBrains Mono"
              fontWeight="500"
            >
              {col.name}
            </text>

            {/* Type (truncated) */}
            <text
              x={table.position.x + width - 6}
              y={table.position.y + headerHeight + idx * rowHeight + 14}
              fill="#8B8C99"
              fontSize="9"
              fontFamily="JetBrains Mono"
              textAnchor="end"
            >
              {col.type.length > 12 ? col.type.substring(0, 12) + '…' : col.type}
            </text>
          </g>
        ))}
      </g>
    );
  };

  const renderRelationship = (rel, idx) => {
    const fromTable = tables[rel.from];
    const toTable = tables[rel.to];
    if (!fromTable || !toTable) return null;

    const fromX = fromTable.position.x + 220;
    const fromY = fromTable.position.y + 20;
    const toX = toTable.position.x;
    const toY = toTable.position.y + 20;

    if (!showForeignKeys) return null;

    return (
      <g key={idx}>
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke="rgba(139, 92, 246, 0.2)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <text
          x={(fromX + toX) / 2}
          y={(fromY + toY) / 2 - 6}
          fill="#8B5CF6"
          fontSize="10"
          fontFamily="JetBrains Mono"
          textAnchor="middle"
        >
          {rel.label}
        </text>
      </g>
    );
  };

  const currentTable = tables[selectedTable];

  return (
    <div className="w-full h-full flex flex-col bg-surface-container">
      {/* Canvas */}
      <svg className="w-full flex-1" style={{ minHeight: '500px' }}>
        {/* Relationships */}
        {relationships.map((rel, idx) => renderRelationship(rel, idx))}

        {/* Tables */}
        {Object.keys(tables).map(key => renderTable(key))}
      </svg>

      {/* Details panel */}
      {currentTable && (
        <div className="border-t border-surface-container-highest p-space-md bg-surface-container-lowest max-h-[200px] overflow-y-auto">
          <div className="flex items-start justify-between mb-space-sm">
            <h3 className="font-headline text-headline-sm text-on-surface">
              {currentTable.name}
            </h3>
            <button
              onClick={() => setShowForeignKeys(!showForeignKeys)}
              className={`px-space-sm py-1 rounded text-label-sm font-label-sm transition-all ${
                showForeignKeys
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-surface-container text-on-surface-variant border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] inline mr-1">link</span>
              FK Relations
            </button>
          </div>

          <div className="grid grid-cols-2 gap-space-md">
            <div>
              <p className="font-label-sm text-label-sm text-outline mb-2 uppercase">Columns</p>
              <div className="space-y-1">
                {currentTable.columns.map(col => (
                  <div key={col.name} className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1">
                    <span className="w-3 text-center">
                      {col.pk ? '🔑' : col.fk ? '🔗' : '-'}
                    </span>
                    <span className="text-on-surface">{col.name}</span>
                    <span className="text-code-token-accent">{col.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-label-sm text-label-sm text-outline mb-2 uppercase">Indexes</p>
              <div className="font-mono text-[11px] text-on-surface-variant space-y-1">
                <div>✓ idx_{currentTable.name}_workspace_status</div>
                <div>✓ idx_{currentTable.name}_created_at</div>
                {currentTable.name === 'vector_spec_embeddings' && (
                  <>
                    <div>⚡ HNSW (embedding)</div>
                    <div>📊 cosine_ops</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ERDVisualizer;
