import { useState } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Target, RefreshCw, BarChart2 } from 'lucide-react';

interface PracticeViewProps {
  onNavigateHome?: () => void;
}

export function PracticeView({ onNavigateHome }: PracticeViewProps = {}) {
  const [showModal, setShowModal] = useState(false);

  // Estados Simulados
  const mockCurrentSign = "HOLA";
  const mockProgress = "3/10";
  const mockConfidence = 85;
  const mockRecognizedSign = "HOLA";
  
  return (
    <div className="min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)] pb-20 md:pb-0 flex flex-col bg-[var(--color-surface)] relative">
      
      {/* Header */}
      <div className="flex-shrink-0 p-6 sm:p-8 bg-white border-b border-[var(--color-neutral-200)] shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[var(--color-accent-100)] p-3 rounded-2xl text-[var(--color-accent-600)] shadow-inner">
              <Target size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Práctica de Reconocimiento</h1>
              <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">Imita la seña frente a la cámara</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setShowModal(true)}>
             Simular Fin
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto h-full min-h-[500px]">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            
            {/* Columna Izquierda: Instrucción */}
            <div className="lg:col-span-1 h-full flex flex-col gap-4">
               <Card className="flex-1 border-none shadow-lg bg-white overflow-hidden flex flex-col">
                  <CardBody className="p-6 flex flex-col h-full items-center justify-center text-center">
                     <p className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Seña actual</p>
                     <h2 className="text-4xl font-black text-[var(--color-primary-600)] mb-6">{mockCurrentSign}</h2>
                     
                     {/* Imagen ilustrativa placeholder */}
                     <div className="w-full aspect-square bg-[var(--color-neutral-100)] rounded-2xl border-2 border-dashed border-[var(--color-neutral-300)] flex items-center justify-center mb-6">
                        <span className="text-[var(--color-neutral-400)] text-sm font-medium">Imagen Ilustrativa</span>
                     </div>

                     <div className="w-full mt-auto">
                        <div className="flex justify-between text-sm font-bold text-[var(--color-text-secondary)] mb-2">
                           <span>Progreso</span>
                           <span>{mockProgress}</span>
                        </div>
                        <div className="w-full h-3 bg-[var(--color-neutral-200)] rounded-full overflow-hidden">
                           <div className="h-full bg-[var(--color-primary-500)] w-[30%] rounded-full"></div>
                        </div>
                     </div>
                  </CardBody>
               </Card>
            </div>

            {/* Centro: Cámara */}
            <div className="lg:col-span-2 h-full flex flex-col">
               <Card className="flex-1 border-4 border-[var(--color-primary-100)] shadow-2xl bg-black overflow-hidden relative rounded-3xl">
                  {/* Placeholder de Video */}
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-neutral-800)]">
                     <span className="text-white/50 text-lg font-bold tracking-widest">FEED DE CÁMARA</span>
                     
                     {/* Overlay de esqueleto de manos simulado */}
                     <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-green-400 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                     </div>
                  </div>
               </Card>
            </div>

            {/* Columna Derecha: Resultados */}
            <div className="lg:col-span-1 h-full flex flex-col gap-4">
               <Card className="flex-1 border-none shadow-lg bg-white overflow-hidden flex flex-col">
                  <CardBody className="p-6 flex flex-col h-full justify-center">
                     <div className="text-center mb-8">
                        <div className="inline-block px-4 py-1.5 bg-[var(--color-accent-100)] text-[var(--color-accent-700)] rounded-full text-xs font-black uppercase tracking-widest mb-4 animate-pulse">
                           Reconociendo...
                        </div>
                        <p className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Detectado</p>
                        <h3 className="text-3xl font-black text-[var(--color-text-primary)]">{mockRecognizedSign}</h3>
                     </div>

                     <div className="w-full mt-auto">
                        <p className="text-center text-sm font-bold text-[var(--color-text-secondary)] mb-3">Confianza</p>
                        <div className="relative w-32 h-32 mx-auto">
                           {/* Círculo de confianza */}
                           <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                             <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-neutral-100)" strokeWidth="10" />
                             <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-success-500)" strokeWidth="10" strokeDasharray="283" strokeDashoffset={283 - (283 * mockConfidence) / 100} className="transition-all duration-1000" />
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-black text-[var(--color-success-700)]">{mockConfidence}%</span>
                           </div>
                        </div>
                     </div>
                  </CardBody>
               </Card>
            </div>

          </div>
        </div>
      </div>

      {/* Modal de Finalización */}
      {showModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)]" />
               <div className="relative z-10">
                  <div className="w-24 h-24 bg-white rounded-full mx-auto shadow-lg flex items-center justify-center mb-6">
                     <span className="text-4xl">🎉</span>
                  </div>
                  <h2 className="text-2xl font-black text-[var(--color-text-primary)] mb-2">¡Práctica Completada!</h2>
                  <p className="text-[var(--color-text-secondary)] font-medium mb-8">Has finalizado las 10 señas de hoy.</p>
                  
                  <div className="mb-8">
                     <div className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Aciertos</div>
                     <div className="text-5xl font-black text-[var(--color-primary-600)]">80%</div>
                  </div>

                  <div className="flex flex-col gap-3">
                     <Button className="w-full py-4 text-base font-bold bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-xl flex justify-center items-center gap-2" onClick={() => setShowModal(false)}>
                        <RefreshCw size={18} /> Intentar de nuevo
                     </Button>
                     <Button variant="ghost" className="w-full py-4 text-base font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)] rounded-xl flex justify-center items-center gap-2 border-2 border-[var(--color-neutral-200)]" onClick={() => setShowModal(false)}>
                        <BarChart2 size={18} /> Ver progreso
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}