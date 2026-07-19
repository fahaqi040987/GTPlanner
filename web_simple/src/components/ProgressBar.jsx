/**
 * Progress Bar Component
 * Displays horizontal progress bar with status text during PRD generation
 */
import React from 'react';

function ProgressBar({ progress = 0, status = '', error = null, complete = false }) {
  // Determine color based on state
  const getProgressColor = () => {
    if (error) return 'var(--error-500)'; // Red for errors
    if (complete) return 'var(--success-500)'; // Green for success
    return 'var(--primary-500)'; // Blue for in-progress
  };

  // Get status text color
  const getStatusColor = () => {
    if (error) return 'var(--error-700)';
    if (complete) return 'var(--success-700)';
    return 'var(--ink-500)';
  };

  return (
    <div className="progress-container">
      {/* Progress bar */}
      <div className="progress-bar-wrapper">
        <div
          className="progress-bar"
          style={{
            width: `${progress}%`,
            backgroundColor: getProgressColor(),
            transition: 'width 0.5s ease-in-out, background-color 0.3s ease'
          }}
        />
      </div>

      {/* Status text */}
      {status && (
        <div
          className="progress-status"
          style={{ color: getStatusColor() }}
        >
          {status}
        </div>
      )}

      {/* Percentage indicator */}
      <div className="progress-percentage">
        {progress}%
      </div>

      {/* Error message */}
      {error && (
        <div className="progress-error">
          {error}
        </div>
      )}
    </div>
  );
}

export default ProgressBar;