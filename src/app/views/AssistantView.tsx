import { useState } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { LoadingState, ErrorState } from '../components/lsc/LoadingState';
import { Camera, CameraOff, Hand, Languages, Video, X, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLSCRecognition } from '../../hooks/useLSCRecognition';

interface AssistantViewProps {
  onNavigateHome?: () => void;
}

export function AssistantView({ onNavigateHome }: AssistantViewProps = {}) {
  const [mode, setMode] = useState<'translator' | 'recognition'>('translator');
  const [translatorInput, setTranslatorInput] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('alphabet');

  const {
    state: recState,
    videoRef,
    canvasRef,
    startRecognition,
    stopRecognition,
    clearHistory,
  } = useLSCRecognition();

  // Traductor simple (elimina conectores)
  const handleTranslate = () => {
    const connectors = ['el', 'la', 'los', 'las', 'de', 'del', 'y', 'o', 'a', 'en', 'con', 'por', 'para'];
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
            <h1 className="text-xl font-bold">Asistente Manos Abiertas</h1>
            {mode === 'recognition' && recState.isActive && (
              <Badge variant="success" className="animate-pulse">Cámara Activa</Badge>
            )}
          </div>
          
          <div className="flex gap-2 bg-[var(--color-neutral-100)] p-1 rounded-xl">
            <button 
              onClick={() => { stopRecognition(); setMode('translator'); }}
              className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${mode === 'translator' ? 'bg-white shadow text-[var(--color-primary-600)]' : ''}`}
            >
              <Languages size={18} /> Traductor
            </button>
            <button 
              onClick={() => setMode('recognition')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${mode === 'recognition' ? 'bg-white shadow text-[var(--color-primary-600)]' : ''}`}
            >
              <Video size={18} /> Reconocimiento
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {mode === 'translator' ? (
            <motion.div key="trans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
              <Card>
                <CardBody className="space-y-4">
                  <textarea
                    value={translatorInput}
                    onChange={(e) => setTranslatorInput(e.target.value)}
                    placeholder="Escribe en español..."
                    className="w-full h-32 p-4 border-2 rounded-2xl focus:border-[var(--color-primary-500)] outline-none resize-none text-lg"
                  />
                  <Button onClick={handleTranslate} className="w-full" disabled={!translatorInput}>
                    <Send size={18} className="mr-2" /> Traducir a glosa LSC
                  </Button>
                </CardBody>
              </Card>
              {translatedText && (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                  <Card className="bg-[var(--color-primary-50)] border-[var(--color-primary-200)]">
                    <CardBody>
                      <p className="text-xs font-bold text-[var(--color-primary-600)] uppercase mb-2">Resultado LSC:</p>
                      <p className="text-2xl font-black text-[var(--color-primary-900)] leading-tight">{translatedText}</p>
                    </CardBody>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna Cámara */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  {/* VIDEO REAL (Invisible pero procesando) */}
                  <video ref={videoRef} className="hidden" playsInline muted />
                  
                  {/* CANVAS (Donde se dibuja el video + puntos) */}
                  <canvas ref={canvasRef} className="w-full h-full object-cover bg-neutral-900" />
                  
                  {!recState.isActive && !recState.isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 text-white p-6 text-center">
                      <Camera size={48} className="mb-4 opacity-20" />
                      <p className="mb-6 opacity-70">Selecciona una categoría para activar la IA</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {['alphabet', 'colors', 'greetings', 'design', 'office'].map(cat => (
                          <Button key={cat} variant="outline" size="sm" onClick={() => startRecognition(cat as any)}>
                            {cat}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recState.isLoading && <LoadingState title="Cargando IA..." description="Descargando modelo desde Hugging Face" />}
                </div>

                <div className="flex gap-4">
                  {recState.isActive && (
                    <Button variant="error" onClick={stopRecognition} className="flex-1">
                      <CameraOff size={18} className="mr-2" /> Detener Cámara
                    </Button>
                  )}
                </div>
              </div>

              {/* Columna Resultados */}
              <div className="space-y-4">
                <Card className="h-full">
                  <CardBody>
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-500" /> 
                      Detección en tiempo real
                    </h3>
                    
                    <div className="text-center py-10 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
                      {recState.currentSign ? (
                        <motion.div initial={{ y: 10 }} animate={{ y: 0 }}>
                          <span className="text-sm text-neutral-500 block uppercase font-bold">Seña detectada:</span>
                          <span className="text-5xl font-black text-[var(--color-primary-600)] block my-2">
                            {recState.currentSign.sign}
                          </span>
                          <Badge variant="primary">Confianza: {Math.round(recState.currentSign.confidence * 100)}%</Badge>
                        </motion.div>
                      ) : (
                        <p className="text-neutral-400 px-4">Mueve tus manos frente a la cámara para traducir</p>
                      )}
                    </div>

                    <div className="mt-6">
                      <p className="text-xs font-bold text-neutral-400 uppercase mb-3">Historial reciente</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {recState.recognizedSigns.slice(0, 5).map((s, i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-white border rounded-lg text-sm">
                            <span className="font-bold">{s.sign}</span>
                            <span className="text-[10px] text-neutral-400">{new Date(s.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
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
