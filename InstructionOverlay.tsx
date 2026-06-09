import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface InstructionOverlayProps {
  show: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export function InstructionOverlay({ show, onClose, onToggle }: InstructionOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Fondo oscuro con desenfoque para bloquear la vista y obligar a leer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-[110] w-full max-w-xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-5 md:p-8 text-gray-800 border border-white/20 max-h-[95vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Guía de Práctica</h2>
            </div>

            {/* Guía visual de encuadre (Estilo avatar/perfil) */}
            <div className="flex flex-col items-center justify-center mb-4 gap-2">
              <div className="relative w-20 h-28 md:w-48 md:h-28 border-2 border-dashed border-purple-200 rounded-2xl flex items-center justify-center bg-purple-50/50 overflow-hidden shadow-inner">
                {/* Silueta Estilizada: Rostro y Torso anclados a la base */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
                  {/* Cabeza / Rostro (Óvalo proporcionado) */}
                  <div className="w-7 h-9 md:w-9 md:h-11 bg-purple-200/80 rounded-[1.5rem] mb-1 shadow-sm border border-purple-300/30" />
                  {/* Torso / Hombros (Adaptable al ancho del visor) */}
                  <div className="w-16 h-12 md:w-32 md:h-14 bg-purple-200/80 rounded-t-[2rem] shadow-sm border border-purple-300/30" />
                </div>
                
                {/* Efecto de Escaneo de IA (Animación de línea láser) */}
                <motion.div 
                  animate={{ top: ['-10%', '110%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_8px_rgba(168,85,247,0.5)] z-10"
                />

                {/* Esquinas de Visor de Cámara (HUD) */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-purple-300" />
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-purple-300" />
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-purple-300" />
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-purple-300" />

                {/* Overlay de Pulso de Detección */}
                <div className="absolute inset-0 rounded-2xl border border-purple-100/50 animate-pulse opacity-20" />
              </div>
              <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.2em]">Encuadre Ideal: Rostro y Torso</span>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 font-bold leading-tight">
                Para que la Inteligencia Artificial reconozca tus señas correctamente, por favor ten en cuenta lo siguiente:
              </p>
              
              <ul className="space-y-2">
                {[
                  { icon: "💡", text: "Asegúrate de tener una iluminación clara y frontal." },
                  { icon: "📐", text: "Logra un buen encuadre: tu rostro y torso deben ser visibles." },
                  { icon: "👤", text: "Mantente centrado y de frente a la cámara." },
                  { icon: "✨", text: "El sistema detectará automáticamente cuando logres la seña correcta." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-center bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <span className="text-xs font-bold text-gray-700 leading-tight">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98]"
              >
                Entendido, ¡Empezar!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}