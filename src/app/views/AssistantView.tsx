import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { LoadingState, EmptyState, ErrorState } from '../components/lsc/LoadingState';
import { BackToHome } from '../components/lsc/BackToHome';
import { Camera, CameraOff, CheckCircle, AlertCircle, Hand, Languages, Video, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLSCRecognition } from '../../hooks/useLSCRecognition';

type AssistantMode = 'translator' | 'recognition';
type AssistantState = 'idle' | 'loading' | 'active' | 'error';

interface AssistantViewProps {
  onNavigateHome?: () => void;
}

export function AssistantView({ onNavigateHome }: AssistantViewProps = {}) {
  const [mode, setMode] = useState<AssistantMode>('translator');
  const [translatorInput, setTranslatorInput] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  const {
    state: recognitionState,
    videoRef,
    canvasRef,
    startRecognition,
    stopRecognition,
    clearHistory,
  } = useLSCRecognition();

  const [showVideo, setShowVideo] = useState(true);

  const handleStart = async () => {
    await startRecognition();
  };

  const handleStop = () => {
    stopRecognition();
  };

  const handleClearHistory = () => {
    clearHistory();
  };

  // Translator function - removes connectors from Spanish text
  const translateToDeafSpanish = (text: string): string => {
    const connectors = [
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
      'de', 'del', 'al', 'en', 'con', 'por', 'para', 'sin',
      'y', 'o', 'pero', 'que', 'como', 'si', 'porque',
      'a', 'ante', 'bajo', 'desde', 'durante', 'entre', 'hacia', 'hasta',
      'mediante', 'según', 'sobre', 'tras'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const filtered = words.filter(word => {
      const cleanWord = word.replace(/[.,!?;:]/g, '');
      return !connectors.includes(cleanWord) && cleanWord.length > 0;
    });

    return filtered.join(' ').toUpperCase();
  };

  const handleTranslate = () => {
    if (translatorInput.trim()) {
      const result = translateToDeafSpanish(translatorInput);
      setTranslatedText(result);
    }
  };

  const handleClearTranslator = () => {
    setTranslatorInput('');
    setTranslatedText('');
  };

  // Format recognized signs for display
  const displaySigns = recognitionState.recognizedSigns.map((item) => ({
    sign: item.sign,
    confidence: Math.round(item.confidence * 100),
    time: new Date(item.timestamp).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
  }));

  const isActive = recognitionState.isActive;
  const isLoading = recognitionState.isLoading;
  const error = recognitionState.error;

  return (
    <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
      {/* Header compacto */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-[var(--color-neutral-200)] bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Asistente Manos Abiertas</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">Facilita la comunicación en LSC</p>
            </div>
            {mode === 'recognition' && recognitionState.handsDetected > 0 && (
              <Badge variant="success" className="gap-1">
                <Hand size={14} />
                {recognitionState.handsDetected} {recognitionState.handsDetected === 1 ? 'mano' : 'manos'}
              </Badge>
            )}
          </div>

          {/* Mode Tabs - Estilo Duolingo */}
          <div className="flex gap-2 bg-[var(--color-neutral-100)] p-1 rounded-xl">
            <button
              onClick={() => setMode('translator')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
                ${mode === 'translator'
                  ? 'bg-white text-[var(--color-primary-600)] shadow-md'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }
              `}
            >
              <Languages size={18} />
              Traductor
              <Badge variant="primary" className="ml-1">Principal</Badge>
            </button>
            <button
              onClick={() => setMode('recognition')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
                ${mode === 'recognition'
                  ? 'bg-white text-[var(--color-primary-600)] shadow-md'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }
              `}
            >
              <Video size={18} />
              Reconocimiento LSC
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Sin scroll, todo visible */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === 'translator' && (
            <motion.div
              key="translator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex items-center justify-center p-4 sm:p-6"
            >
              <div className="w-full max-w-4xl">
                <Card className="shadow-xl">
                  <CardBody className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-accent-500)] rounded-xl flex items-center justify-center">
                        <Languages size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Traductor Español → LSC</h2>
                        <p className="text-sm text-[var(--color-text-secondary)]">Elimina conectores para facilitar tu comprensión LSC</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Input */}
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                          Español para oyentes
                        </label>
                        <textarea
                          value={translatorInput}
                          onChange={(e) => setTranslatorInput(e.target.value)}
                          placeholder="Escribe aquí el texto que deseas traducir..."
                          className="w-full h-32 px-4 py-3 border-2 border-[var(--color-neutral-300)] rounded-xl focus:border-[var(--color-primary-500)] focus:outline-none resize-none text-[var(--color-text-primary)] text-lg"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleTranslate();
                            }
                          }}
                        />
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                          {translatorInput.length} caracteres • Presiona Ctrl + Enter para traducir
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center">
                        <motion.div
                          animate={{ y: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-10 h-10 bg-[var(--color-primary-100)] rounded-full flex items-center justify-center"
                        >
                          <ArrowRight size={20} className="text-[var(--color-primary-600)] rotate-90" />
                        </motion.div>
                      </div>

                      {/* Output */}
                      <div>
                        <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                          Español adaptado para LSC (sin conectores)
                        </label>
                        <div className="w-full min-h-32 px-4 py-3 bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-accent-50)] rounded-xl border-2 border-[var(--color-primary-200)]">
                          {translatedText ? (
                            <p className="text-2xl font-bold text-[var(--color-primary-700)] tracking-wide">
                              {translatedText}
                            </p>
                          ) : (
                            <p className="text-[var(--color-text-tertiary)] italic">
                              La traducción aparecerá aquí...
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleTranslate}
                          disabled={!translatorInput.trim()}
                          className="flex-1"
                          rightIcon={<Sparkles size={18} />}
                        >
                          Traducir
                        </Button>
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={handleClearTranslator}
                          disabled={!translatorInput && !translatedText}
                        >
                          Limpiar
                        </Button>
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="mt-6 p-4 bg-[var(--color-neutral-50)] rounded-lg border border-[var(--color-neutral-200)]">
                      <h4 className="font-semibold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                        <Sparkles size={16} className="text-[var(--color-accent-500)]" />
                        ¿Cómo funciona?
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        El traductor elimina conectores y artículos del español oyente, generando una estructura
                        más cercana a la comunicación de personas sordas usuarias de LSC.
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </motion.div>
          )}

          {mode === 'recognition' && (
            <motion.div
              key="recognition"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full p-4 sm:p-6 overflow-auto"
            >
              <div className="max-w-5xl mx-auto h-full flex flex-col">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
                  {/* Camera Section */}
                  <div className="lg:col-span-2">
                    <Card className="h-full overflow-hidden">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-[var(--color-text-primary)]">Cámara</h3>
                          <div className="flex gap-2">
                            {!isActive ? (
                              <Button
                                variant="primary"
                                leftIcon={<Camera size={18} />}
                                onClick={handleStart}
                                disabled={isLoading}
                                isLoading={isLoading}
                              >
                                Iniciar
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                leftIcon={<CameraOff size={18} />}
                                onClick={handleStop}
                              >
                                Detener
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody className="p-0">
                        <div className="aspect-video bg-gradient-to-br from-[var(--color-neutral-100)] to-[var(--color-neutral-200)] flex items-center justify-center relative overflow-hidden">
                          {!isActive && !isLoading && !error && (
                            <EmptyState
                              icon={<Camera size={40} />}
                              title="Cámara desactivada"
                              description="Presiona 'Iniciar' para comenzar ahora"
                            />
                          )}

                          {isLoading && <LoadingState message="Iniciando cámara y modelo de IA..." />}
                          {error && <ErrorState title="Error al acceder a la cámara" description={error} onRetry={handleStart} />}

                          {isActive && (
                            <>
                              <video ref={videoRef} className="hidden" playsInline />
                              <canvas ref={canvasRef} className="w-full h-full object-contain" />

                              {recognitionState.currentSign && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute top-4 left-4 px-4 py-2 bg-white/95 backdrop-blur rounded-lg shadow-lg border-2 border-[var(--color-primary-500)]"
                                >
                                  <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Detectado:</p>
                                  <p className="text-xl font-bold text-[var(--color-primary-600)]">
                                    {recognitionState.currentSign.sign}
                                  </p>
                                  <p className="text-xs text-[var(--color-text-secondary)]">
                                    Confianza: {Math.round(recognitionState.currentSign.confidence * 100)}%
                                  </p>
                                </motion.div>
                              )}

                              <div className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur rounded-lg shadow-lg">
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">🎥 Reconociendo señas...</p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  {/* Recognition History */}
                  <div className="flex flex-col gap-4">
                    <Card className="flex-1 flex flex-col">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-[var(--color-text-primary)]">Señas Reconocidas</h3>
                          {displaySigns.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                              Limpiar
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardBody className="flex-1 overflow-auto">
                        {displaySigns.length === 0 ? (
                          <EmptyState
                            icon={<AlertCircle size={32} />}
                            title="Sin reconocimientos"
                            description="Las señas detectadas aparecerán aquí"
                          />
                        ) : (
                          <div className="space-y-2">
                            {displaySigns.slice(0, 5).map((item, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-2 bg-[var(--color-neutral-50)] rounded-lg border border-[var(--color-neutral-200)]"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle size={16} className="text-[var(--color-success-500)]" />
                                  <div>
                                    <p className="font-semibold text-sm text-[var(--color-text-primary)]">{item.sign}</p>
                                    <p className="text-xs text-[var(--color-text-tertiary)]">{item.time}</p>
                                  </div>
                                </div>
                                <Badge variant={item.confidence >= 95 ? 'success' : item.confidence >= 85 ? 'primary' : 'warning'} className="text-xs">
                                  {item.confidence}%
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-accent-50)] border-0">
                      <CardBody className="p-4">
                        <h4 className="font-semibold text-sm text-[var(--color-text-primary)] mb-2">💡 Consejos</h4>
                        <ul className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                          <li>• Buena iluminación</li>
                          <li>• Manos visibles</li>
                          <li>• Señas claras</li>
                        </ul>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}