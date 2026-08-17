import React from 'react';

/**
 * DesignStitch Card component
 * Material Design card with elevation and border
 */
const Card = ({
  children,
  className = '',
  elevation = 'medium',
  padding = 'xl',
  ...props
}) => {
  const elevations = {
    none: 'shadow-none',
    small: 'shadow-[0_2px_4px_-1px_rgba(0,0,0,0.1)]',
    medium: 'shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)]',
    large: 'shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]'
  };

  const paddings = {
    none: '',
    sm: 'p-sm',
    md: 'p-md',
    lg: 'p-lg',
    xl: 'p-xl',
    '2xl': 'p-2xl'
  };

  return (
    <div
      className={`bg-surface-container-lowest border border-surface-variant rounded-xl
                  ${elevations[elevation]} ${paddings[padding]} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
