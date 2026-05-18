// Input — text input with label, error state, and optional helper text.
// Uses semantic tokens for dark/light mode support.

import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = '', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-heading"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-heading placeholder:text-placeholder transition-all duration-200 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 ${
            error ? 'border-danger' : 'border-border'
          } ${className}`}
          {...props}
        />
        {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-danger" aria-live="polite">{error}</p>}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
