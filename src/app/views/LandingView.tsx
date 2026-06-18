import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { motion, AnimatePresence } from 'motion/react';
import { X, PlayCircle, Languages, Target, MessageSquare, Video, Volume2, VolumeX, Maximize } from 'lucide-react';
import logoPrincipal from '../../assets/logo.png'; 
import { resolveVideoUrl } from '@/lib/videoUtils';
import { signRecognitionService } from '../../services/signRecognitionService';

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

export function LandingView({ onNavigate }: LandingViewProps) {
  const [isDemoActive, setIsDemoActive] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Preload the practice model silently in the background
    signRecognitionService.loadModel('Colores').catch(console.error);
  }, []);

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    setTimeout(() => {
      onNavigate(option);
    }, 380);
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).mozRequestFullScreen) {
        (videoRef.current as any).mozRequestFullScreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[var(--color-surface)] relative overflow-hidden flex flex-col items-center justify-center">
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
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 md:p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl aspect-video rounded-2xl md:rounded-[4rem] overflow-hidden shadow-2xl bg-black border border-white/10"
            >
              <button
                onClick={() => setIsDemoActive(false)}
                className="absolute top-3 right-3 md:top-6 md:right-6 z-20 bg-black/60 text-white rounded-full p-2 md:p-3 hover:bg-black/80 transition-all active:scale-90 border border-white/10"
                aria-label="Cerrar video demo"
              >
                <X className="w-5 h-5 md:w-7 md:h-7" />
              </button>

              <video
                ref={videoRef}
                autoPlay
                muted={isMuted}
                playsInline
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
                src="/demo.mp4"
                onEnded={() => setIsDemoActive(false)}
              />
              <div className="absolute top-3 left-4 md:top-4 md:left-8 z-20 pointer-events-none">
                <h2 className="text-[10px] sm:text-sm md:text-base font-bold text-white uppercase tracking-widest drop-shadow-md bg-black/35 px-2 py-1 rounded-md md:bg-transparent md:p-0">
                  Conoce Manos Abiertas
                </h2>
              </div>
              
              <div className="absolute bottom-3 left-3 right-3 md:bottom-6 md:left-6 md:right-6 z-20 flex justify-between items-center pointer-events-none">
                {/* Botón de Pantalla Completa */}
                <button
                  onClick={handleFullscreen}
                  className="pointer-events-auto bg-black/60 text-white rounded-full p-2 md:px-4 md:py-2 hover:bg-black/80 transition-all active:scale-95 flex items-center gap-2 border border-white/10"
                  aria-label="Pantalla completa"
                >
                  <Maximize className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline text-xs font-black uppercase tracking-wider pr-1">
                    Pantalla Completa
                  </span>
                </button>

                {/* Botón Silenciar/Audio */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="pointer-events-auto bg-black/60 text-white rounded-full p-2 md:px-4 md:py-2 hover:bg-black/80 transition-all active:scale-95 flex items-center gap-2 border border-white/10"
                  aria-label={isMuted ? "Activar sonido" : "Silenciar"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
                  <span className="hidden sm:inline text-xs font-black uppercase tracking-wider pr-1">
                    {isMuted ? "Activar Sonido" : "Sonido Activo"}
                  </span>
                </button>
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
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 md:py-8 flex flex-col items-center justify-center text-center"
      >
        <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-8">
          {/* LOGO */}
          <div className="flex justify-center items-center w-full">
            <img 
              src={logoPrincipal} 
              alt="Logo Manos Abiertas" 
              className="h-20 sm:h-32 lg:h-44 w-auto max-w-[80%] md:max-w-full object-contain drop-shadow-2xl" 
            />
          </div>

          <p className="text-xs sm:text-lg text-[var(--color-text-secondary)] leading-relaxed font-medium max-w-2xl mx-auto px-4">
            Aprende, practica y comunícate usando Lengua de Señas Colombiana (LSC). ¿Qué deseas hacer hoy?
          </p>

          {/* Opciones Autónomas de Navegación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
             {/* Opción Traductor */}
             <motion.div 
               whileHover={{ y: -5 }} 
               animate={selectedOption === 'translator' ? { x: [-3, 3, -3, 3, -1.5, 1.5, 0] } : {}}
               transition={{ duration: 0.35 }}
               className="bg-white rounded-[2rem] p-4 md:p-6 shadow-xl border-2 border-transparent hover:border-[var(--color-primary-300)] transition-all flex flex-col items-center text-center cursor-pointer group" 
               onClick={() => handleSelectOption('translator')}
             >
                <div className="w-10 h-10 md:w-14 md:h-14 bg-[var(--color-primary-100)] text-[var(--color-primary-600)] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <Languages size={24} />
                </div>
               <h3 className="text-base font-black text-[var(--color-primary-700)] mb-1">Traductor LSC</h3>
                <p className="text-[10px] text-neutral-600 mb-1 leading-tight">Comunícate en español y señas.</p>
             </motion.div>

             {/* Opción Práctica */}
             <motion.div 
               whileHover={{ y: -5 }} 
               animate={selectedOption === 'practice' ? { x: [-3, 3, -3, 3, -1.5, 1.5, 0] } : {}}
               transition={{ duration: 0.35 }}
               className="bg-white rounded-[2rem] p-4 md:p-6 shadow-xl border-2 border-transparent hover:border-[var(--color-accent-300)] transition-all flex flex-col items-center text-center cursor-pointer group" 
               onClick={() => handleSelectOption('practice')}
             >
                <div className="w-10 h-10 md:w-14 md:h-14 bg-[var(--color-accent-100)] text-[var(--color-accent-600)] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <Target size={24} />
                </div>
               <h3 className="text-base font-black text-[var(--color-accent-700)] mb-1">Práctica y Señas</h3>
                <p className="text-[10px] text-neutral-600 mb-1 leading-tight">Mejora tus habilidades con ejercicios.</p>
             </motion.div>

             {/* Opción Sugerencias */}
             <motion.div 
               whileHover={{ y: -5 }} 
               animate={selectedOption === 'feedback' ? { x: [-3, 3, -3, 3, -1.5, 1.5, 0] } : {}}
               transition={{ duration: 0.35 }}
               className="bg-white rounded-[2rem] p-4 md:p-6 shadow-xl border-2 border-transparent hover:border-[var(--color-success-300)] transition-all flex flex-col items-center text-center cursor-pointer group" 
               onClick={() => handleSelectOption('feedback')}
             >
                <div className="w-10 h-10 md:w-14 md:h-14 bg-[var(--color-success-100)] text-[var(--color-success-600)] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <MessageSquare size={24} />
                </div>
               <h3 className="text-base font-black text-[var(--color-success-700)] mb-1">Sugerencias</h3>
                <p className="text-[10px] text-neutral-600 mb-1 leading-tight">Ayúdanos a fortalecer la comunicación.</p>
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
