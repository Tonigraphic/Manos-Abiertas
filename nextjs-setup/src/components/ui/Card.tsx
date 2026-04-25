import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'featured';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
}

const variantStyles = {
  default: 'shadow-md border border-gray-200',
  featured: 'shadow-xl border-2 border-primary-200 bg-gradient-to-br from-white to-primary-50',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', hoverable = false, className, ...props }, ref) => {
    const Component = hoverable ? motion.div : 'div';

    return (
      <Component
        ref={ref}
        {...(hoverable && {
          initial: { y: 0 },
          whileHover: { y: -4 },
        })}
        className={cn(
          'bg-white rounded-2xl transition-all duration-200',
          variantStyles[variant],
          hoverable && 'hover:shadow-xl cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-5 border-b border-gray-200', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4 border-t border-gray-200', className)} {...props}>
      {children}
    </div>
  );
}
