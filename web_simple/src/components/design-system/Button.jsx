import React from 'react';

/**
 * DesignStitch Button component
 * Supports primary, secondary variants with icon support
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseStyles = 'rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-xs';

  const variants = {
    primary: 'bg-secondary text-on-secondary hover:bg-secondary/90',
    secondary: 'bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary-fixed/90',
    outline: 'border border-outline-variant text-on-surface hover:bg-surface-container-low'
  };

  const sizes = {
    sm: 'py-sm px-md text-label-caps',
    md: 'py-3 px-md text-body-md',
    lg: 'py-lg px-xl text-body-md'
  };

  const activeStyles = !disabled ? 'active:scale-[0.98] shadow-sm' : 'opacity-50 cursor-not-allowed';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${activeStyles} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
