import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';

const PasswordInput = ({
  id,
  name,
  label = 'Password',
  hint,
  value = '',
  onChange,
  placeholder = 'Enter password',
  error,
  disabled = false,
  required = false,
  showRequirements = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const hasError = Boolean(error);

  // Live password policy checks
  const checks = {
    length: value.length >= 8 && value.length <= 16,
    uppercase: /[A-Z]/.test(value),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
  };

  return (
    <div className="form-group">
      <label htmlFor={id || name} className="form-label">
        <span>
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </span>
        {hint && <span className="form-label-hint">{hint}</span>}
      </label>

      <div className="input-wrapper">
        <div className="input-icon">
          <Lock size={18} />
        </div>

        <input
          id={id || name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={16}
          className={`form-control has-left-icon has-right-icon ${hasError ? 'is-invalid' : ''}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id || name}-error` : undefined}
          {...props}
        />

        <button
          type="button"
          className="input-action-btn"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {hasError && (
        <span id={`${id || name}-error`} className="input-feedback is-error" style={{ marginTop: '0.2rem' }}>
          {error}
        </span>
      )}

      {showRequirements && value.length > 0 && (
        <div className="password-requirements" aria-live="polite">
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Password requirements:</div>
          <div className={`req-item ${checks.length ? 'met' : 'unmet'}`}>
            {checks.length ? <Check size={14} /> : <X size={14} />}
            <span>8 to 16 characters long ({value.length}/16)</span>
          </div>
          <div className={`req-item ${checks.uppercase ? 'met' : 'unmet'}`}>
            {checks.uppercase ? <Check size={14} /> : <X size={14} />}
            <span>At least one uppercase letter (A-Z)</span>
          </div>
          <div className={`req-item ${checks.special ? 'met' : 'unmet'}`}>
            {checks.special ? <Check size={14} /> : <X size={14} />}
            <span>At least one special character (!@#$%^&*)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
