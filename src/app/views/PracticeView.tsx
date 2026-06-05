import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Badge } from '../components/lsc/Badge';
import { Input } from '../components/lsc/Input';
import { Camera, CameraOff, RefreshCw, BarChart2, Target, Trophy, PlayCircle, CheckCircle2, XCircle, ChevronDown, ChevronLeft, ChevronRight, Search, BookOpen, Play, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLSCRecognition } from '../../hooks/useLSCRecognition';
import { signRecognitionService, SignPattern } from '../../services/signRecognitionService';
import { resolveVideoUrl } from '../../lib/videoUtils';

interface PracticeViewProps {
  onNavigateHome?: () => void;
}

export function PracticeView({ onNavigateHome }: PracticeViewProps = {}) {
   const { state: recState, videoRef, canvasRef, startRecognition, stopRecognition } = useLSCRecognition();
   const [showModal, setShowModal] = useState(false);
   const [showIntroScreen, setShowIntroScreen] = useState(true);
   const [introStep, setIntroStep] = useState(0);
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
   const [showSidePanel, setShowSidePanel] = useState(true);
   const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
   const [selectedCatalogCategory, setSelectedCatalogCategory] = useState('all');
   const [selectedCatalogSign, setSelectedCatalogSign] = useState<SignPattern | null>(null);

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

   const introSteps = [
      {
         title: 'Desliza para aprender',
         description: 'Revisa las indicaciones deslizando la tarjeta. Mientras lees, el modelo de práctica se descarga en segundo plano.',
         hint: 'Desliza a la izquierda para avanzar',
      },
      {
         title: 'Prepara el encuadre',
         description: 'Colócate frente a la cámara con suficiente espacio para mover manos y brazos sin salir del cuadro.',
         hint: 'Mantén el cuerpo centrado y las manos visibles',
      },
      {
         title: 'Muestra la seña completa',
         description: 'Haz la seña con calma. El sistema necesita ver el gesto con una postura estable antes de aceptarlo.',
         hint: 'No te acerques demasiado a la cámara',
      },
      {
         title: 'Video de ejemplo',
         description: 'Cuando llegues aquí ya podrás entrar a práctica. Si quieres, abre el video de referencia para repetir el modelo visual.',
         hint: 'Al terminar, entra a la práctica con el modelo listo',
      },
   ];

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

   const handleIntroDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
      if (info.offset.x < -60) {
         setIntroStep(prev => Math.min(prev + 1, introSteps.length - 1));
      }
      if (info.offset.x > 60) {
         setIntroStep(prev => Math.max(prev - 1, 0));
      }
   };

   const handleIntroNext = () => {
      setIntroStep(prev => Math.min(prev + 1, introSteps.length - 1));
   };

   const handleIntroPrev = () => {
      setIntroStep(prev => Math.max(prev - 1, 0));
   };

   const handleFinishIntro = () => {
      setShowIntroScreen(false);
      setStatusMessage(isModelReady ? 'Modelo preparado. Ya puedes iniciar la práctica.' : 'Modelo en preparación. Espera unos segundos antes de iniciar.');
   };

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
      attemptLockedRef.current = false;
      pendingAttemptMatchedRef.current = false;
      pendingAttemptSignRef.current = '';

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

      if (recState.handsDetected > 0 && !awaitingResetRef.current) {
         awaitingResetRef.current = true;
         attemptLockedRef.current = false;
         pendingAttemptMatchedRef.current = false;
         pendingAttemptSignRef.current = '';
         processedRecognitionRef.current = '';
         lastNonMatchRef.current = '';
         setIsAdvancing(false);
      }

      if (awaitingResetRef.current) {
         const handsAreDown = recState.handsDetected === 0;

         if (handsAreDown) {
            if (!noRecognitionTimerRef.current) {
               noRecognitionTimerRef.current = window.setTimeout(() => {
                  noRecognitionTimerRef.current = null;
                  if (!awaitingResetRef.current || !isPracticeStarted || isCompleting) return;
                  if (recState.handsDetected !== 0) return;

                  const wasMatched = pendingAttemptMatchedRef.current;

                  setAttempts(prev => prev + 1);
                  if (wasMatched) {
                     setCorrectAnswers(prev => prev + 1);
                  }

                  awaitingResetRef.current = false;
                  attemptLockedRef.current = false;
                  setIsAdvancing(false);
                  if (latestCurrentIndexRef.current >= practiceSigns.length - 1) {
                     pendingAttemptMatchedRef.current = false;
                     pendingAttemptSignRef.current = '';
                     signRecognitionService.resetTemporalState();
                     finishPractice();
                     return;
                  }

                  if (wasMatched) {
                     setCurrentIndex(prev => prev + 1);
                     processedRecognitionRef.current = '';
                     lastNonMatchRef.current = '';
                     const nextSign = practiceSigns[latestCurrentIndexRef.current + 1]?.name ?? 'la siguiente seña';
                     setStatusMessage(`Buen trabajo. Ahora intenta con ${nextSign}.`);
                  } else {
                     setStatusMessage(`Intento registrado. Vuelve a levantar las manos para probar con ${currentSign.name}.`);
                  }

                  pendingAttemptMatchedRef.current = false;
                  pendingAttemptSignRef.current = '';
                  signRecognitionService.resetTemporalState();
               }, 180);
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

      if (attemptLockedRef.current) return;
      if (processedRecognitionRef.current === attemptKey) return;
      processedRecognitionRef.current = attemptKey;

      if (completionTimerRef.current) {
         window.clearTimeout(completionTimerRef.current);
         completionTimerRef.current = null;
      }

      if (detected !== target) {
         lastNonMatchRef.current = attemptKey;
         pendingAttemptMatchedRef.current = false;
         pendingAttemptSignRef.current = detected;
         setIsAdvancing(false);
         setStatusMessage(`No coincide con ${currentSign.name}. Intenta nuevamente.`);
         return;
      }

      lastNonMatchRef.current = '';

      attemptLockedRef.current = true;
      pendingAttemptMatchedRef.current = true;
      pendingAttemptSignRef.current = detected;
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

   if (showIntroScreen) {
      const activeSlide = introSteps[introStep];

      return (
         <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_45%),linear-gradient(180deg,var(--color-surface),#ffffff)] text-[var(--color-text-primary)] flex flex-col">
            <div className="flex-1 px-4 py-6 sm:px-8 sm:py-8 flex items-center justify-center">
               <div className="w-full max-w-6xl">
                  <div className="mb-6 flex items-center justify-between gap-4">
                     <div>
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-[var(--color-primary-500)] mb-2">Práctica guiada</p>
                        <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-text-primary)]">Antes de empezar, recorre las instrucciones</h1>
                        <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-2xl">Mientras lees, el modelo de práctica se descarga en segundo plano para que al entrar no tengas que esperar.</p>
                     </div>
                     <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--color-neutral-200)] bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
                        {isModelWarming ? <Loader2 size={16} className="animate-spin text-[var(--color-primary-600)]" /> : <CheckCircle2 size={16} className={isModelReady ? 'text-emerald-500' : 'text-amber-500'} />}
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
                           {isModelWarming ? 'Preparando modelo' : isModelReady ? 'Modelo listo' : 'Esperando modelo'}
                        </span>
                     </div>
                  </div>

                  <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden rounded-[2rem]">
                     <CardBody className="p-5 sm:p-8">
                        <div className="flex items-center justify-between gap-4 mb-6">
                           <div className="flex items-center gap-3">
                              <div className="rounded-2xl bg-[var(--color-primary-50)] text-[var(--color-primary-600)] p-3 border border-[var(--color-primary-100)]">
                                 <Target size={22} />
                              </div>
                              <div>
                                 <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--color-text-tertiary)]">{activeSlide.eyebrow}</p>
                                 <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">{activeSlide.title}</h2>
                              </div>
                           </div>
                           <Badge variant="primary" size="md">Paso {introStep + 1} de {introSteps.length}</Badge>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
                           <motion.div
                              drag="x"
                              dragConstraints={{ left: 0, right: 0 }}
                              onDragEnd={handleIntroDragEnd}
                              whileTap={{ cursor: 'grabbing' }}
                              className="rounded-[1.75rem] border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] p-6 sm:p-8 shadow-sm cursor-grab active:cursor-grabbing"
                           >
                              <div className="flex items-center justify-between gap-4 mb-5">
                                 <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-text-tertiary)]">Desliza para avanzar</p>
                                    <p className="mt-2 text-sm font-semibold text-[var(--color-text-secondary)]">{activeSlide.hint}</p>
                                 </div>
                                 <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-widest text-[var(--color-primary-600)] border border-[var(--color-primary-100)] shadow-sm">
                                    <ChevronLeft size={14} />
                                    <ChevronRight size={14} />
                                    Desliza
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <p className="text-base sm:text-lg text-[var(--color-text-primary)] leading-relaxed font-medium">{activeSlide.description}</p>
                                 <div className="grid gap-3 sm:grid-cols-2">
                                    {introSteps.map((step, index) => (
                                       <button
                                          key={step.title}
                                          type="button"
                                          onClick={() => setIntroStep(index)}
                                          className={`rounded-2xl border p-4 text-left transition-all ${index === introStep ? 'border-[var(--color-primary-300)] bg-white shadow-md' : 'border-[var(--color-neutral-200)] bg-white/70 hover:border-[var(--color-primary-100)]'}`}
                                       >
                                          <div className="flex items-center justify-between gap-3">
                                             <span className="text-xs font-black uppercase tracking-[0.35em] text-[var(--color-text-tertiary)]">0{index + 1}</span>
                                             {index === introStep && <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary-500)]" />}
                                          </div>
                                          <p className="mt-2 text-sm font-black text-[var(--color-text-primary)]">{step.title}</p>
                                       </button>
                                    ))}
                                 </div>
                                 <ul className="grid gap-3 sm:grid-cols-1">
                                    {(activeSlide as { bullets?: string[] }).bullets?.map((bullet) => (
                                       <li key={bullet} className="rounded-2xl bg-white border border-[var(--color-neutral-200)] p-4 text-sm text-[var(--color-text-secondary)] shadow-sm">
                                          {bullet}
                                       </li>
                                    ))}
                                 </ul>
                              </div>

                              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                 <div className="flex gap-2">
                                    <Button variant="ghost" onClick={handleIntroPrev} disabled={introStep === 0}>
                                       Anterior
                                    </Button>
                                    <Button variant="ghost" onClick={handleIntroNext} disabled={introStep === introSteps.length - 1}>
                                       Siguiente
                                    </Button>
                                 </div>
                                 <Button onClick={handleFinishIntro} disabled={!isModelReady && isModelWarming} className="font-bold">
                                    {isModelReady ? 'Entrar a práctica' : 'Preparando modelo...'}
                                 </Button>
                              </div>
                           </motion.div>

                           <div className="rounded-[1.75rem] border border-[var(--color-neutral-200)] bg-black overflow-hidden shadow-xl relative min-h-[320px]">
                              {activeSlide.videoUrl ? (
                                 <video
                                    src={resolveVideoUrl(activeSlide.videoUrl)}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    controls
                                    className="absolute inset-0 w-full h-full object-contain bg-black"
                                 />
                              ) : (
                                 <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 p-8 text-center bg-gradient-to-b from-black/80 to-black/95">
                                    <PlayCircle size={56} className="mb-4 text-white/35" />
                                    <h3 className="text-2xl font-black mb-2">Video de ejemplo</h3>
                                    <p className="text-sm text-white/70 max-w-md">Aquí verás la referencia visual de la seña antes de entrar a la práctica.</p>
                                 </div>
                              )}

                              <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
                                 <div className="rounded-full bg-black/55 text-white text-[11px] font-black uppercase tracking-widest px-3 py-1.5 backdrop-blur-sm">
                                    Video de referencia
                                 </div>
                                 <div className="rounded-full bg-black/55 text-white text-[11px] font-black uppercase tracking-widest px-3 py-1.5 backdrop-blur-sm">
                                    Listo para practicar
                                 </div>
                              </div>
                           </div>
                        </div>
                     </CardBody>
                  </Card>
               </div>
            </div>
         </div>
      );
   }
  
   return (
      <div className="min-h-screen flex flex-col bg-[var(--color-surface)] relative overflow-hidden">
         <div className="flex-shrink-0 p-4 sm:p-6 bg-white border-b border-[var(--color-neutral-200)] shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[var(--color-accent-100)] p-3 rounded-2xl text-[var(--color-accent-600)] shadow-inner">
              <Target size={28} />
            </div>
            <div>
                     <h1 className="text-2xl font-black text-[var(--color-text-primary)]">Práctica de Reconocimiento</h1>
                               <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">Vista limpia con cámara completa, video auxiliar y opciones laterales</p>
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

      <div className="flex-1 overflow-hidden p-3 sm:p-6">
        <div className="max-w-7xl mx-auto h-full min-h-[calc(100vh-11rem)]">
          <div className="grid grid-cols-1 h-full">

            <div className="hidden">
               {/* Panel lateral de referencia oculto en la nueva estructura. */}
            </div>

            <div className="h-full flex flex-col">
                     <Card className="flex-1 border-4 border-[var(--color-primary-100)] shadow-2xl bg-black overflow-hidden relative rounded-[2rem] min-h-[calc(100vh-11rem)]">
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

                        {recState.isActive && (
                           <>
                              {showExampleVideo ? (
                                 <motion.div
                                    initial={{ opacity: 0, x: -10, y: 8 }}
                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                    className="absolute bottom-4 left-4 z-30 w-[280px] max-w-[42vw] rounded-3xl overflow-hidden border border-white/10 bg-black/55 backdrop-blur-xl shadow-2xl"
                                 >
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 text-white/80">
                                       <div className="text-[10px] font-black uppercase tracking-[0.35em]">Video de ejemplo</div>
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
                                          className="w-full h-full object-contain bg-black"
                                       />
                                    </div>
                                 </motion.div>
                              ) : (
                                 <button
                                    type="button"
                                    onClick={() => setShowExampleVideo(true)}
                                    className="absolute bottom-4 left-4 z-30 inline-flex items-center gap-2 rounded-full bg-black/65 px-4 py-2 text-white text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-xl"
                                 >
                                    <Eye size={14} />
                                    Mostrar video
                                 </button>
                              )}

                              {showSidePanel ? (
                                 <motion.aside
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="absolute top-4 right-4 bottom-4 z-30 w-[330px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-[1.75rem] bg-white/92 backdrop-blur-xl border border-white/60 shadow-2xl"
                                 >
                                    <div className="p-4 sm:p-5 space-y-4">
                                       <div className="flex items-start justify-between gap-3">
                                          <div>
                                             <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-text-tertiary)]">Opciones</p>
                                             <h3 className="text-xl font-black text-[var(--color-text-primary)]">Panel lateral</h3>
                                          </div>
                                          <button type="button" onClick={() => setShowSidePanel(false)} className="rounded-full p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)]">
                                             <X size={18} />
                                          </button>
                                       </div>

                                       <div className="rounded-2xl bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] p-4">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">Seña objetivo</p>
                                          <div className="text-2xl font-black text-[var(--color-primary-600)] leading-tight">{currentSign?.name ?? 'Sin ejercicio'}</div>
                                          <p className="mt-2 text-sm font-semibold text-[var(--color-text-secondary)]">{statusMessage}</p>
                                       </div>

                                       <div className="grid grid-cols-2 gap-3 text-center">
                                          <div className="rounded-2xl bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] p-3">
                                             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Aciertos</p>
                                             <p className="text-2xl font-black text-[var(--color-primary-600)]">{correctAnswers}</p>
                                          </div>
                                          <div className="rounded-2xl bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] p-3">
                                             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">Intentos</p>
                                             <p className="text-2xl font-black text-[var(--color-text-primary)]">{attempts}</p>
                                          </div>
                                       </div>

                                       <div className="rounded-2xl bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] p-4">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">Confianza</p>
                                          <div className="relative w-28 h-28 mx-auto">
                                             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-neutral-200)" strokeWidth="10" />
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-success-500)" strokeWidth="10" strokeDasharray="283" strokeDashoffset={283 - (283 * displayedConfidence) / 100} className="transition-all duration-1000" />
                                             </svg>
                                             <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-2xl font-black text-[var(--color-success-700)]">{displayedConfidence}%</span>
                                             </div>
                                          </div>
                                       </div>

                                       <div className="flex gap-2">
                                          <Button variant="ghost" className="flex-1" onClick={handleStopPractice} disabled={!isPracticeStarted}>
                                             Detener
                                          </Button>
                                          <Button className="flex-1" onClick={handleStartPractice} disabled={isPracticeStarted || isModelWarming}>
                                             Iniciar
                                          </Button>
                                       </div>

                                       <div className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-4 space-y-3">
                                          <div className="flex items-center justify-between gap-3">
                                             <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-text-tertiary)]">Catálogo</p>
                                                <h4 className="text-lg font-black text-[var(--color-text-primary)]">Buscar señas</h4>
                                             </div>
                                             <Button variant="ghost" size="sm" onClick={() => setShowCatalog(prev => !prev)}>
                                                {showCatalog ? 'Ocultar' : 'Abrir'}
                                             </Button>
                                          </div>

                                          {showCatalog ? (
                                             <>
                                                <Input
                                                   value={catalogSearchTerm}
                                                   onChange={(event) => setCatalogSearchTerm(event.target.value)}
                                                   placeholder="Buscar seña por nombre..."
                                                   leftIcon={<Search size={18} />}
                                                />
                                                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                                   {catalogCategories.map((category) => {
                                                      const isActive = selectedCatalogCategory === category.id;

                                                      return (
                                                         <button
                                                            key={category.id}
                                                            type="button"
                                                            onClick={() => setSelectedCatalogCategory(category.id)}
                                                            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                                                               isActive
                                                                  ? 'bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]'
                                                                  : 'bg-[var(--color-neutral-50)] text-[var(--color-text-primary)] border-[var(--color-neutral-200)]'
                                                            }`}
                                                         >
                                                            <span>{category.emoji}</span>
                                                            <span>{category.label}</span>
                                                         </button>
                                                      );
                                                   })}
                                                </div>
                                                <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                                                   {filteredCatalogSigns.length > 0 ? (
                                                      filteredCatalogSigns.map((sign) => (
                                                         <button
                                                            key={`${sign.category}-${sign.name}`}
                                                            type="button"
                                                            onClick={() => setSelectedCatalogSign(sign)}
                                                            className="group flex items-center gap-3 rounded-2xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] p-3 text-left transition-all hover:border-[var(--color-primary-200)] hover:bg-[var(--color-primary-50)]"
                                                         >
                                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black">
                                                               <video
                                                                  src={resolveVideoUrl(sign.videoUrl)}
                                                                  autoPlay
                                                                  loop
                                                                  muted
                                                                  playsInline
                                                                  className="h-full w-full object-contain bg-black"
                                                               />
                                                            </div>
                                                            <div className="min-w-0">
                                                               <p className="text-sm font-black text-[var(--color-text-primary)] truncate">{sign.name}</p>
                                                               <Badge variant="neutral" size="sm">{getCategoryLabel(sign.category)}</Badge>
                                                            </div>
                                                         </button>
                                                      ))
                                                   ) : (
                                                      <div className="rounded-2xl border border-dashed border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] px-4 py-8 text-center">
                                                         <BookOpen size={24} className="mx-auto mb-2 text-[var(--color-text-tertiary)]" />
                                                         <p className="text-sm font-semibold text-[var(--color-text-primary)]">Sin resultados</p>
                                                      </div>
                                                   )}
                                                </div>
                                             </>
                                          ) : (
                                             <div className="rounded-2xl border border-dashed border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] px-4 py-6 text-center">
                                                <BookOpen size={24} className="mx-auto mb-2 text-[var(--color-text-tertiary)]" />
                                                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Catálogo oculto</p>
                                                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Ábrelo cuando necesites revisar otra seña.</p>
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                 </motion.aside>
                              ) : (
                                 <div className="absolute right-4 top-1/2 z-30 -translate-y-1/2 flex flex-col items-center gap-3">
                                    <button
                                       type="button"
                                       onClick={() => setShowSidePanel(true)}
                                       title="Abrir opciones"
                                       className="w-12 h-12 rounded-full bg-black/65 flex items-center justify-center text-white shadow-lg"
                                    >
                                       <ChevronRight size={18} />
                                    </button>

                                    <button
                                       type="button"
                                       onClick={() => setShowCatalog(prev => !prev)}
                                       title="Catálogo"
                                       className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-[var(--color-text-primary)] shadow-md border border-[var(--color-neutral-200)]"
                                    >
                                       <BookOpen size={18} />
                                    </button>

                                    <button
                                       type="button"
                                       onClick={() => setShowExampleVideo(prev => !prev)}
                                       title={showExampleVideo ? 'Ocultar video' : 'Mostrar video'}
                                       className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-[var(--color-text-primary)] shadow-md border border-[var(--color-neutral-200)]"
                                    >
                                       {showExampleVideo ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                 </div>
                              )}
                           </>
                        )}
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