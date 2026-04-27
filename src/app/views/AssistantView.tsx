import { useState } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { LoadingState } from '../components/lsc/LoadingState';
import { Camera, CameraOff, Hand, Languages, Video, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLSCRecognition } from '../../hooks/useLSCRecognition';

interface AssistantViewProps {
  onNavigateHome?: () => void;
}

export function AssistantView({ onNavigateHome }: AssistantViewProps = {}) {
  const [mode, setMode] = useState<'translator' | 'recognition'>('translator');
  const [translatorInput, setTranslatorInput] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  const {
    state: recState,
    videoRef,
    canvasRef,
    startRecognition,
    stopRecognition,
  } = useLSCRecognition();

  const handleTranslate = () => {
    const connectors = ['el', 'la', 'los', 'las', 'de', 'del', 'y', 'o', 'a', 'en', 'con', 'por', 'para', 'un', 'una'];
    const result = translatorInput.toLowerCase().split(/\s+/)
      .filter(word => !connectors.includes(word.replace(/[.,!?;:]/g, '')))
      .join(' ').toUpperCase();
    setTranslatedText(result);
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden bg-[var(--color-neutral-50)]">
      {/* Header y Tabs */}
      <div className="flex-shrink-0 p-4 border-b bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Asistente Manos Abiertas</h1>
            {mode === 'recognition' && recState.isActive && (
              <Badge variant="success" className="animate-pulse flex gap-1 items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div> Cámara Activa
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2 bg-[var(--color-neutral-100)] p-1 rounded-xl">
            <button 
              onClick={() => { stopRecognition(); setMode('translator'); }}
              className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${mode === 'translator' ? 'bg-white shadow text-[var(--color-primary-600)]' : 'text-neutral-500'}`}
            >
              <Languages size={18} /> Traductor
            </button>
            <button 
              onClick={() => setMode('recognition')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${mode === 'recognition' ? 'bg-white shadow text-[var(--color-primary-600)]' : 'text-neutral-500'}`}
            >
              <Video size={18} /> Reconocimiento LSC
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {mode === 'translator' ? (
            <motion.div key="trans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto space-y-6">
              <Card>
                <CardBody className="space-y-4">
                  <label className="text-sm font-bold text-neutral-600 uppercase">Texto en Español:</label>
                  <textarea
                    value={translatorInput}
                    onChange={(e) => setTranslatorInput(e.target.value)}
                    placeholder="Ej: Hola, ¿cómo estás el día de hoy?"
                    className="w-full h-32 p-4 border-2 rounded-2xl focus:border-[var(--color-primary-500)] outline-none resize-none text-lg transition-colors"
                  />
                  <Button onClick={handleTranslate} className="w-full py-6 text-lg" disabled={!translatorInput}>
                    <Send size={18} className="mr-2" /> Traducir a glosa LSC
                  </Button>
                </CardBody>
              </Card>
              {translatedText && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Card className="bg-[var(--color-primary-50)] border-[var(--color-primary-200)] border-2">
                    <CardBody>
                      <p className="text-xs font-bold text-[var(--color-primary-600)] uppercase mb-2">Estructura para Persona Sorda:</p>
                      <p className="text-3xl font-black text-[var(--color-primary-900)] leading-tight tracking-tight">{translatedText}</p>
                    </CardBody>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="rec" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna Cámara */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative aspect-video bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  
                  {/* SOLUCIÓN: El video ahora NO es hidden, solo es transparente y está detrás */}
                  <video 
                    ref={videoRef} 
                    className="absolute opacity-0 pointer-events-none" 
                    playsInline 
                    muted 
                  />
                  
                  {/* El Canvas es el que mostrará todo */}
                  <canvas ref={canvasRef} className="w-full h-full object-cover" />
                  
                  {!recState.isActive && !recState.isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 text-white p-6 text-center">
                      <Camera size={48} className="mb-4 opacity-20" />
                      <p className="mb-6 font-medium text-lg">Selecciona una categoría para iniciar</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {['Abecedario', 'Colores', 'Saludos', 'Diseño', 'Oficina'].map(cat => (
                          <Button 
                            key={cat} 
                            variant="outline" 
                            size="lg" 
                            onClick={() => startRecognition(cat)} 
                            className="bg-white/10 hover:bg-white hover:text-black border-white/20 px-8 py-6 text-lg font-bold"
                          >
                            {cat}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recState.isLoading && (
                    <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center">
                       <LoadingState title="Cargando Inteligencia Artificial" description="Sincronizando modelo desde Hugging Face..." />
                    </div>
                  )}
                </div>

                {recState.isActive && (
                  <Button variant="error" onClick={stopRecognition} className="w-full py-6 rounded-2xl text-lg font-bold">
                    <CameraOff size={20} className="mr-2" /> Finalizar Interpretación
                  </Button>
                )}
              </div>

              {/* Columna Resultados */}
              <div className="space-y-4">
                <Card className="h-full border-2 border-neutral-100">
                  <CardBody>
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-neutral-700">
                      <Sparkles size={18} className="text-amber-500" /> Interpretación LSC
                    </h3>
                    
                    <div className="text-center py-12 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200 mb-6">
                      {recState.currentSign ? (
                        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                          <span className="text-[10px] text-neutral-400 block uppercase font-black tracking-widest mb-1">Resultado:</span>
                          <span className="text-6xl font-black text-[var(--color-primary-600)] block mb-3">
                            {recState.currentSign.sign}
                          </span>
                          <Badge variant="primary" className="px-4 py-1">Seguridad: {Math.round(recState.currentSign.confidence * 100)}%</Badge>
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center opacity-40 px-6">
                           <Hand size={40} className="mb-2 text-neutral-400" />
                           <p className="text-sm font-medium">Mueve tus manos frente a la cámara</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase mb-3 tracking-widest">Historial reciente</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {recState.recognizedSigns.length > 0 ? (
                          recState.recognizedSigns.slice(0, 8).map((s, i) => (
                            <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} key={i} className="flex justify-between items-center p-3 bg-white border border-neutral-100 rounded-xl shadow-sm">
                              <span className="font-bold text-neutral-700">{s.sign}</span>
                              <span className="text-[9px] font-bold text-neutral-400 bg-neutral-50 px-2 py-1 rounded-md uppercase">
                                {new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                              </span>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-center text-xs text-neutral-300 py-4 italic">No hay registros aún</p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
