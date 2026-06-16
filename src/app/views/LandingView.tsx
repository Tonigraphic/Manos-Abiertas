import { useState } from 'react';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { motion, AnimatePresence } from 'motion/react';
import { X, PlayCircle, Languages, Target, MessageSquare, Video } from 'lucide-react';
import logoPrincipal from '../../assets/logo.png'; 
import { resolveVideoUrl } from '@/lib/videoUtils';

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

export function LandingView({ onNavigate }: LandingViewProps) {
  const [isDemoActive, setIsDemoActive] = useState(true);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] relative overflow-hidden flex flex-col items-center justify-center">
      {/* Decoración de Fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gradient-to-br from-[var(--color-primary-200)] to-[var(--color-primary-400)] rounded-full blur-3xl opacity-20 transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-gradient-to-tr from-[var(--color-accent-200)] to-[var(--color-accent-400)] rounded-full blur-3xl opacity-20 transform -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Modal Video Demo Automático (Capa Superior) */}
      <AnimatePresence>
        {isDemoActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl aspect-video rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl bg-black border border-white/10"
            >
              <button
                onClick={() => setIsDemoActive(false)}
                className="absolute top-6 right-6 z-20 bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition-all active:scale-90"
                aria-label="Cerrar video demo"
              >
                <X size={28} />
              </button>

              <video
                autoPlay
                playsInline
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
                src={resolveVideoUrl('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4')}
                onEnded={() => setIsDemoActive(false)}
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none">
                <p className="text-xs md:text-sm uppercase tracking-[0.5em] text-white/50 font-black mb-2">Presentación Institucional</p>
                <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Conoce Manos Abiertas</h2>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido Principal de la Landing (Capa Inferior) */}
      <motion.section 
        animate={{ 
          opacity: isDemoActive ? 0.3 : 1, 
          scale: isDemoActive ? 0.95 : 1,
          filter: isDemoActive ? 'blur(10px)' : 'blur(0px)' 
        }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 md:py-8 flex flex-col items-center justify-center text-center overflow-hidden"
      >
        <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-8">
          {/* LOGO */}
          <div className="flex justify-center">
            <img 
              src={logoPrincipal} 
              alt="Logo Manos Abiertas" 
              className="h-24 sm:h-32 lg:h-44 w-auto object-contain drop-shadow-2xl" 
            />
          </div>

          <p className="text-xs sm:text-lg text-[var(--color-text-secondary)] leading-relaxed font-medium max-w-2xl mx-auto px-4">
            Aprende, practica y comunícate usando Lengua de Señas Colombiana (LSC). ¿Qué deseas hacer hoy?
          </p>

          {/* Opciones Autónomas de Navegación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
             {/* Opción Traductor */}
             <motion.div whileHover={{ y: -5 }} className="bg-white rounded-[2rem] p-4 md:p-6 shadow-xl border-2 border-transparent hover:border-[var(--color-primary-300)] transition-all flex flex-col items-center text-center cursor-pointer group" onClick={() => onNavigate('translator')}>
                <div className="w-10 h-10 md:w-14 md:h-14 bg-[var(--color-primary-100)] text-[var(--color-primary-600)] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <Languages size={24} />
                </div>
                <h3 className="text-base font-black text-[var(--color-text-primary)] mb-1">Traductor</h3>
                <p className="text-[10px] text-[var(--color-text-secondary)] mb-3 leading-tight">Comunícate bidireccionalmente con IA.</p>
                <Badge variant="primary" className="text-[8px] py-1 px-3 font-black uppercase tracking-widest">En Vivo</Badge>
             </motion.div>

             {/* Opción Práctica */}
             <motion.div whileHover={{ y: -5 }} className="bg-white rounded-[2rem] p-4 md:p-6 shadow-xl border-2 border-transparent hover:border-[var(--color-accent-300)] transition-all flex flex-col items-center text-center cursor-pointer group" onClick={() => onNavigate('practice')}>
                <div className="w-10 h-10 md:w-14 md:h-14 bg-[var(--color-accent-100)] text-[var(--color-accent-600)] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <Target size={24} />
                </div>
                <h3 className="text-base font-black text-[var(--color-text-primary)] mb-1">Práctica</h3>
                <p className="text-[10px] text-[var(--color-text-secondary)] mb-3 leading-tight">Mejora tus habilidades con ejercicios.</p>
                <Badge variant="accent" className="text-[8px] py-1 px-3 font-black uppercase tracking-widest">Popular</Badge>
             </motion.div>

             {/* Opción Sugerencias */}
             <motion.div whileHover={{ y: -5 }} className="bg-white rounded-[2rem] p-4 md:p-6 shadow-xl border-2 border-transparent hover:border-[var(--color-success-300)] transition-all flex flex-col items-center text-center cursor-pointer group" onClick={() => onNavigate('feedback')}>
                <div className="w-10 h-10 md:w-14 md:h-14 bg-[var(--color-success-100)] text-[var(--color-success-600)] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <MessageSquare size={24} />
                </div>
                <h3 className="text-base font-black text-[var(--color-text-primary)] mb-1">Sugerencias</h3>
                <p className="text-[10px] text-[var(--color-text-secondary)] mb-3 leading-tight">Ayúdanos a mejorar el diccionario.</p>
                <Badge variant="success" className="text-[8px] py-1 px-3 font-black uppercase tracking-widest">Comunidad</Badge>
             </motion.div>
          </div>

          {/* Botón para volver a reproducir el Demo */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDemoActive(true)}
            className="inline-flex items-center gap-2 px-6 py-3 mt-4 rounded-xl bg-black text-white font-black shadow-2xl hover:bg-neutral-900 transition-all border border-white/10 text-xs"
          >
            <PlayCircle size={18} />
            Ver video demostrativo
          </motion.button>
        </div>
      </motion.section>
    </div>
  );
}
