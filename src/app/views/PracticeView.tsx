import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { Input } from '../components/lsc/Input';
import { Camera, CameraOff, RefreshCw, BarChart2, Target, Trophy, PlayCircle, CheckCircle2, XCircle, ChevronDown, ChevronLeft, ChevronRight, Search, BookOpen, Play, X, Loader2, Eye, EyeOff, Star, Info, Home, Languages, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLSCRecognition } from '../../hooks/useLSCRecognition';
import { signRecognitionService, SignPattern } from '../../services/signRecognitionService';
import { resolveVideoUrl } from '@/lib/videoUtils';
import { InstructionOverlay } from '../components/InstructionOverlay';

// Función de utilidad fuera del componente para evitar recreaciones y advertencias de linting
const normalizeSign = (value: string) => (value || '')
   .normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')
   .toUpperCase()
   .trim();

// Umbral de confianza para considerar una seña como correcta (95% para evitar falsos positivos)
const MIN_SUCCESS_CONFIDENCE = 95;

interface PracticeViewProps {
  onNavigate?: (view: string) => void;
}

export function PracticeView({ onNavigate }: PracticeViewProps = {}) {
   const { state: recState, videoRef, canvasRef, startRecognition, stopRecognition } = useLSCRecognition();
   const [showModal, setShowModal] = useState(false);
   const [showInstructions, setShowInstructions] = useState(true);
   const [isModelWarming, setIsModelWarming] = useState(false);
   const [isModelReady, setIsModelReady] = useState(false);
   const [isPracticeStarted, setIsPracticeStarted] = useState(false);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [correctAnswers, setCorrectAnswers] = useState(0);
   const [attempts, setAttempts] = useState(0);
   const [statusMessage, setStatusMessage] = useState('Presiona iniciar para activar la cámara y comenzar la práctica.');
   const [isCompleting, setIsCompleting] = useState(false);
   const [isAdvancing, setIsAdvancing] = useState(false);
   const [showCatalog, setShowCatalog] = useState(false);
   const [showExampleVideo, setShowExampleVideo] = useState(true);
   const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
   const [selectedCatalogCategory, setSelectedCatalogCategory] = useState('all');
   const [selectedCatalogSign, setSelectedCatalogSign] = useState<SignPattern | null>(null);
   const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

   const processedRecognitionRef = useRef<string>('');
   const lastNonMatchRef = useRef<string>('');
   const awaitingResetRef = useRef(false);
   const attemptLockedRef = useRef(false);
   const pendingAttemptMatchedRef = useRef(false);
   const pendingAttemptSignRef = useRef<string>('');
   const completionTimerRef = useRef<number | null>(null);
   const advanceTimerRef = useRef<number | null>(null);
   const handsDownTimerRef = useRef<number | null>(null);
   const noRecognitionTimerRef = useRef<number | null>(null);
   const latestHandsDetectedRef = useRef(0);
   const latestCurrentIndexRef = useRef(0);
   const lastIndexChangeTimeRef = useRef(Date.now());

   useEffect(() => {
      latestHandsDetectedRef.current = recState.handsDetected;
   }, [recState.handsDetected]);

   useEffect(() => {
      latestCurrentIndexRef.current = currentIndex;
      lastIndexChangeTimeRef.current = Date.now();
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

   useEffect(() => {
      let cancelled = false;

      const warmModel = async () => {
         setIsModelWarming(true);
         try {
            await signRecognitionService.loadModel(currentModelCategory);
            if (!cancelled) {
               setIsModelReady(true);
            }
         } catch (error) {
            if (!cancelled) {
               setIsModelReady(false);
               setStatusMessage('No se pudo preparar el modelo de práctica.');
            }
            console.error(error);
         } finally {
            if (!cancelled) {
               setIsModelWarming(false);
            }
         }
      };

      warmModel();

      return () => {
         cancelled = true;
      };
   }, [currentModelCategory]);

   const finishPractice = useCallback(() => {
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
   }, [stopRecognition]);

   const advanceTarget = useCallback(() => {
      if (currentIndex >= practiceSigns.length - 1) {
         finishPractice();
         return;
      }

      setCurrentIndex(prev => prev + 1);
      processedRecognitionRef.current = '';
      pendingAttemptMatchedRef.current = false;
      setStatusMessage('Siguiente seña cargada.');
   }, [currentIndex, practiceSigns.length, finishPractice]);

   const handleStartPractice = async () => {
      if (!practiceSigns.length) {
         setStatusMessage('No hay señas disponibles para practicar.');
         return;
      }

      if (!isModelReady) {
         setStatusMessage('El modelo de IA aún se está preparando. Por favor, espera un momento.');
         return;
      }

      // 1. Limpiar estados visuales primero para dar feedback inmediato al usuario
      setShowModal(false);
      setIsCompleting(false);
      setIsAdvancing(false);
      setCurrentIndex(0);
      setCorrectAnswers(0);
      setAttempts(0);
      setStatusMessage('Preparando cámara y sistema de reconocimiento...');
      
      processedRecognitionRef.current = '';
      awaitingResetRef.current = false;
      attemptLockedRef.current = false;
      pendingAttemptMatchedRef.current = false;
      pendingAttemptSignRef.current = '';

      // 2. IMPORTANTE: Dejar que el navegador renderice el mensaje de carga 
      // antes de bloquear el hilo principal con la inicialización de MediaPipe (vital en móviles)
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
         await startRecognition(currentModelCategory);
         // No dependemos de recState aquí porque es una clausura vieja del render anterior
         setIsPracticeStarted(true);
         setStatusMessage(`Práctica activa. Realiza la seña ${practiceSigns[0].name}.`);
      } catch (error) {
         let msg = 'No fue posible iniciar la cámara o el modelo.';
         if (error instanceof Error) {
            if (error.name === 'NotAllowedError') msg = 'Permiso de cámara denegado.';
            else if (error.name === 'NotFoundError') msg = 'No se encontró una cámara en este dispositivo.';
            else msg = error.message;
         }
         
         setIsPracticeStarted(false);
         setStatusMessage(msg);
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
      attemptLockedRef.current = false;
      pendingAttemptMatchedRef.current = false;
      pendingAttemptSignRef.current = '';
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
         attemptLockedRef.current = false;
         pendingAttemptMatchedRef.current = false;
         pendingAttemptSignRef.current = '';
         stopRecognition();
      };
   }, [stopRecognition]);

   useEffect(() => {
      if (!isPracticeStarted || isCompleting || !currentSign) return;

      if (recState.handsDetected === 0) {
         const hadActivity = processedRecognitionRef.current !== '' || pendingAttemptSignRef.current !== '' || awaitingResetRef.current;

         if (hadActivity) {
            if (!noRecognitionTimerRef.current) {
               noRecognitionTimerRef.current = window.setTimeout(() => {
                  noRecognitionTimerRef.current = null;
                  if (!isPracticeStarted || isCompleting || recState.handsDetected !== 0) return;

                  // Contamos el intento al bajar las manos si no se había registrado un acierto previo
                  // Y solo si hubo al menos una seña detectada durante la sesión para evitar falsos positivos
                  if (!pendingAttemptMatchedRef.current && pendingAttemptSignRef.current !== '') {
                     setAttempts(prev => prev + 1);
                  }

                  awaitingResetRef.current = false;
                  attemptLockedRef.current = false;
                  setIsAdvancing(false);
                  processedRecognitionRef.current = '';
                  pendingAttemptSignRef.current = '';
                  lastNonMatchRef.current = '';
                  signRecognitionService.resetTemporalState();

                  if (latestCurrentIndexRef.current >= practiceSigns.length - 1) {
                     pendingAttemptMatchedRef.current = false;
                     pendingAttemptSignRef.current = '';
                     finishPractice();
                     return;
                  }

                  setStatusMessage(`Intento registrado. Vuelve a levantar las manos para probar con ${currentSign.name}.`);
               }, 800);
            }
         } else if (noRecognitionTimerRef.current) {
            window.clearTimeout(noRecognitionTimerRef.current);
            noRecognitionTimerRef.current = null;
         }
      }

      // Si las manos suben, cancelamos cualquier timer de reset pendiente para continuar reconociendo
      if (recState.handsDetected > 0 && noRecognitionTimerRef.current) {
         window.clearTimeout(noRecognitionTimerRef.current);
         noRecognitionTimerRef.current = null;
      }

      // Si el intento ya detectó el acierto (está bloqueado), no procesamos más hasta que bajen las manos
      if (attemptLockedRef.current) return;

      if (!recState.currentSign || recState.currentSign.timestamp < lastIndexChangeTimeRef.current) return;

      const detected = normalizeSign(recState.currentSign.sign);
      const target = normalizeSign(currentSign.name);
      const confidence = recState.currentSign.confidence;
      const attemptKey = `${currentIndex}:${detected}`;

      if (processedRecognitionRef.current === attemptKey && Math.round(confidence * 100) < MIN_SUCCESS_CONFIDENCE) return;

      if (completionTimerRef.current) {
         window.clearTimeout(completionTimerRef.current);
         completionTimerRef.current = null;
      }

      processedRecognitionRef.current = attemptKey;

      if (detected !== target || Math.round(confidence * 100) < MIN_SUCCESS_CONFIDENCE) {
         lastNonMatchRef.current = attemptKey;
         pendingAttemptMatchedRef.current = false;
         pendingAttemptSignRef.current = detected;
         
         if (detected === target) {
            setStatusMessage(`Casi lo tienes. Mantén la seña con claridad (Confianza: ${Math.round(confidence * 100)}%). Objetivo: ${MIN_SUCCESS_CONFIDENCE}%+`);
         } else {
            setStatusMessage(`Realiza la seña ${currentSign.name}.`);
         }
         return;
      }

      lastNonMatchRef.current = '';
      attemptLockedRef.current = true;
      pendingAttemptMatchedRef.current = true;
      pendingAttemptSignRef.current = detected;
      setAttempts(prev => prev + 1);
      setCorrectAnswers(prev => prev + 1);
      setFeedback('success');
      setStatusMessage(`¡Excelente! Correcto: ${currentSign.name}.`);

      setTimeout(() => {
         setFeedback(null);
         advanceTarget();
         attemptLockedRef.current = false;
         awaitingResetRef.current = false;
         setIsAdvancing(false);
         processedRecognitionRef.current = '';
         pendingAttemptSignRef.current = '';
         signRecognitionService.resetTemporalState();
      }, 1600);

   }, [currentIndex, currentSign, isCompleting, isPracticeStarted, practiceSigns.length, recState.currentSign, recState.handsDetected, finishPractice, advanceTarget]);

   const confidence = recState.currentSign ? Math.round(recState.currentSign.confidence * 100) : 0;
   const displayedConfidence = recState.currentSign && currentSign
      ? normalizeSign(recState.currentSign.sign) === normalizeSign(currentSign.name)
         ? confidence
         : 0
      : confidence;
   const recognitionStateLabel = recState.isActive ? 'Reconocimiento activo' : 'Reconocimiento detenido';
   const detectedMatchesTarget = Boolean(
      recState.currentSign && currentSign && normalizeSign(recState.currentSign.sign) === normalizeSign(currentSign.name) && Math.round(recState.currentSign.confidence * 100) >= MIN_SUCCESS_CONFIDENCE
   );
   const displayedDetectionLabel = !recState.isActive
      ? 'Sin detección'
      : isAdvancing
         ? 'Baja las manos para continuar'
      : detectedMatchesTarget
         ? currentSign?.name ?? 'Sin detección'
         : 'Esperando coincidencia con el objetivo';

   return (
      <div className="fixed inset-0 h-dvh w-screen bg-black z-[60] overflow-hidden touch-none select-none">
         <InstructionOverlay
            show={showInstructions}
            onClose={() => setShowInstructions(false)}
            onToggle={() => setShowInstructions(prev => !prev)}
            title="Guía de Práctica y Señas"
            subtitle="Sigue estos pasos para mejorar tu aprendizaje de LSC con Inteligencia Artificial:"
            instructions={[
               { icon: "💡", text: "Asegúrate de tener una iluminación clara y frontal." },
               { icon: "📐", text: "Tu rostro y torso deben ser visibles." },
               { icon: "👤", text: "Mantente centrado y de frente a la cámara." },
               { icon: "✨", text: "El sistema detectará automáticamente cuando logres la seña correcta." },
               { icon: "📚", text: "Usa el icono del libro para consultar el diccionario en cualquier momento." }
            ]}
         />

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

                        {/* Animaciones de Feedback */}
                        <AnimatePresence>
                           {feedback === 'success' && (
                              <motion.div 
                                 className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none"
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 exit={{ opacity: 0 }}
                              >
                                 {[...Array(8)].map((_, i) => (
                                    <motion.div
                                       key={i}
                                       className="absolute"
                                       initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                                       animate={{ 
                                          scale: [0, 1.5, 0], 
                                          opacity: [0, 1, 0],
                                          x: (Math.random() - 0.5) * 500,
                                          y: (Math.random() - 0.5) * 500,
                                          rotate: Math.random() * 360
                                       }}
                                       transition={{ duration: 1.2, delay: i * 0.05, ease: "easeOut" }}
                                    >
                                       <Star className="text-yellow-400 fill-yellow-400" size={32 + Math.random() * 32} />
                                    </motion.div>
                                 ))}
                                 <motion.div
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                                    className="bg-white/10 backdrop-blur-lg rounded-full p-10 border border-white/20 shadow-2xl"
                                 >
                                    <CheckCircle2 size={120} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                                 </motion.div>
                              </motion.div>
                           )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                           {recState.isActive && (
                              <motion.div
                                 key={isAdvancing ? 'advance' : currentSign?.name ?? 'ready'}
                                 initial={{ opacity: 0, y: -20 }}
                                 animate={{ opacity: 1, y: 0, scale: 1 }}
                                 exit={{ opacity: 0, y: -20 }}
                                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                 className="absolute inset-x-0 top-2 md:top-auto md:bottom-2 z-30 p-2 md:p-4 pointer-events-none"
                              >
                                 <div className="mx-auto max-w-[95vw] md:max-w-xl rounded-[2rem] border border-white/20 bg-black/40 backdrop-blur-xl shadow-2xl px-5 py-4 md:px-7 md:py-6 text-white">
                                    <div className="flex items-start justify-between gap-6 mb-4">
                                       <div className="flex-1">
                                          <p className="text-[9px] uppercase tracking-[0.4em] text-white/70 font-black mb-1">Seña Objetivo</p>
                                          <div className="text-2xl md:text-5xl font-black text-white tracking-tighter uppercase italic whitespace-nowrap pr-2">
                                             {currentSign?.name ?? 'Sin ejercicio'}
                                          </div>
                                       </div>
                                       
                                       {/* Integración de Confianza IA */}
                                       <div className="flex flex-col items-center gap-1 shrink-0">
                                          <div className="relative w-12 h-12 md:w-14 md:h-14">
                                             <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                                                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-success-500)" strokeWidth="12" strokeDasharray="264" strokeDashoffset={264 - (264 * displayedConfidence) / 100} strokeLinecap="round" className="transition-all duration-300" />
                                             </svg>
                                             <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[10px] md:text-xs font-black">{displayedConfidence}%</span>
                                             </div>
                                          </div>
                                          <span className="text-[7px] font-black uppercase text-white/30 tracking-widest">Precisión</span>
                                       </div>
                                    </div>

                                    {/* Mini Marcadores Integrados */}
                                    <div className="flex gap-3 mb-5">
                                       <div className="bg-white/5 rounded-xl px-3 py-1.5 border border-white/5 flex items-center gap-2">
                                          <span className="text-[8px] font-black uppercase text-white/60">Aciertos</span>
                                          <span className="text-xs font-black text-[var(--color-primary-400)]">{correctAnswers}</span>
                                       </div>
                                       <div className="bg-white/5 rounded-xl px-3 py-1.5 border border-white/5 flex items-center gap-2">
                                          <span className="text-[8px] font-black uppercase text-white/60">Intentos</span>
                                          <span className="text-xs font-black text-white">{attempts}</span>
                                       </div>
                                       <div className={`ml-auto shrink-0 inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest border border-white/5 ${isAdvancing ? 'text-amber-400' : 'text-emerald-500'}`}>
                                          <span className={`h-1.5 w-1.5 rounded-full ${isAdvancing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                                          {isAdvancing ? 'Cambio' : 'Detectando'}
                                       </div>
                                    </div>

                                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-4">
                                       <motion.div
                                          className={`h-full rounded-full ${isAdvancing ? 'bg-amber-400' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}
                                          initial={{ width: '0%' }}
                                          animate={{ width: `${progress}%` }}
                                          transition={{ duration: 0.8, ease: "circOut" }}
                                       />
                                    </div>

                                    <motion.p
                                       key={statusMessage}
                                       initial={{ opacity: 0 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       className="text-[11px] md:text-sm text-white/70 font-semibold flex items-center gap-2 italic leading-none"
                                    >
                                       <ChevronDown size={14} className={isAdvancing ? 'animate-bounce text-amber-300' : 'text-white/30'} />
                                       {statusMessage}
                                    </motion.p>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>

                        {!recState.isActive && !recState.isLoading && (
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-6 text-center z-20 backdrop-blur-md">
                              <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                              <PlayCircle size={48} className="mb-3 text-white/40 mx-auto" />
                                 <h3 className="text-2xl font-black mb-2 tracking-tight">Listo para comenzar</h3>
                                 <p className="text-sm text-white/60 max-w-xs mb-6 leading-relaxed">Presiona el botón para iniciar la cámara y comenzar con los ejercicios de colores.</p>
                                 <Button 
                                    onClick={() => { signRecognitionService.resetTemporalState(); handleStartPractice(); }}
                                    disabled={recState.isLoading || isModelWarming || !isModelReady}
                                    className="bg-white text-black hover:bg-white/90 font-black px-8 py-4 text-base rounded-2xl shadow-2xl disabled:opacity-50"
                                 >
                                    {recState.isLoading || isModelWarming ? (
                                       <><Loader2 className="animate-spin mr-2" size={20} /> Preparando...</>
                                    ) : (
                                       <><Camera size={20} className="mr-2" /> Iniciar práctica</>
                                    )}
                                 </Button>
                              </div>
                           </div>
                        )}

                        {recState.isLoading && (
                           <div className="absolute inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-30">
                              <div className="text-center text-white">
                                 <Loader2 className="animate-spin w-16 h-16 text-[var(--color-primary-400)] mx-auto mb-6" />
                                 <p className="text-xl font-black tracking-widest uppercase">Iniciando...</p>
                              </div>
                           </div>
                        )}

                        {recState.isActive && (
                           <>
                              {/* DICCIONARIO / CATÁLOGO: Ahora es una ventana flotante independiente */}
                              <AnimatePresence>
                                 {showCatalog && (
                                    <motion.div
                                       initial={{ opacity: 0, scale: 0.95, x: 20 }}
                                       animate={{ opacity: 1, scale: 1, x: 0 }}
                                       exit={{ opacity: 0, scale: 0.95, x: 20 }}
                                       className="absolute top-16 md:top-20 right-2 md:right-4 bottom-32 md:bottom-32 z-50 w-[calc(100vw-1rem)] md:w-[360px] max-w-[calc(100vw-1rem)] bg-black/70 backdrop-blur-3xl border border-white/20 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden text-white"
                                    >
                                       <div className="p-5 flex items-center justify-between border-b border-white/10">
                                          <div>
                                             <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Referencia</p>
                                             <h3 className="text-xl font-black">Diccionario LSC</h3>
                                          </div>
                                          <button onClick={() => setShowCatalog(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                             <X size={20} />
                                          </button>
                                       </div>
                                       
                                       <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                                          <Input
                                             value={catalogSearchTerm}
                                             onChange={(event) => setCatalogSearchTerm(event.target.value)}
                                             placeholder="Buscar seña..."
                                             className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl"
                                             leftIcon={<Search className="size-4 md:size-5" />}
                                          />
                                          
                                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                             {catalogCategories.map((cat) => (
                                                <button
                                                   key={cat.id}
                                                   onClick={() => setSelectedCatalogCategory(cat.id)}
                                                   className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${selectedCatalogCategory === cat.id ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10'}`}
                                                >
                                                   {cat.emoji} {cat.label}
                                                </button>
                                             ))}
                                          </div>

                                          <div className="grid gap-3">
                                             {filteredCatalogSigns.length > 0 ? (
                                                filteredCatalogSigns.map((sign) => (
                                                   <button
                                                      key={`${sign.category}-${sign.name}`}
                                                      onClick={() => setSelectedCatalogSign(sign)}
                                                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all text-left group"
                                                   >
                                                      <div className="h-14 w-14 rounded-lg bg-black overflow-hidden flex-shrink-0">
                                                         <video src={resolveVideoUrl(sign.videoUrl)} muted playsInline className="w-full h-full object-contain" />
                                                      </div>
                                                      <div className="min-w-0">
                                                         <p className="text-sm font-black truncate">{sign.name}</p>
                                                         <p className="text-[10px] text-white/40 uppercase font-bold">{getCategoryLabel(sign.category)}</p>
                                                      </div>
                                                   </button>
                                                ))
                                             ) : (
                                                <div className="py-10 text-center opacity-30">
                                                   <BookOpen size={32} className="mx-auto mb-2" />
                                                   <p className="text-xs font-bold uppercase">Sin resultados</p>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    </motion.div>
                                 )}
                              </AnimatePresence>

                              {showExampleVideo ? (
                                 <motion.div
                                    initial={{ opacity: 0, x: -10, y: 8 }}
                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                    // Ahora en la esquina inferior izquierda, aprovechando el espacio del dashboard eliminado
                                    className="absolute bottom-6 left-6 z-30 w-[160px] md:w-[280px] max-w-[45vw] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden border border-white/20 bg-black/40 backdrop-blur-2xl shadow-2xl"
                                 >
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 text-white/80">
                                       <div className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.4em] ml-2 truncate">Seña Objetivo</div>
                                       <button type="button" onClick={() => setShowExampleVideo(false)} className="rounded-full p-1 hover:bg-white/10">
                                          <EyeOff size={14} />
                                       </button>
                                    </div>
                                    <div className="aspect-video bg-black">
                                       <video
                                          key={currentSign?.videoUrl ?? 'practice-example'}
                                          src={resolveVideoUrl(currentSign?.videoUrl ?? practiceSigns[0]?.videoUrl)}
                                          autoPlay
                                          loop
                                          muted
                                          playsInline
                                          controls
                                          controlsList="nodownload nomute"
                                          onContextMenu={(e) => e.preventDefault()}
                                          className="w-full h-full object-contain bg-black"
                                       />
                                    </div>
                                 </motion.div>
                              ) : (
                                 null
                              )}

                              {/* ZONA DEL PULGAR (Distribución en L Inversa): 4 en vertical, 2 en horizontal */}
                              <div className="absolute bottom-6 right-6 z-40 w-[140px] h-[200px] pointer-events-none">
                                    {/* ANCLA (Esquina): Eye */}
                                    <button
                                       type="button"
                                       onClick={() => setShowExampleVideo(prev => !prev)}
                                       title={showExampleVideo ? 'Ocultar guía' : 'Mostrar guía'}
                                       className={`absolute bottom-0 right-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-90 pointer-events-auto ${showExampleVideo ? 'bg-white text-black' : 'bg-black/40 text-white border border-white/10 backdrop-blur-md'}`}
                                    >
                                       {showExampleVideo ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </button>

                                    {/* EJE VERTICAL (Lateral Derecho) */}
                                    {/* Diccionario */}
                                    <button
                                       type="button"
                                       onClick={() => setShowCatalog(prev => !prev)}
                                       title="Diccionario"
                                       className={`absolute bottom-[48px] right-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-90 pointer-events-auto ${showCatalog ? 'bg-white text-black' : 'bg-[var(--color-primary-600)] text-white'}`}
                                    >
                                       <BookOpen size={14} />
                                    </button>

                                    {isPracticeStarted && !showInstructions && (
                                       <button
                                          type="button"
                                          onClick={handleStopPractice}
                                          title="Detener práctica"
                                          className="absolute bottom-[96px] right-0 w-10 h-10 rounded-xl bg-red-500/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-110 active:scale-90 pointer-events-auto"
                                       >
                                          <CameraOff size={14} />
                                       </button>
                                    )}

                                    <button
                                       type="button"
                                       onClick={() => onNavigate?.('home')}
                                       title="Volver al inicio"
                                       className="absolute bottom-[144px] right-0 w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-110 active:scale-90 pointer-events-auto"
                                    >
                                       <Home size={14} />
                                    </button>

                                    {/* EJE HORIZONTAL (Parte Inferior) */}
                                    <button
                                       type="button"
                                       onClick={() => setShowInstructions(true)}
                                       title="Ver instrucciones"
                                       className="absolute bottom-0 right-[48px] w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-110 active:scale-90 pointer-events-auto"
                                    >
                                       <Info size={14} />
                                    </button>
                              </div>
                           </>
                        )}
      

      {/* Modal de Finalización */}
         {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)]" />
                  <div className="relative z-10">
                     <div className="w-24 h-24 bg-white rounded-full mx-auto shadow-lg flex items-center justify-center mb-6">
                        <Trophy size={42} className="text-[var(--color-primary-600)]" />
                     </div>
                     <h2 className="text-2xl font-black text-[var(--color-text-primary)] mb-1">¡Práctica completada!</h2>
                     <p className="text-xs text-[var(--color-text-secondary)] font-medium mb-6">Terminaste el recorrido de las 5 señas del modelo de colores.</p>

                     <div className="mb-6">
                        <div className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Precisión General</div>
                        <div className="text-5xl font-black text-[var(--color-primary-600)]">{accuracy}%</div>
                        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{correctAnswers} correctas de {attempts} intentos</p>
                     </div>

                     <div className="flex flex-col gap-3">
                        <Button 
                           className="w-full py-4 text-base font-bold bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] rounded-xl flex justify-center items-center gap-2" 
                           onClick={() => { 
                              setShowModal(false); 
                              setIsCompleting(false); 
                              // Limpieza total antes de reiniciar
                              processedRecognitionRef.current = '';
                              pendingAttemptSignRef.current = '';
                              signRecognitionService.resetTemporalState();
                              handleStartPractice(); 
                           }}
                        >
                           <RefreshCw size={18} /> Intentar de nuevo
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2">
                           <Button variant="ghost" className="py-3 text-xs font-bold rounded-xl border-2" onClick={() => onNavigate?.('home')}>
                              <Home size={14} className="mr-1" /> Inicio
                           </Button>
                           <Button variant="ghost" className="py-3 text-xs font-bold rounded-xl border-2" onClick={() => onNavigate?.('translator')}>
                              <Languages size={14} className="mr-1" /> Traductor
                           </Button>
                        </div>

                        <div className="mt-2">
                           <Button variant="ghost" className="w-full py-3 text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] rounded-xl flex justify-center items-center gap-2 border-2" onClick={() => onNavigate?.('feedback')}>
                              <MessageSquare size={14} /> Enviar Sugerencia
                           </Button>
                        </div>
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
                              controlsList="nodownload nomute"
                              onContextMenu={(e) => e.preventDefault()}
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