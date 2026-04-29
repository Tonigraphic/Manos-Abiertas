import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { LoadingState } from '../components/lsc/LoadingState';
import { Camera, CameraOff, Hand, Video, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useLSCRecognition } from '../../hooks/useLSCRecognition';
import { InstructionsModal } from '../components/lsc/InstructionsModal';

interface AssistantViewProps {
  onNavigateHome?: () => void;
}

export function AssistantView({ onNavigateHome }: AssistantViewProps = {}) {
  const {
    state: recState,
    videoRef,
    canvasRef,
    startRecognition,
    stopRecognition,
  } = useLSCRecognition();

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden bg-[var(--color-neutral-50)] relative">
      <InstructionsModal 
        id="assistant"
        title="Asistente LSC en Tiempo Real"
        instructions={[
          "Este módulo utiliza la cámara de tu dispositivo para reconocer señas en tiempo real.",
          "Para empezar, selecciona una categoría (ej. Abecedario o Colores).",
          "Ubica tus manos frente a la cámara dentro del encuadre para que la IA las detecte.",
          "La detección solo se activará cuando tus manos sean visibles en la pantalla."
        ]}
      />

      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-white shadow-sm z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600">
               <Video size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-800">Reconocimiento LSC</h1>
              <p className="text-xs text-neutral-500 font-medium">Asistente por Inteligencia Artificial</p>
            </div>
          </div>
          {recState.isActive && (
            <Badge variant="success" className="animate-pulse flex gap-2 items-center px-4 py-1.5 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div> Cámara Activa
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-10">
          
          {/* ÁREA DE CÁMARA */}
          <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
            <div className="relative flex-1 bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white group min-h-[300px]">
              
              {/* VIDEO */}
              <video 
                ref={videoRef} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${recState.isActive ? 'opacity-100' : 'opacity-0'}`} 
                style={{ transform: 'scaleX(-1)' }}
                playsInline 
                muted 
              />
              
              {/* CANVAS */}
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
                style={{ transform: 'scaleX(-1)' }} 
              />
              
              {/* Overlay de Inicio */}
              {!recState.isActive && !recState.isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-800/90 to-neutral-900/95 text-white p-6 text-center z-20 backdrop-blur-sm">
                  <Camera size={48} className="mb-4 text-white/30" />
                  <p className="mb-8 font-medium text-lg">Selecciona un vocabulario para iniciar</p>
                  <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
                    {['Abecedario', 'Colores', 'Saludos', 'Diseño', 'Oficina'].map(cat => (
                      <Button 
                        key={cat} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => startRecognition(cat)} 
                        className="bg-white/10 hover:bg-white hover:text-black border-white/20 px-6 py-4 font-bold transition-all shadow-lg hover:scale-105"
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {recState.isLoading && (
                <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md flex items-center justify-center z-30">
                    <LoadingState title="Iniciando IA" description="Sincronizando modelos..." />
                </div>
              )}
            </div>

            {recState.isActive && (
              <Button variant="error" onClick={stopRecognition} className="w-full py-5 rounded-2xl text-lg font-bold shadow-lg transition-transform active:scale-95 flex-shrink-0">
                <CameraOff size={20} className="mr-2" /> Finalizar Interpretación
              </Button>
            )}
          </div>

          {/* COLUMNA RESULTADOS */}
          <div className="h-full">
            <Card className="h-full border-2 border-neutral-100 shadow-sm flex flex-col">
              <CardBody className="flex flex-col h-full p-6">
                <h3 className="font-bold mb-6 flex items-center gap-2 text-neutral-800">
                  <Sparkles size={20} className="text-amber-500" /> Resultados IA
                </h3>
                
                <div className="text-center py-12 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200 mb-6 flex-shrink-0 flex flex-col items-center justify-center transition-colors">
                  {recState.currentSign ? (
                    <motion.div initial={{ y: 10, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }}>
                      <span className="text-[10px] text-neutral-400 block uppercase font-black tracking-widest mb-2">Seña Detectada:</span>
                      <span className="text-6xl font-black text-purple-600 block mb-4 uppercase tracking-tighter drop-shadow-sm">
                        {recState.currentSign.sign}
                      </span>
                      <Badge className="bg-purple-100 text-purple-700 px-3 py-1">Seguridad: {Math.round(recState.currentSign.confidence * 100)}%</Badge>
                    </motion.div>
                  ) : (
                    <div className="opacity-40 flex flex-col items-center">
                        <Hand size={48} className="mb-4 text-neutral-500 animate-pulse" />
                        <p className="text-sm font-bold uppercase tracking-widest text-center px-6">Mueve tus manos frente a la cámara</p>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <p className="text-[10px] font-black text-neutral-400 uppercase mb-4 tracking-widest border-b pb-2 flex-shrink-0">Historial Reciente</p>
                  <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {recState.recognizedSigns.length > 0 ? (
                      recState.recognizedSigns.slice(0, 10).map((s, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          key={i} 
                          className="flex justify-between items-center p-3.5 bg-white border border-neutral-100 rounded-xl shadow-sm"
                        >
                          <span className="font-bold text-neutral-700 uppercase">{s.sign}</span>
                          <span className="text-[10px] font-bold text-neutral-400 bg-neutral-50 px-2 py-1 rounded-md uppercase">
                            {new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </motion.div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-center text-sm text-neutral-400 italic">Esperando detecciones...</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
