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
            className="relative z-[110] w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 text-gray-800 border border-white/20 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-purple-50 p-4 rounded-3xl text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Guía de Práctica</h2>
            </div>

            {/* Guía visual de encuadre (Estilo avatar/perfil) */}
            <div className="flex flex-col items-center justify-center mb-8 gap-3">
              <div className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-dashed border-purple-200 rounded-full flex items-center justify-center bg-purple-50 overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 md:w-32 md:h-32 text-purple-100 absolute bottom-0 translate-y-2">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <div className="absolute inset-0 rounded-full border-2 border-purple-100 animate-pulse opacity-30" />
              </div>
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Encuadre Ideal: Rostro y Torso</span>
            </div>

            <div className="space-y-6">
              <p className="text-lg text-gray-600 font-medium leading-relaxed">
                Para que la Inteligencia Artificial reconozca tus señas correctamente, por favor ten en cuenta lo siguiente:
              </p>
              
              <ul className="space-y-4">
                {[
                  { icon: "💡", text: "Asegúrate de tener una iluminación clara y frontal." },
                  { icon: "📐", text: "Logra un buen encuadre: tu rostro y torso deben ser visibles." },
                  { icon: "👤", text: "Mantente centrado y de frente a la cámara." },
                  { icon: "✨", text: "El sistema detectará automáticamente cuando logres la seña correcta." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-5 items-center bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100">
                    <span className="text-2xl shrink-0">{item.icon}</span>
                    <span className="font-bold text-gray-700 leading-tight">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <button
                onClick={onClose}
                className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white rounded-3xl font-black text-2xl transition-all shadow-2xl shadow-purple-500/30 active:scale-[0.98]"
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