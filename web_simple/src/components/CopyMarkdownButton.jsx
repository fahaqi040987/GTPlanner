/**
 * Copy Markdown Button Component
 * Copies formatted PRD content to clipboard with YAML frontmatter
 */
import React, { useState } from 'react';
import { formatPRDMarkdown } from '../services/markdownFormatter';

function CopyMarkdownButton({ prd, onCopy }) {
  const [copyState, setCopyState] = useState('idle'); // idle, copying, success, error

  const handleCopy = async () => {
    if (!prd) return;

    try {
      setCopyState('copying');

      // Format the PRD with YAML frontmatter
      const formattedMarkdown = formatPRDMarkdown(prd);

      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formattedMarkdown);
        setCopyState('success');

        // Call parent callback if provided
        if (onCopy) {
          onCopy('md');
        }

        // Reset after 2 seconds
        setTimeout(() => setCopyState('idle'), 2000);
        return;
      }

      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = formattedMarkdown;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopyState('success');
          if (onCopy) {
            onCopy('md');
          }
          setTimeout(() => setCopyState('idle'), 2000);
        } else {
          throw new Error('Copy command failed');
        }
      } catch (err) {
        document.body.removeChild(textArea);
        throw err;
      }
    } catch (error) {
      console.error('Failed to copy markdown:', error);
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  // Keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + Shift + C
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        handleCopy();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [prd]);

  const getButtonContent = () => {
    switch (copyState) {
      case 'copying':
        return (
          <>
            <span className="spinner-small"></span>
            Copying...
          </>
        );
      case 'success':
        return (
          <>
            <span className="success-icon">✓</span>
            Copied!
          </>
        );
      case 'error':
        return (
          <>
            <span className="error-icon">✗</span>
            Failed
          </>
        );
      default:
        return 'Copy Markdown';
    }
  };

  const getButtonClass = () => {
    const baseClass = 'btn btn-secondary';
    if (copyState === 'success') return `${baseClass} btn-success`;
    if (copyState === 'error') return `${baseClass} btn-error`;
    return baseClass;
  };

  return (
    <button
      onClick={handleCopy}
      className={getButtonClass()}
      disabled={!prd || copyState === 'copying'}
      title="Copy formatted markdown to clipboard (⌘⇧C)"
      aria-label="Copy markdown to clipboard"
    >
      {getButtonContent()}
    </button>
  );
}

export default CopyMarkdownButton;