import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-xl border transition-all duration-150
              ${leftIcon ? 'pl-11' : ''}
              ${rightIcon ? 'pr-11' : ''}
              ${error
                ? 'border-[var(--color-error-500)] focus:ring-2 focus:ring-[var(--color-error-200)] focus:border-[var(--color-error-500)]'
                : 'border-[var(--color-neutral-300)] focus:ring-2 focus:ring-[var(--color-primary-200)] focus:border-[var(--color-primary-500)]'
              }
              bg-white text-[var(--color-text-primary)]
              placeholder:text-[var(--color-text-tertiary)]
              disabled:bg-[var(--color-neutral-100)] disabled:cursor-not-allowed
              outline-none
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-[var(--color-error-500)]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
