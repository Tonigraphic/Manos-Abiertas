import { motion } from 'motion/react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Cargando...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-[var(--color-primary-200)] border-t-[var(--color-primary-600)] rounded-full"
      />
      <p className="mt-6 text-[var(--color-text-secondary)] font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-[var(--color-neutral-100)] rounded-2xl flex items-center justify-center text-[var(--color-text-tertiary)] mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>
      <p className="text-[var(--color-text-secondary)] max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Algo salió mal',
  description = 'Ocurrió un error. Por favor, intenta nuevamente.',
  onRetry
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-[var(--color-error-50)] rounded-2xl flex items-center justify-center mb-6">
        <span className="text-4xl">⚠️</span>
      </div>
      <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>
      <p className="text-[var(--color-text-secondary)] max-w-sm mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-[var(--color-primary-600)] text-white rounded-xl font-medium hover:bg-[var(--color-primary-700)] transition-colors shadow-md"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
