import { motion } from 'motion/react';
import { ShieldAlert, Mail, Lock, Copyright } from 'lucide-react';
import logoPrincipal from '../../assets/logo.png';

export function MaintenanceView() {
  return (
    <div className="h-[100dvh] w-full bg-[var(--color-surface)] relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background decorations (harmonious gradients) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gradient-to-br from-[var(--color-primary-200)] to-[var(--color-primary-400)] rounded-full blur-3xl opacity-20 transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-gradient-to-tr from-[var(--color-accent-200)] to-[var(--color-accent-400)] rounded-full blur-3xl opacity-20 transform -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-8">
        {/* LOGO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center items-center w-full"
        >
          <img
            src={logoPrincipal}
            alt="Logo Manos Abiertas"
            className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto max-w-[85%] object-contain drop-shadow-2xl"
          />
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 shadow-xl border border-neutral-100/60 max-w-lg w-full space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-800 leading-tight">
              Estamos en mantenimiento
            </h1>
            <p className="text-sm text-neutral-500 font-medium">
              Volveremos pronto. Estamos realizando algunas mejoras para brindarte la mejor experiencia.
            </p>
          </div>

          <div className="border-t border-neutral-100 pt-6 flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Contacto</span>
            <a
              href="mailto:contacto@manosabiertas.co"
              className="inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              contacto@manosabiertas.co
            </a>
          </div>
        </motion.div>

        {/* Footer / Copyright / Institution Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full flex flex-col items-center gap-6 pt-4"
        >
          <div className="flex justify-center items-center w-full">
            <img
              src="/Identidades para plataforma.png"
              alt="Identidades Institucionales"
              className="h-8 sm:h-12 w-auto object-contain opacity-75"
            />
          </div>
          
          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Copyright className="w-3 h-3" /> {new Date().getFullYear()} Manos Abiertas LSC. Todos los derechos reservados.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
