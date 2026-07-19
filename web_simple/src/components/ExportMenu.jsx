/**
 * Export Menu Component
 * Specialized dropdown for PRD export format selection
 */
import React, { useState, useRef, useEffect } from 'react';

function ExportMenu({ prd, trigger = 'button' }) {
  const [isOpen, setIsOpen] = useState(false);
  const exportMenuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExport = async (format, onExport) => {
    if (onExport) {
      await onExport(prd, format);
    }
    setIsOpen(false);
  };

  const formatOptions = [
    {
      format: 'md',
      label: 'Download as Markdown',
      icon: '📄',
      description: 'Formatted .md file',
      mimeType: 'text/markdown'
    },
    {
      format: 'json',
      label: 'Download as JSON',
      icon: '📊',
      description: 'Structured data for agents',
      mimeType: 'application/json'
    }
  ];

  const ExportContent = ({ onExport }) => (
    <div className="export-menu-content">
      <div className="export-menu-header">
        <span className="export-title">Export PRD</span>
        <span className="export-subtitle">Choose format</span>
      </div>

      {formatOptions.map((option) => (
        <button
          key={option.format}
          className="export-format-option"
          onClick={() => handleExport(option.format, onExport)}
        >
          <div className="option-icon">{option.icon}</div>
          <div className="option-details">
            <div className="option-label">{option.label}</div>
            <div className="option-description">{option.description}</div>
          </div>
        </button>
      ))}
    </div>
  );

  if (trigger === 'button') {
    return (
      <div className="export-menu" ref={exportMenuRef}>
        <button
          className="export-trigger-btn"
          onClick={() => setIsOpen(!isOpen)}
          disabled={!prd}
        >
          Export ▼
        </button>

        {isOpen && (
          <div className="export-dropdown">
            <ExportContent onExport={handleExport} />
          </div>
        )}
      </div>
    );
  }

  // For custom triggers (like menu integration)
  return (
    <div className="export-menu" ref={exportMenuRef}>
      {isOpen ? (
        <div className="export-dropdown">
          <ExportContent onExport={handleExport} />
        </div>
      ) : (
        <>{props.children}</>
      )}
    </div>
  );
}

export default ExportMenu;
