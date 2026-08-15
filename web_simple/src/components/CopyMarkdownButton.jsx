/**
 * Copy Markdown Button Component
 *
 * Design Reference: docs/design/NAVIGATION_AND_MARKDOWN_DESIGN.md
 * Implementation of copy to clipboard functionality with YAML frontmatter
 *
 * Features implemented:
 * - Copy formatted markdown to clipboard (Design: Section "3. Copy to Clipboard Functionality")
 * - YAML frontmatter inclusion for AI agent optimization (Design: Section "2. Improved Markdown Formatting")
 * - Feedback states: Default → Copying → Success/Error (Design: Section "3. Copy to Clipboard Functionality")
 * - Keyboard shortcut: Cmd/Ctrl + Shift + C (Design: Section "3. Copy to Clipboard Functionality")
 * - Clipboard API with fallback for older browsers (Design: Section "3. Copy to Clipboard Functionality")
 *
 * Button States:
 * - Default: "Copy Markdown" with secondary button style
 * - Copying: Spinner with "Copying..." text
 * - Success: Green checkmark + "Copied!" for 2 seconds
 * - Error: Red X + "Failed to copy"
 *
 * Accessibility:
 * - Keyboard accessible (Enter/Space)
 * - Screen reader support with aria-label
 * - Visual focus indicator
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