import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'motion/react';

type CardVariant = 'default' | 'featured';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', hoverable = false, className = '', ...props }, ref) => {
    const baseStyles = 'bg-white rounded-2xl transition-all duration-200';

    const variantStyles = {
      default: 'shadow-md border border-[var(--color-neutral-200)]',
      featured: 'shadow-xl border-2 border-[var(--color-primary-200)] bg-gradient-to-br from-white to-[var(--color-primary-50)]',
    };

    const hoverStyles = hoverable ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';

    return (
      <motion.div
        ref={ref}
        initial={hoverable ? { y: 0 } : undefined}
        whileHover={hoverable ? { y: -4 } : undefined}
        className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-5 border-b border-[var(--color-neutral-200)] ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 border-t border-[var(--color-neutral-200)] ${className}`} {...props}>
      {children}
    </div>
  );
}
