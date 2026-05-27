import { useState } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackViewProps {
  onNavigateHome?: () => void;
}

export function FeedbackView({ onNavigateHome }: FeedbackViewProps = {}) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular el envío
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)] pb-20 md:pb-0 flex flex-col bg-[var(--color-surface)] relative">
      <div className="flex-shrink-0 p-6 sm:p-8 bg-white border-b border-[var(--color-neutral-200)] shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="bg-[var(--color-primary-100)] p-3 rounded-2xl text-[var(--color-primary-600)] shadow-inner">
            <MessageSquare size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Sugerencias</h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">Ayúdanos a mejorar el asistente LSC</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center py-20">
                <CheckCircle2 size={80} className="text-[var(--color-success-500)] mb-6" />
                <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">¡Gracias por tu aporte!</h2>
                <p className="text-[var(--color-text-secondary)] mb-8 max-w-md text-lg">Tu retroalimentación es vital para seguir mejorando la comunicación inclusiva en la Universidad.</p>
                <Button onClick={() => setIsSubmitted(false)} variant="ghost" className="font-bold border-2 border-[var(--color-neutral-200)] px-8 py-3 text-lg rounded-xl">Enviar otra sugerencia</Button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl">
                  <CardBody className="p-8 sm:p-10 space-y-8">
                    
                    <div className="text-center">
                       <h2 className="text-2xl font-black text-[var(--color-text-primary)] mb-2">Déjanos tus comentarios</h2>
                       <p className="text-[var(--color-text-secondary)]">¿Encontraste un error? ¿Falta alguna seña? Cuéntanos.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Nombre (Opcional)</label>
                          <input
                            type="text"
                            placeholder="Tu nombre completo"
                            className="w-full p-4 bg-[var(--color-neutral-50)] border-2 rounded-xl focus:bg-white focus:border-[var(--color-primary-400)] outline-none transition-colors border-[var(--color-neutral-200)] text-[var(--color-text-primary)]"
                          />
                       </div>

                       <div className="space-y-2">
                          <label className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Mensaje *</label>
                          <textarea
                            placeholder="Escribe tu sugerencia, corrección o comentario aquí..."
                            className="w-full h-40 p-4 bg-[var(--color-neutral-50)] border-2 rounded-xl focus:bg-white focus:border-[var(--color-primary-400)] outline-none resize-none transition-colors border-[var(--color-neutral-200)] text-[var(--color-text-primary)]"
                            required
                          />
                       </div>

                       <Button type="submit" className="w-full py-5 text-lg font-bold shadow-lg bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-xl mt-4" disabled={isSubmitting}>
                         <Send size={20} className="mr-2" /> {isSubmitting ? 'Enviando...' : 'Enviar Sugerencia'}
                       </Button>
                    </form>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
