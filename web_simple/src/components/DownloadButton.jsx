/**
 * Download Button Component
 * Handles format selection and download triggering for PRD export
 */
import React, { useState } from 'react';

function DownloadButton({ prd, formats = ['md', 'json'], onDownload }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const handleDownloadClick = async (format) => {
    if (isDownloading) return;

    setIsDownloading(true);
    setShowFormatMenu(false);

    try {
      if (onDownload) {
        await onDownload(prd, format);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const getFormatLabel = (format) => {
    return format === 'md' ? 'Markdown (.md)' : 'JSON (.json)';
  };

  const getFormatIcon = (format) => {
    return format === 'md' ? '📄' : '📊';
  };

  if (formats.length === 1) {
    // Single format - direct download button
    return (
      <button
        className="download-btn"
        onClick={() => handleDownloadClick(formats[0])}
        disabled={isDownloading || !prd}
        title={`Download as ${getFormatLabel(formats[0])}`}
      >
        {isDownloading ? (
          <>
            <span className="spinner-small"></span>
            Downloading...
          </>
        ) : (
          <>
            <span className="download-icon">⬇️</span>
            Download
          </>
        )}
      </button>
    );
  }

  // Multiple formats - show menu
  return (
    <div className="download-button-container">
      <button
        className="download-btn"
        onClick={() => setShowFormatMenu(!showFormatMenu)}
        disabled={!prd}
      >
        <span className="download-icon">⬇️</span>
        Export
      </button>

      {showFormatMenu && (
        <div className="download-format-menu">
          {formats.map((format) => (
            <button
              key={format}
              className="format-option"
              onClick={() => handleDownloadClick(format)}
              disabled={isDownloading}
            >
              <span className="format-icon">{getFormatIcon(format)}</span>
              <span className="format-label">{getFormatLabel(format)}</span>
              {isDownloading && <span className="format-spinner">...</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DownloadButton;