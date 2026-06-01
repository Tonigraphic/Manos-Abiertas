import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { Input } from '../components/lsc/Input';
import { Camera, CameraOff, RefreshCw, BarChart2, Target, Trophy, PlayCircle, CheckCircle2, XCircle, ChevronDown, Search, BookOpen, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLSCRecognition } from '../../hooks/useLSCRecognition';
import { signRecognitionService, SignPattern } from '../../services/signRecognitionService';
import { InstructionsModal } from '../components/lsc/InstructionsModal';
import { resolveVideoUrl } from '../../lib/videoUtils';

interface PracticeViewProps {
  onNavigateHome?: () => void;
}

export function PracticeView({ onNavigateHome }: PracticeViewProps = {}) {
   const { state: recState, videoRef, canvasRef, startRecognition, stopRecognition } = useLSCRecognition();
   const [showModal, setShowModal] = useState(false);
   const [isPracticeStarted, setIsPracticeStarted] = useState(false);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [correctAnswers, setCorrectAnswers] = useState(0);
   const [attempts, setAttempts] = useState(0);
   const [statusMessage, setStatusMessage] = useState('Presiona iniciar para activar la cámara y comenzar la práctica.');
   const [isCompleting, setIsCompleting] = useState(false);
   const [isAdvancing, setIsAdvancing] = useState(false);
   const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
   const [selectedCatalogCategory, setSelectedCatalogCategory] = useState('all');
   const [selectedCatalogSign, setSelectedCatalogSign] = useState<SignPattern | null>(null);

   const processedRecognitionRef = useRef<string>('');
   const lastNonMatchRef = useRef<string>('');
   const awaitingResetRef = useRef(false);
   const completionTimerRef = useRef<number | null>(null);
   const advanceTimerRef = useRef<number | null>(null);
   const handsDownTimerRef = useRef<number | null>(null);
   const noRecognitionTimerRef = useRef<number | null>(null);
   const latestHandsDetectedRef = useRef(0);
   const latestCurrentIndexRef = useRef(0);

   useEffect(() => {
      latestHandsDetectedRef.current = recState.handsDetected;
   }, [recState.handsDetected]);

   useEffect(() => {
      latestCurrentIndexRef.current = currentIndex;
   }, [currentIndex]);

   const allCatalogSigns = useMemo(() => signRecognitionService.getAllSigns(), []);

   const catalogCategoryCounts = useMemo(() => {
      return allCatalogSigns.reduce((acc, sign) => {
         acc[sign.category] = (acc[sign.category] || 0) + 1;
         return acc;
      }, {} as Record<string, number>);
   }, [allCatalogSigns]);

   const practiceSigns = useMemo(() => {
      const allSigns = signRecognitionService.getAllSigns();
      // Limitar la práctica al último modelo de colores (5 señas entrenadas)
      const allowed = new Set(['AMARILLO', 'AZUL', 'BLANCO', 'NEGRO', 'ROJO']);
      return allSigns
         .filter(sign => sign.category === 'colors' && allowed.has((sign.name || sign.label || '').toUpperCase()))
         // Mantener orden predecible según 'allowed' si hace falta
         .sort((a, b) => {
            const order = ['AMARILLO', 'AZUL', 'BLANCO', 'NEGRO', 'ROJO'];
            const an = (a.name || a.label || '').toUpperCase();
            const bn = (b.name || b.label || '').toUpperCase();
            return order.indexOf(an) - order.indexOf(bn);
         });
   }, []);

   const currentSign = practiceSigns[currentIndex] ?? null;

   const currentModelCategory = 'Colores';

   const getCategoryLabel = (category: string) => {
      const labels: Record<string, string> = {
         all: 'Todas',
         alphabet: 'Abecedario',
         colors: 'Colores',
         greetings: 'Saludos',
         office: 'Oficina',
         design: 'Diseño',
      };

      return labels[category] || category;
   };

   const getCategoryEmoji = (category: string) => {
      switch (category) {
         case 'colors': return '🎨';
         case 'alphabet': return '🔤';
         case 'greetings': return '👋';
         case 'office': return '🏢';
         case 'design': return '✏️';
         default: return '🤟';
      }
   };

   const catalogCategories = [
      { id: 'all', label: 'Todas', count: allCatalogSigns.length, emoji: '📚' },
      { id: 'colors', label: 'Colores', count: catalogCategoryCounts['colors'] || 0, emoji: '🎨' },
      { id: 'alphabet', label: 'Abecedario', count: catalogCategoryCounts['alphabet'] || 0, emoji: '🔤' },
      { id: 'greetings', label: 'Saludos', count: catalogCategoryCounts['greetings'] || 0, emoji: '👋' },
      { id: 'office', label: 'Oficina', count: catalogCategoryCounts['office'] || 0, emoji: '🏢' },
      { id: 'design', label: 'Diseño', count: catalogCategoryCounts['design'] || 0, emoji: '✏️' },
   ];

   const normalizeSign = (value: string) => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

   const filteredCatalogSigns = useMemo(() => {
      const normalizedSearch = normalizeSign(catalogSearchTerm);

      return allCatalogSigns.filter(sign => {
         const matchesSearch = !normalizedSearch || normalizeSign(sign.name).includes(normalizedSearch);
         const matchesCategory = selectedCatalogCategory === 'all' || sign.category === selectedCatalogCategory;
         return matchesSearch && matchesCategory;
      });
   }, [allCatalogSigns, catalogSearchTerm, selectedCatalogCategory]);

   const accuracy = attempts > 0 ? Math.round((correctAnswers / attempts) * 100) : 0;
   const progress = practiceSigns.length ? Math.round((currentIndex / practiceSigns.length) * 100) : 0;

   const finishPractice = () => {
      if (completionTimerRef.current) {
         window.clearTimeout(completionTimerRef.current);
         completionTimerRef.current = null;
      }
      if (advanceTimerRef.current) {
         window.clearTimeout(advanceTimerRef.current);
         advanceTimerRef.current = null;
      }
      if (handsDownTimerRef.current) {
         window.clearTimeout(handsDownTimerRef.current);
         handsDownTimerRef.current = null;
      }
      if (noRecognitionTimerRef.current) {
         window.clearTimeout(noRecognitionTimerRef.current);
         noRecognitionTimerRef.current = null;
      }
      awaitingResetRef.current = false;
      stopRecognition();
      setIsPracticeStarted(false);
      setIsCompleting(true);
      setIsAdvancing(false);
      setShowModal(true);
   };

   const advanceTarget = () => {
      if (currentIndex >= practiceSigns.length - 1) {
         finishPractice();
         return;
      }

      setCurrentIndex(prev => prev + 1);
      processedRecognitionRef.current = '';
      setStatusMessage('Siguiente seña cargada.');
   };

   const handleStartPractice = async () => {
      if (!practiceSigns.length) {
         setStatusMessage('No hay señas disponibles para practicar.');
         return;
      }

      setShowModal(false);
      setIsCompleting(false);
      setIsAdvancing(false);
      setCurrentIndex(0);
      setCorrectAnswers(0);
      setAttempts(0);
      setStatusMessage('Iniciando cámara y modelo de reconocimiento...');
      processedRecognitionRef.current = '';
      awaitingResetRef.current = false;

      try {
         await startRecognition(currentModelCategory);
         setIsPracticeStarted(true);
         setStatusMessage(`Práctica activa. Realiza la seña ${practiceSigns[0].name}.`);
      } catch (error) {
         setStatusMessage('No fue posible iniciar la cámara o el modelo.');
         console.error(error);
      }
   };

   const handleStopPractice = () => {
      if (completionTimerRef.current) {
         window.clearTimeout(completionTimerRef.current);
         completionTimerRef.current = null;
      }
      if (advanceTimerRef.current) {
         window.clearTimeout(advanceTimerRef.current);
         advanceTimerRef.current = null;
      }
      if (handsDownTimerRef.current) {
         window.clearTimeout(handsDownTimerRef.current);
         handsDownTimerRef.current = null;
      }
      if (noRecognitionTimerRef.current) {
         window.clearTimeout(noRecognitionTimerRef.current);
         noRecognitionTimerRef.current = null;
      }
      awaitingResetRef.current = false;
      stopRecognition();
      setIsPracticeStarted(false);
      setStatusMessage('La práctica se ha detenido.');
   };

   const handleSkipTarget = () => {
      setAttempts(prev => prev + 1);
      setStatusMessage(`Seña omitida: ${currentSign?.name ?? 'sin seña'} `);
      advanceTarget();
   };

   useEffect(() => {
      return () => {
         if (completionTimerRef.current) {
            window.clearTimeout(completionTimerRef.current);
         }
         if (advanceTimerRef.current) {
            window.clearTimeout(advanceTimerRef.current);
         }
         if (handsDownTimerRef.current) {
            window.clearTimeout(handsDownTimerRef.current);
         }
         if (noRecognitionTimerRef.current) {
            window.clearTimeout(noRecognitionTimerRef.current);
         }
         awaitingResetRef.current = false;
         stopRecognition();
      };
   }, [stopRecognition]);

   useEffect(() => {
      if (!isPracticeStarted || isCompleting || !currentSign) return;

      if (awaitingResetRef.current) {
         const recognitionCleared = recState.currentSign === null;

         if (recognitionCleared) {
            if (!noRecognitionTimerRef.current) {
               setStatusMessage(`Correcto: ${currentSign.name}. Baja las manos para cargar la siguiente seña.`);
               noRecognitionTimerRef.current = window.setTimeout(() => {
                  noRecognitionTimerRef.current = null;
                  if (!awaitingResetRef.current || !isPracticeStarted || isCompleting) return;
                  if (recState.currentSign !== null) return;

                  awaitingResetRef.current = false;
                  setIsAdvancing(false);
                  if (latestCurrentIndexRef.current >= practiceSigns.length - 1) {
                     finishPractice();
                     return;
                  }

                  setCurrentIndex(prev => prev + 1);
                  processedRecognitionRef.current = '';
                  lastNonMatchRef.current = '';
                  const nextSign = practiceSigns[latestCurrentIndexRef.current + 1]?.name ?? 'la siguiente seña';
                  setStatusMessage(`Buen trabajo. Ahora intenta con ${nextSign}.`);
               }, 900);
            }
         } else if (noRecognitionTimerRef.current) {
            window.clearTimeout(noRecognitionTimerRef.current);
            noRecognitionTimerRef.current = null;
         }

         if (recState.handsDetected === 0) {
            if (!handsDownTimerRef.current) {
               handsDownTimerRef.current = window.setTimeout(() => {
                  handsDownTimerRef.current = null;
               }, 250);
            }
         } else if (handsDownTimerRef.current) {
            window.clearTimeout(handsDownTimerRef.current);
            handsDownTimerRef.current = null;
         }

         return;
      }

      if (recState.handsDetected === 0) {
         processedRecognitionRef.current = '';
         lastNonMatchRef.current = '';
         setIsAdvancing(false);
         return;
      }

      if (!recState.currentSign) return;

      const detected = normalizeSign(recState.currentSign.sign);
      const target = normalizeSign(currentSign.name);
      const attemptKey = `${currentIndex}:${detected}`;

      if (processedRecognitionRef.current === attemptKey) return;
      processedRecognitionRef.current = attemptKey;

      if (completionTimerRef.current) {
         window.clearTimeout(completionTimerRef.current);
         completionTimerRef.current = null;
      }

      setAttempts(prev => prev + 1);

      if (detected !== target) {
         lastNonMatchRef.current = attemptKey;
         setIsAdvancing(false);
         setStatusMessage(`No coincide con ${currentSign.name}. Intenta nuevamente.`);
         return;
      }

      lastNonMatchRef.current = '';

      setCorrectAnswers(prev => prev + 1);
      setStatusMessage(`Correcto: ${currentSign.name}. Baja las manos para cargar la siguiente seña.`);
      awaitingResetRef.current = true;
      setIsAdvancing(true);
   }, [currentIndex, currentSign, isCompleting, isPracticeStarted, practiceSigns.length, recState.currentSign, recState.handsDetected]);

   const confidence = recState.currentSign ? Math.round(recState.currentSign.confidence * 100) : 0;
   const displayedConfidence = recState.currentSign && currentSign
      ? normalizeSign(recState.currentSign.sign) === normalizeSign(currentSign.name)
         ? confidence
         : 0
      : confidence;
   const recognitionStateLabel = recState.isActive ? 'Reconocimiento activo' : 'Reconocimiento detenido';
   const detectedMatchesTarget = Boolean(
      recState.currentSign && currentSign && normalizeSign(recState.currentSign.sign) === normalizeSign(currentSign.name)
   );
   const displayedDetectionLabel = !recState.isActive
      ? 'Sin detección'
      : isAdvancing
         ? 'Baja las manos para continuar'
      : detectedMatchesTarget
         ? currentSign?.name ?? 'Sin detección'
         : 'Esperando coincidencia con el objetivo';
  
  return (
    <div className="min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)] pb-20 md:pb-0 flex flex-col bg-[var(--color-surface)] relative">
         <InstructionsModal
            id="practice"
            title="Práctica de Colores"
            instructions={[
               'La práctica te mostrará una seña objetivo del vocabulario de colores.',
               'Realiza la seña frente a la cámara y espera la confirmación antes de pasar a la siguiente.',
               'Si bajas las manos, el sistema limpiará la detección y no contará un intento falso.',
               'Usa Omitir solo cuando quieras avanzar manualmente a otro objetivo.'
            ]}
         />
      
      {/* Header */}
      <div className="flex-shrink-0 p-6 sm:p-8 bg-white border-b border-[var(--color-neutral-200)] shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[var(--color-accent-100)] p-3 rounded-2xl text-[var(--color-accent-600)] shadow-inner">
              <Target size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Práctica de Reconocimiento</h1>
                     <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">Reconocimiento en tiempo real con vocabulario de colores</p>
            </div>
          </div>
               <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={handleStopPractice} disabled={!isPracticeStarted}>
                     <CameraOff size={18} className="mr-2" /> Detener
                  </Button>
                  <Button onClick={handleStartPractice} disabled={isPracticeStarted}>
                     <Camera size={18} className="mr-2" /> Iniciar práctica
                  </Button>
               </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto h-full min-h-[500px]">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            
            {/* Columna Izquierda: Instrucción */}
            <div className="lg:col-span-1 h-full flex flex-col gap-4">
                     <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="flex-1"
                     >
                     <Card className="h-full border-none shadow-lg bg-white overflow-hidden flex flex-col">
                        <CardBody className="p-6 flex flex-col h-full items-center text-center">
                           <p className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Seña objetivo</p>
                           <motion.h2
                              key={currentSign?.name ?? 'empty'}
                              initial={{ opacity: 0, scale: 0.92, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ duration: 0.28 }}
                              className={`text-4xl font-black text-[var(--color-primary-600)] mb-3 transition-all duration-300 ${isAdvancing ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}
                           >
                              {currentSign?.name ?? 'Sin ejercicio'}
                           </motion.h2>
                           <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-100)] text-[var(--color-accent-700)] text-xs font-bold uppercase tracking-widest">
                              {currentSign ? getCategoryLabel(currentSign.category) : 'Práctica'}
                           </div>

                           <div className="w-full aspect-square bg-[var(--color-neutral-100)] rounded-2xl border-2 border-dashed border-[var(--color-neutral-300)] flex items-center justify-center mb-6 overflow-hidden">
                              {currentSign?.videoUrl ? (
                                 <video
                                    key={currentSign.videoUrl}
                                    src={resolveVideoUrl(currentSign.videoUrl)}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    controls
                                    className="w-full h-full object-contain bg-black"
                                 />
                              ) : (
                                 <span className="text-[var(--color-neutral-400)] text-sm font-medium">Imagen ilustrativa</span>
                              )}
                           </div>

                           <div className="w-full mt-auto text-left">
                              <div className="flex justify-between text-sm font-bold text-[var(--color-text-secondary)] mb-2">
                                 <span>Progreso</span>
                                 <span>{currentIndex + 1}/{practiceSigns.length || 10}</span>
                              </div>
                              <div className="w-full h-3 bg-[var(--color-neutral-200)] rounded-full overflow-hidden">
                                 <div className="h-full bg-[var(--color-primary-500)] rounded-full transition-all" style={{ width: `${progress}%` }} />
                              </div>
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                 <div className="rounded-xl bg-[var(--color-neutral-50)] p-3 border border-[var(--color-neutral-200)]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">Aciertos</p>
                                    <p className="text-2xl font-black text-[var(--color-primary-600)]">{correctAnswers}</p>
                                 </div>
                                 <div className="rounded-xl bg-[var(--color-neutral-50)] p-3 border border-[var(--color-neutral-200)]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">Intentos</p>
                                    <p className="text-2xl font-black text-[var(--color-text-primary)]">{attempts}</p>
                                 </div>
                              </div>

                              <div className="mt-4 flex gap-2">
                                 <Button variant="ghost" className="flex-1" onClick={handleSkipTarget} disabled={!isPracticeStarted || !currentSign}>
                                    Omitir
                                 </Button>
                              </div>
                           </div>
                        </CardBody>
                     </Card>
                     </motion.div>
            </div>

            {/* Centro: Cámara */}
            <div className="lg:col-span-2 h-full flex flex-col">
                     <Card className="flex-1 border-4 border-[var(--color-primary-100)] shadow-2xl bg-black overflow-hidden relative rounded-3xl">
                        <video
                           ref={videoRef}
                           className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${recState.isActive ? 'opacity-100' : 'opacity-0'}`}
                           style={{ transform: 'scaleX(-1)' }}
                           playsInline
                           muted
                        />

                        <canvas
                           ref={canvasRef}
                           className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                           style={{ transform: 'scaleX(-1)' }}
                        />

                        <AnimatePresence mode="wait">
                           {recState.isActive && (
                              <motion.div
                                 key={isAdvancing ? 'advance' : currentSign?.name ?? 'ready'}
                                 initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                 animate={{ opacity: 1, y: 0, scale: 1 }}
                                 exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                 transition={{ duration: 0.22 }}
                                 className="absolute inset-x-0 top-0 z-30 p-4 pointer-events-none"
                              >
                                 <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md shadow-2xl px-5 py-4 text-white">
                                    <div className="flex items-center justify-between gap-4">
                                       <div className="min-w-0">
                                          <p className="text-[10px] uppercase tracking-[0.35em] text-white/70 font-black mb-1">Objetivo</p>
                                          <div className="text-2xl md:text-3xl font-black text-white truncate">
                                             {currentSign?.name ?? 'Sin ejercicio'}
                                          </div>
                                       </div>
                                       <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest">
                                          <span className={`h-2.5 w-2.5 rounded-full ${isAdvancing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                                          {isAdvancing ? 'Baja las manos' : 'Listo'}
                                       </div>
                                    </div>

                                    <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                                       <motion.div
                                          className={`h-full rounded-full ${isAdvancing ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                          initial={{ width: '0%' }}
                                          animate={{ width: isAdvancing ? '100%' : '38%' }}
                                          transition={{ duration: 0.35 }}
                                       />
                                    </div>

                                    <motion.p
                                       key={statusMessage}
                                       initial={{ opacity: 0, y: 4 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       className="mt-3 text-sm text-white/85 font-medium flex items-center gap-2"
                                    >
                                       <ChevronDown size={16} className={isAdvancing ? 'animate-bounce text-amber-300' : 'text-white/60'} />
                                       {statusMessage}
                                    </motion.p>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>

                        {!recState.isActive && !recState.isLoading && (
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900/90 to-neutral-950/95 text-white p-6 text-center z-20 backdrop-blur-sm">
                              <PlayCircle size={56} className="mb-4 text-white/40" />
                              <h3 className="text-2xl font-black mb-2">Listo para practicar</h3>
                              <p className="text-sm text-white/70 max-w-md mb-6">Activa la cámara para comparar la seña que haces con la seña objetivo del vocabulario disponible.</p>
                              <Button onClick={handleStartPractice} className="bg-white text-black hover:bg-white/90 font-bold">
                                 <Camera size={18} className="mr-2" /> Iniciar práctica
                              </Button>
                           </div>
                        )}

                        {recState.isLoading && (
                           <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md flex items-center justify-center z-30">
                              <div className="text-center text-white">
                                 <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4" />
                                 <p className="font-bold">Iniciando reconocimiento...</p>
                              </div>
                           </div>
                        )}

                        {recState.isActive && (
                           <div className="absolute top-4 left-4 z-30 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                              {recognitionStateLabel}
                           </div>
                        )}
                     </Card>
            </div>

            {/* Columna Derecha: Resultados */}
            <div className="lg:col-span-1 h-full flex flex-col gap-4">
                     <Card className="flex-1 border-none shadow-lg bg-white overflow-hidden flex flex-col">
                        <CardBody className="p-6 flex flex-col h-full justify-center">
                           <div className="text-center mb-8">
                              <div className={`inline-block px-4 py-1.5 bg-[var(--color-accent-100)] text-[var(--color-accent-700)] rounded-full text-xs font-black uppercase tracking-widest mb-4 transition-all duration-300 ${isAdvancing ? 'opacity-70 scale-95' : 'animate-pulse'}`}>
                                 {recState.isActive ? 'Reconociendo...' : 'Esperando inicio'}
                              </div>
                              <p className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Estado</p>
                              <AnimatePresence mode="wait">
                                 <motion.h3
                                    key={currentSign?.name ?? 'empty-state'}
                                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                    transition={{ duration: 0.22 }}
                                    className="text-3xl font-black text-[var(--color-primary-600)] text-center leading-tight mb-2"
                                 >
                                    {currentSign?.name ?? 'Sin seña'}
                                 </motion.h3>
                              </AnimatePresence>
                              <AnimatePresence mode="wait">
                                 <motion.p
                                    key={displayedDetectionLabel}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className={`text-base font-bold text-center leading-snug ${isAdvancing ? 'text-[var(--color-warning-700)]' : 'text-[var(--color-text-primary)]'}`}
                                 >
                                    {displayedDetectionLabel}
                                 </motion.p>
                              </AnimatePresence>
                              <motion.p
                                 key={statusMessage}
                                 initial={{ opacity: 0, y: 6 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -4 }}
                                 className="mt-2 text-sm text-[var(--color-text-secondary)] text-center"
                              >
                                 {statusMessage}
                              </motion.p>
                           </div>

                           <div className="w-full mt-auto">
                              <p className="text-center text-sm font-bold text-[var(--color-text-secondary)] mb-3">Confianza</p>
                              <div className="relative w-32 h-32 mx-auto">
                                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-neutral-100)" strokeWidth="10" />
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-success-500)" strokeWidth="10" strokeDasharray="283" strokeDashoffset={283 - (283 * displayedConfidence) / 100} className="transition-all duration-1000" />
                                 </svg>
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-black text-[var(--color-success-700)]">{displayedConfidence}%</span>
                                 </div>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                                 <div className="rounded-2xl bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Aciertos</p>
                                    <p className="text-2xl font-black text-[var(--color-primary-600)]">{correctAnswers}</p>
                                 </div>
                                 <div className="rounded-2xl bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Precisión</p>
                                    <p className="text-2xl font-black text-[var(--color-text-primary)]">{accuracy}%</p>
                                 </div>
                              </div>

                              <div className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                                 {currentSign ? `Objetivo activo: ${currentSign.name}` : 'Selecciona una seña'}
                              </div>
                           </div>
                        </CardBody>
                     </Card>
            </div>

          </div>
        </div>
      </div>

         <div className="px-4 sm:px-8 pb-8">
            <div className="max-w-6xl mx-auto">
               <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardBody className="p-6 sm:p-8">
                     <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                           <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--color-primary-500)] mb-2">Catálogo individual completo</p>
                           <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary)]">Explora y practica cada seña</h2>
                           <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-2xl">
                              Busca por nombre, filtra por categoría y abre cada video para estudiar el vocabulario completo desde la misma vista de práctica.
                           </p>
                        </div>
                        <Badge variant="primary" size="md" className="self-start lg:self-auto">
                           {allCatalogSigns.length} señas disponibles
                        </Badge>
                     </div>

                     <div className="mt-6">
                        <Input
                           value={catalogSearchTerm}
                           onChange={(event) => setCatalogSearchTerm(event.target.value)}
                           placeholder="Buscar seña por nombre..."
                           leftIcon={<Search size={18} />}
                        />
                     </div>

                     <div className="mt-4 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {catalogCategories.map((category) => {
                           const isActive = selectedCatalogCategory === category.id;

                           return (
                              <button
                                 key={category.id}
                                 type="button"
                                 onClick={() => setSelectedCatalogCategory(category.id)}
                                 className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold whitespace-nowrap transition-all ${
                                    isActive
                                       ? 'bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)] shadow-md'
                                       : 'bg-[var(--color-neutral-50)] text-[var(--color-text-primary)] border-[var(--color-neutral-200)] hover:border-[var(--color-primary-200)] hover:bg-[var(--color-primary-50)]'
                                 }`}
                              >
                                 <span>{category.emoji}</span>
                                 <span>{category.label}</span>
                                 <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--color-neutral-200)] text-[var(--color-text-secondary)]'}`}>
                                    {category.count}
                                 </span>
                              </button>
                           );
                        })}
                     </div>

                     <div className="mt-6">
                        {filteredCatalogSigns.length > 0 ? (
                           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                              {filteredCatalogSigns.map((sign) => (
                                 <button
                                    key={`${sign.category}-${sign.name}`}
                                    type="button"
                                    onClick={() => setSelectedCatalogSign(sign)}
                                    className="group flex flex-col gap-3 text-left"
                                 >
                                    <div className="aspect-square rounded-2xl bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] overflow-hidden relative shadow-sm transition-all group-hover:shadow-lg group-hover:-translate-y-0.5">
                                       <video
                                          src={resolveVideoUrl(sign.videoUrl)}
                                          autoPlay
                                          loop
                                          muted
                                          playsInline
                                          className="w-full h-full object-contain bg-black"
                                       />
                                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                          <span className="opacity-0 group-hover:opacity-100 bg-white text-[var(--color-neutral-900)] rounded-full p-2 shadow-lg transition-opacity">
                                             <Play size={16} />
                                          </span>
                                       </div>
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-sm font-black text-[var(--color-text-primary)] leading-tight">{sign.name}</p>
                                       <Badge variant="neutral" size="sm">{getCategoryLabel(sign.category)}</Badge>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        ) : (
                           <div className="rounded-3xl border-2 border-dashed border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] px-6 py-12 text-center">
                              <BookOpen size={28} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
                              <h3 className="text-lg font-black text-[var(--color-text-primary)]">No hay resultados</h3>
                              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Prueba con otro nombre o cambia de categoría para ver más señas.</p>
                              <Button
                                 type="button"
                                 variant="ghost"
                                 className="mt-4"
                                 onClick={() => {
                                    setCatalogSearchTerm('');
                                    setSelectedCatalogCategory('all');
                                 }}
                              >
                                 Limpiar filtros
                              </Button>
                           </div>
                        )}
                     </div>
                  </CardBody>
               </Card>
            </div>
         </div>

      {/* Modal de Finalización */}
         {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)]" />
                  <div className="relative z-10">
                     <div className="w-24 h-24 bg-white rounded-full mx-auto shadow-lg flex items-center justify-center mb-6">
                        <Trophy size={42} className="text-[var(--color-primary-600)]" />
                     </div>
                     <h2 className="text-2xl font-black text-[var(--color-text-primary)] mb-2">¡Práctica completada!</h2>
                     <p className="text-[var(--color-text-secondary)] font-medium mb-8">Terminaste el recorrido de las 5 señas del modelo de colores.</p>

                     <div className="mb-8">
                        <div className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Aciertos</div>
                        <div className="text-5xl font-black text-[var(--color-primary-600)]">{accuracy}%</div>
                        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{correctAnswers} correctas de {attempts} intentos</p>
                     </div>

                     <div className="flex flex-col gap-3">
                        <Button className="w-full py-4 text-base font-bold bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-xl flex justify-center items-center gap-2" onClick={() => { setShowModal(false); setIsCompleting(false); handleStartPractice(); }}>
                           <RefreshCw size={18} /> Intentar de nuevo
                        </Button>
                        <Button variant="ghost" className="w-full py-4 text-base font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)] rounded-xl flex justify-center items-center gap-2 border-2 border-[var(--color-neutral-200)]" onClick={() => setShowModal(false)}>
                           <BarChart2 size={18} /> Cerrar
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         <AnimatePresence>
            {selectedCatalogSign && (
               <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-[var(--color-neutral-900)]/80 backdrop-blur-md"
                     onClick={() => setSelectedCatalogSign(null)}
                  />
                  <motion.div
                     initial={{ opacity: 0, scale: 0.94, y: 18 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.94, y: 18 }}
                     className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative z-10"
                  >
                     <button
                        onClick={() => setSelectedCatalogSign(null)}
                        className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-transform active:scale-90"
                        aria-label="Cerrar detalle de seña"
                     >
                        <X size={20} className="text-[var(--color-neutral-900)]" />
                     </button>
                     <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-3/5 bg-black aspect-video flex items-center justify-center">
                           <video
                              key={selectedCatalogSign.videoUrl}
                              src={resolveVideoUrl(selectedCatalogSign.videoUrl)}
                              autoPlay
                              loop
                              muted
                              playsInline
                              controls
                              className="w-full h-full object-contain bg-black"
                           />
                        </div>
                        <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col gap-4">
                           <div className="flex items-center gap-2">
                              <Badge variant="accent">{getCategoryLabel(selectedCatalogSign.category)}</Badge>
                              <Badge variant="neutral">Catálogo práctico</Badge>
                           </div>
                           <div>
                              <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--color-text-secondary)] mb-2">Seña seleccionada</p>
                              <h2 className="text-3xl font-black text-[var(--color-neutral-900)] uppercase mb-3">{selectedCatalogSign.name}</h2>
                              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                 Usa este catálogo para repasar la seña completa sin salir de práctica. Puedes buscar, filtrar y abrir cualquier video cuando quieras.
                              </p>
                           </div>
                           <div className="rounded-2xl bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] p-4">
                              <div className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Categoría</div>
                              <div className="text-sm font-bold text-[var(--color-text-primary)]">{getCategoryLabel(selectedCatalogSign.category)}</div>
                           </div>
                           <div className="mt-auto flex gap-3">
                              <Button
                                 variant="ghost"
                                 className="flex-1"
                                 onClick={() => setSelectedCatalogSign(null)}
                              >
                                 Cerrar
                              </Button>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
    </div>
  );
}