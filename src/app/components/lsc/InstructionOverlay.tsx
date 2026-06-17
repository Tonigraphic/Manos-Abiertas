import { X, Info, Camera, Focus, Hand } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

interface InstructionOverlayProps {
  show: boolean;
  onClose: () => void;
  onToggle?: () => void;
}

export function InstructionOverlay({ show, onClose }: InstructionOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-neutral-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10 text-white"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-[var(--color-primary-600)]/20 p-2.5 rounded-xl text-[var(--color-primary-400)]">
                  <Info size={24} />
                </div>
                <h2 className="text-xl font-black tracking-tight">Cómo practicar</h2>
              </div>
              <button 
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-600)]/20 text-[var(--color-primary-400)] flex items-center justify-center font-bold flex-shrink-0 border border-[var(--color-primary-600)]/30">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Activa tu cámara</h3>
                  <p className="text-white/60 leading-relaxed text-sm">El sistema necesita verte para analizar tus movimientos y validar si la seña es correcta en tiempo real.</p>
                </div>
              </div>

              <div className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-600)]/20 text-[var(--color-primary-400)] flex items-center justify-center font-bold flex-shrink-0 border border-[var(--color-primary-600)]/30">
                  <Focus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Posiciónate bien</h3>
                  <p className="text-white/60 leading-relaxed text-sm">Asegúrate de estar en un lugar con buena iluminación y que tus manos y rostro estén dentro del encuadre.</p>
                </div>
              </div>

              <div className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-600)]/20 text-[var(--color-primary-400)] flex items-center justify-center font-bold flex-shrink-0 border border-[var(--color-primary-600)]/30">
                  <Hand size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Imita la seña</h3>
                  <p className="text-white/60 leading-relaxed text-sm">Observa el video de ejemplo y repite la seña con claridad. Mantén la posición hasta que veas el indicador de éxito.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
              <Button onClick={onClose} className="px-8 py-3 font-bold rounded-xl bg-white !text-black hover:bg-white/90">
                ¡Entendido!
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
