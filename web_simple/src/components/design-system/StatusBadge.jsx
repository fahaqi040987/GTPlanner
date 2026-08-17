import React from 'react';

/**
 * DesignStitch StatusBadge component
 * Colored status indicator with dot
 */
const StatusBadge = ({ status, variant = 'draft' }) => {
  const variants = {
    draft: {
      bg: 'bg-primary-fixed/20',
      text: 'text-primary-fixed-variant',
      dot: 'bg-primary'
    },
    published: {
      bg: 'bg-secondary-container/20',
      text: 'text-on-secondary-container',
      dot: 'bg-secondary'
    },
    error: {
      bg: 'bg-error-container/20',
      text: 'text-on-error-container',
      dot: 'bg-error'
    }
  };

  const styles = variants[variant] || variants.draft;

  return (
    <div className={`inline-flex items-center gap-xs px-sm py-xs rounded-full
                    ${styles.bg} ${styles.text} text-label-caps font-label-caps`}>
      <span className={`w-2 h-2 rounded-full ${styles.dot}`}></span>
      {status}
    </div>
  );
};

export default StatusBadge;
