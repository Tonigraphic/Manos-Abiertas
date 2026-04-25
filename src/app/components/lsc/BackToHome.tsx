import { ArrowLeft } from 'lucide-react';
import { Button } from './Button';

interface BackToHomeProps {
  onNavigate: () => void;
}

export function BackToHome({ onNavigate }: BackToHomeProps) {
  return (
    <div className="fixed top-6 left-6 z-50">
      <Button
        variant="ghost"
        onClick={onNavigate}
        leftIcon={<ArrowLeft size={20} />}
        className="bg-white/90 backdrop-blur-sm shadow-lg border border-[var(--color-neutral-200)] hover:bg-white"
      >
        Volver al inicio
      </Button>
    </div>
  );
}
