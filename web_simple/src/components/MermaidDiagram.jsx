/**
 * MermaidDiagram component (PRD v2.3.0)
 *
 * Renders a ```mermaid code block from a PRD document as an SVG diagram.
 * Loaded lazily (code-split) so mermaid's bundle only downloads when a
 * document actually contains diagrams.
 *
 * PRD risk mitigation: if the diagram fails to render (LLM produced
 * invalid syntax), show a warning banner above the raw source so the
 * user can fix it in edit mode.
 */
import React, { useEffect, useState } from 'react';

// Singleton lazy loader — mermaid is initialized once per page load
let mermaidPromise = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'default',
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

let renderCounter = 0;

const MermaidDiagram = ({ code }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setSvg('');

    const id = `mermaid-${++renderCounter}`;
    loadMermaid()
      .then((mermaid) => mermaid.render(id, code))
      .then(({ svg: rendered }) => {
        if (!cancelled) setSvg(rendered);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to render diagram');
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="my-md">
        <div className="flex items-center gap-xs p-sm rounded-lg border
                        border-error-container/40 bg-error-container/20
                        text-on-error-container text-label-caps font-label-caps">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            warning
          </span>
          Diagram failed to render — fix the mermaid source in edit mode.
        </div>
        <pre className="mt-sm p-md bg-surface-container-low rounded-lg
                        overflow-x-auto text-code-md font-code-md text-outline">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-md flex items-center justify-center py-lg
                      bg-surface-container-low rounded-lg
                      text-label-caps font-label-caps text-outline">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      className="my-md flex justify-center overflow-x-auto"
      role="img"
      aria-label="PRD diagram"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;
