import { HTMLAttributes } from 'react';

type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function Badge({ children, variant = 'primary', size = 'md', className = '', ...props }: BadgeProps) {
  const variantStyles = {
    primary: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border-[var(--color-primary-200)]',
    accent: 'bg-[var(--color-accent-100)] text-[var(--color-accent-700)] border-[var(--color-accent-200)]',
    success: 'bg-[var(--color-success-50)] text-[var(--color-success-700)] border-[var(--color-success-200)]',
    warning: 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)] border-[var(--color-warning-200)]',
    error: 'bg-[var(--color-error-50)] text-[var(--color-error-700)] border-[var(--color-error-200)]',
    neutral: 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] border-[var(--color-neutral-200)]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}