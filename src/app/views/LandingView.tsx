import { Button } from '../components/lsc/Button';
import { motion } from 'motion/react';
import { PlayCircle, Info } from 'lucide-react';
import logoPrincipal from '../../assets/logo.png'; 

interface LandingViewProps {
  onNavigate: (view: string) => void;
}

export function LandingView({ onNavigate }: LandingViewProps) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] relative overflow-hidden flex flex-col items-center justify-center">
      {/* Decoración de Fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[var(--color-primary-200)] to-[var(--color-primary-400)] rounded-full blur-3xl opacity-20 transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[var(--color-accent-200)] to-[var(--color-accent-400)] rounded-full blur-3xl opacity-20 transform -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Hero Section */}
      <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center w-full"
        >
          {/* LOGO */}
          <div className="flex justify-center mb-8">
            <img 
              src={logoPrincipal} 
              alt="Logo Manos Abiertas" 
              className="h-24 sm:h-32 lg:h-40 w-auto object-contain drop-shadow-lg" 
            />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] mb-6 tracking-tight">
            Manos Abiertas
          </h1>

          <p className="text-xl sm:text-2xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Aprende, practica y comunícate usando Lengua de Señas Colombiana (LSC).
          </p>

          {/* Video Placeholder */}
          <div className="w-full max-w-4xl mx-auto aspect-video bg-[var(--color-neutral-800)] rounded-2xl overflow-hidden shadow-2xl relative mb-12 flex items-center justify-center group cursor-pointer border-4 border-white/50">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <PlayCircle size={80} className="text-white/80 group-hover:scale-110 transition-transform drop-shadow-xl" />
            <div className="absolute bottom-6 left-6 text-white text-left">
              <p className="font-bold text-xl drop-shadow-md">Conoce Manos Abiertas</p>
              <p className="text-sm text-white/80 drop-shadow-md">Video demostrativo (02:30)</p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('practice')}
              className="w-full sm:w-auto px-10 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white flex items-center gap-2"
            >
              Comenzar
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                document.getElementById('more-info')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-10 py-4 text-lg font-bold bg-white/80 hover:bg-white text-[var(--color-text-primary)] border-2 border-[var(--color-neutral-200)] hover:border-[var(--color-primary-300)] shadow-md hover:shadow-lg transition-all rounded-xl flex items-center gap-2"
            >
              <Info size={20} />
              Conocer más
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Info Section (Anchor for scroll) */}
      <section id="more-info" className="relative w-full max-w-6xl mx-auto px-4 py-20 mt-10">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-10 text-center shadow-lg border border-[var(--color-neutral-100)]">
           <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">Sobre el Proyecto</h2>
           <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
             Manos Abiertas es una plataforma educativa diseñada para acercar la Lengua de Señas Colombiana a todos. 
             Utilizamos tecnología moderna para ofrecer una experiencia de práctica interactiva y un traductor bidireccional.
           </p>
        </div>
      </section>
    </div>
  );
}
