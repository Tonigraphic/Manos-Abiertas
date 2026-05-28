import { useEffect, useState } from 'react';
import { Button } from '../components/lsc/Button';
import { motion, AnimatePresence } from 'motion/react';
import { X, PlayCircle, Languages, Target, MessageSquare } from 'lucide-react';
import logoPrincipal from '../../assets/logo.png'; 
import { resolveVideoUrl } from '../../lib/videoUtils';

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

export function LandingView({ onNavigate }: LandingViewProps) {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  useEffect(() => {
    setIsDemoOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] relative overflow-x-hidden flex flex-col items-center justify-center">
      {/* Decoración de Fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gradient-to-br from-[var(--color-primary-200)] to-[var(--color-primary-400)] rounded-full blur-3xl opacity-20 transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-gradient-to-tr from-[var(--color-accent-200)] to-[var(--color-accent-400)] rounded-full blur-3xl opacity-20 transform -translate-x-1/3 translate-y-1/3" />
      </div>

      <AnimatePresence>
        {isDemoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10"
            >
              <button
                onClick={() => setIsDemoOpen(false)}
                className="absolute top-4 right-4 z-20 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
                aria-label="Cerrar video demo"
              >
                <X size={20} />
              </button>

              <video
                autoPlay
                controls
                playsInline
                muted={false}
                onEnded={() => setIsDemoOpen(false)}
                className="w-full aspect-video object-cover bg-black"
                src={resolveVideoUrl('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4')}
              />

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white pointer-events-none">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70 font-bold mb-2">Video demo</p>
                <h2 className="text-2xl md:text-4xl font-black mb-2">Conoce Manos Abiertas</h2>
                <p className="text-sm md:text-base text-white/80 max-w-2xl">Este video se cierra al terminar o puedes cerrarlo manualmente para ver la página principal.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col items-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center w-full"
        >
          {/* LOGO */}
          <div className="flex justify-center mb-6 md:mb-10">
            <img 
              src={logoPrincipal} 
              alt="Logo Manos Abiertas" 
              className="h-28 sm:h-36 lg:h-48 w-auto object-contain drop-shadow-lg" 
            />
          </div>

          <p className="text-lg sm:text-xl md:text-2xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-10 leading-relaxed font-medium px-4">
            Aprende, practica y comunícate usando Lengua de Señas Colombiana (LSC). ¿Qué deseas hacer hoy?
          </p>

          {/* Opciones Autónomas de Navegación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl mx-auto mb-12 px-4">
             {/* Opción Traductor */}
             <motion.div whileHover={{ y: -5 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-2 border-[var(--color-neutral-100)] hover:border-[var(--color-primary-300)] transition-all flex flex-col items-center text-center cursor-pointer group" onClick={() => onNavigate('translator')}>
                <div className="w-16 h-16 bg-[var(--color-primary-100)] text-[var(--color-primary-600)] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <Languages size={32} />
                </div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)] mb-2">Traductor</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6 flex-1">Comunícate en tiempo real bidireccionalmente.</p>
                <Button className="w-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-bold rounded-xl shadow-md">
                   Ir al Traductor
                </Button>
             </motion.div>

             {/* Opción Práctica */}
             <motion.div whileHover={{ y: -5 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-2 border-[var(--color-neutral-100)] hover:border-[var(--color-accent-300)] transition-all flex flex-col items-center text-center cursor-pointer group" onClick={() => onNavigate('practice')}>
                <div className="w-16 h-16 bg-[var(--color-accent-100)] text-[var(--color-accent-600)] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <Target size={32} />
                </div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)] mb-2">Práctica</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6 flex-1">Mejora tus habilidades con ejercicios interactivos.</p>
                <Button className="w-full bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white font-bold rounded-xl shadow-md">
                   Ir a Práctica
                </Button>
             </motion.div>

             {/* Opción Sugerencias */}
             <motion.div whileHover={{ y: -5 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-2 border-[var(--color-neutral-100)] hover:border-[var(--color-success-300)] transition-all flex flex-col items-center text-center cursor-pointer group" onClick={() => onNavigate('feedback')}>
                <div className="w-16 h-16 bg-[var(--color-success-100)] text-[var(--color-success-600)] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <MessageSquare size={32} />
                </div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)] mb-2">Sugerencias</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6 flex-1">Ayúdanos a mejorar el diccionario y la app.</p>
                <Button className="w-full bg-[var(--color-success-500)] hover:bg-[var(--color-success-600)] text-white font-bold rounded-xl shadow-md">
                   Dejar Sugerencia
                </Button>
             </motion.div>
          </div>

          <button
            onClick={() => setIsDemoOpen(true)}
            className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-black text-white font-black shadow-xl hover:bg-neutral-900 transition-colors"
          >
            <PlayCircle size={24} />
            Ver video demostrativo
          </button>

        </motion.div>
      </section>
    </div>
  );
}
