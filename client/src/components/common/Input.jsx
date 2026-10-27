import React from 'react';

const Input = ({
  id,
  name,
  label,
  hint,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  icon: Icon = null,
  disabled = false,
  required = false,
  as = 'input',
  maxLength,
  showCharCount = false,
  ...props
}) => {
  const Component = as === 'textarea' ? 'textarea' : 'input';
  const hasError = Boolean(error);

  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id || name} className="form-label">
          <span>
            {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
          </span>
          {hint && <span className="form-label-hint">{hint}</span>}
        </label>
      )}

      <div className="input-wrapper">
        {Icon && (
          <div className="input-icon">
            <Icon size={18} />
          </div>
        )}

        <Component
          id={id || name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`form-control ${Icon ? 'has-left-icon' : ''} ${hasError ? 'is-invalid' : ''}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id || name}-error` : undefined}
          {...props}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
        {hasError ? (
          <span id={`${id || name}-error`} className="input-feedback is-error">
            {error}
          </span>
        ) : (
          <span />
        )}

        {showCharCount && maxLength && (
          <span className="input-feedback is-hint" style={{ marginLeft: 'auto' }}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default Input;
