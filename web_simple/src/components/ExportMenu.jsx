/**
 * Export Menu Component
 * Specialized dropdown for PRD export format selection
 * Accepts optional onExport callback for parent feedback (e.g. toast notifications)
 */
import React, { useState, useRef, useEffect } from 'react';
import { downloadHelpers } from '../services/api';

function ExportMenu({ prd, trigger = 'button', onExport }) {
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

  const handleDownload = async (format) => {
    if (!prd) return;

    try {
      const filename = downloadHelpers.exportPRD(prd, format);

      // Notify parent so it can show a toast / status message
      if (onExport) {
        onExport(prd, format);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsOpen(false);
    }
  };

  const formatOptions = [
    {
      format: 'md',
      label: 'Download as Markdown',
      icon: '📄',
      description: 'Formatted .md file',
    },
    {
      format: 'json',
      label: 'Download as JSON',
      icon: '📊',
      description: 'Structured data for agents',
    }
  ];

  const MenuContent = () => (
    <div className="export-menu-content">
      <div className="export-menu-header">
        <span className="export-title">Export PRD</span>
        <span className="export-subtitle">Choose format</span>
      </div>

      {formatOptions.map((option) => (
        <button
          key={option.format}
          className="export-format-option"
          onClick={() => handleDownload(option.format)}
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
          <MenuContent />
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
