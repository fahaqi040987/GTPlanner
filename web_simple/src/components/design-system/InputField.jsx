import React from 'react';

/**
 * DesignStitch InputField component
 * Material Design styled input with label and focus states
 */
const InputField = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  required = false,
  error = '',
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-xs">
      {label && (
        <label
          className="block text-label-caps font-label-caps text-on-surface-variant uppercase tracking-widest"
          htmlFor={name}
        >
          {label}
          {required && <span className="text-error ml-xs">*</span>}
        </label>
      )}
      <input
        className={`w-full px-md py-3 bg-surface border border-outline-variant rounded-lg
                   text-body-md font-body-md text-on-surface placeholder:text-outline
                   focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary
                   transition-colors duration-200 ${error ? 'border-error' : ''} ${className}`.trim()}
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
      {error && (
        <p className="text-body-sm text-error mt-xs">{error}</p>
      )}
    </div>
  );
};

export default InputField;
