import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  isVisible: boolean;
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
}

export function Toast({ isVisible, message, variant = 'info', onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };

  const variantStyles = {
    success: 'bg-[var(--color-success-50)] border-[var(--color-success-500)] text-[var(--color-success-700)]',
    error: 'bg-[var(--color-error-50)] border-[var(--color-error-500)] text-[var(--color-error-700)]',
    warning: 'bg-[var(--color-warning-50)] border-[var(--color-warning-500)] text-[var(--color-warning-700)]',
    info: 'bg-[var(--color-primary-50)] border-[var(--color-primary-500)] text-[var(--color-primary-700)]',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={`
            fixed top-6 left-1/2 z-50
            flex items-center gap-3 px-5 py-4 rounded-xl border-l-4 shadow-lg
            ${variantStyles[variant]}
          `}
        >
          {icons[variant]}
          <p className="font-medium">{message}</p>
          <button
            onClick={onClose}
            className="ml-2 p-1 rounded hover:bg-black/10 transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
