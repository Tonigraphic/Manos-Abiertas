import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

interface InstructionsModalProps {
  id: string;
  title: string;
  instructions: string[];
}

export function InstructionsModal({ id, title, instructions }: InstructionsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has seen the instructions for this specific view
    const hasSeen = localStorage.getItem(`has_seen_instructions_${id}`);
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, [id]);

  const handleClose = () => {
    localStorage.setItem(`has_seen_instructions_${id}`, 'true');
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 md:bottom-6 z-40 bg-[var(--color-primary-600)] text-white p-3 rounded-full shadow-lg hover:bg-[var(--color-primary-700)] transition-colors"
        title="Ver instrucciones"
      >
        <Info size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-100"
            >
              <div className="flex justify-between items-center p-6 border-b border-neutral-100 bg-neutral-50">
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--color-primary-100)] p-2 rounded-xl text-[var(--color-primary-600)]">
                    <Info size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-neutral-800">{title}</h2>
                </div>
                <button 
                  onClick={handleClose}
                  className="text-neutral-400 hover:text-neutral-700 transition-colors p-2 rounded-full hover:bg-neutral-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {instructions.map((inst, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-600)] flex items-center justify-center font-bold flex-shrink-0 border border-[var(--color-primary-200)] mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-neutral-600 leading-relaxed pt-1">{inst}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end">
                <Button onClick={handleClose} className="px-8 font-bold">
                  ¡Entendido!
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
