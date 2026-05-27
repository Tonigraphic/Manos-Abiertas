import { Button } from '../components/lsc/Button';
import { motion } from 'motion/react';
import { PlayCircle, Languages, Target, MessageSquare } from 'lucide-react';
import logoPrincipal from '../../assets/logo.png'; 

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

export function LandingView({ onNavigate }: LandingViewProps) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] relative overflow-x-hidden flex flex-col items-center justify-center">
      {/* Decoración de Fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gradient-to-br from-[var(--color-primary-200)] to-[var(--color-primary-400)] rounded-full blur-3xl opacity-20 transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-gradient-to-tr from-[var(--color-accent-200)] to-[var(--color-accent-400)] rounded-full blur-3xl opacity-20 transform -translate-x-1/3 translate-y-1/3" />
      </div>

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

          {/* Video Placeholder */}
          <div className="w-full max-w-4xl mx-auto aspect-video bg-[var(--color-neutral-800)] rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center group cursor-pointer border-4 border-white">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <PlayCircle size={80} className="text-white/90 group-hover:scale-110 transition-transform drop-shadow-xl" />
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 text-white text-left">
              <p className="font-black text-lg md:text-2xl drop-shadow-md">Conoce Manos Abiertas</p>
              <p className="text-xs md:text-sm text-white/80 font-medium drop-shadow-md mt-1">Video demostrativo (02:30)</p>
            </div>
          </div>

        </motion.div>
      </section>
    </div>
  );
}
