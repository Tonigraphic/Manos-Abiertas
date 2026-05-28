import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Camera, CameraOff, RefreshCw, BarChart2, Target, Trophy, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useLSCRecognition } from '../../hooks/useLSCRecognition';
import { signRecognitionService } from '../../services/signRecognitionService';
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

   const processedRecognitionRef = useRef<string>('');
   const lastNonMatchRef = useRef<string>('');
   const awaitingResetRef = useRef(false);
   const completionTimerRef = useRef<number | null>(null);
   const advanceTimerRef = useRef<number | null>(null);
   const handsDownTimerRef = useRef<number | null>(null);
   const latestHandsDetectedRef = useRef(0);
   const latestCurrentIndexRef = useRef(0);

   useEffect(() => {
      latestHandsDetectedRef.current = recState.handsDetected;
   }, [recState.handsDetected]);

   useEffect(() => {
      latestCurrentIndexRef.current = currentIndex;
   }, [currentIndex]);

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
         colors: 'Colores',
         greetings: 'Saludos',
         office: 'Oficina',
         design: 'Diseño',
      };

      return labels[category] || category;
   };

   const normalizeSign = (value: string) => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

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
         awaitingResetRef.current = false;
         stopRecognition();
      };
   }, [stopRecognition]);

   useEffect(() => {
      if (!isPracticeStarted || isCompleting || !currentSign) return;

      if (awaitingResetRef.current) {
         if (recState.handsDetected === 0) {
            if (!handsDownTimerRef.current) {
               setStatusMessage(`Correcto: ${currentSign.name}. Baja las manos para cargar la siguiente seña.`);
               handsDownTimerRef.current = window.setTimeout(() => {
                  handsDownTimerRef.current = null;
                  if (!awaitingResetRef.current || !isPracticeStarted || isCompleting) return;
                  if (latestHandsDetectedRef.current !== 0) return;

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
      const matchKey = `${currentIndex}:${target}`;
      const nonMatchKey = `${currentIndex}:${detected}`;

      if (detected !== target) {
         if (lastNonMatchRef.current !== nonMatchKey) {
            lastNonMatchRef.current = nonMatchKey;
            setStatusMessage(`Mantén la seña objetivo: ${currentSign.name}`);
         }
         return;
      }

      if (processedRecognitionRef.current === matchKey) return;
      processedRecognitionRef.current = matchKey;
      lastNonMatchRef.current = '';

      if (completionTimerRef.current) {
         window.clearTimeout(completionTimerRef.current);
         completionTimerRef.current = null;
      }

      setAttempts(prev => prev + 1);

      setCorrectAnswers(prev => prev + 1);
      setStatusMessage(`Correcto: ${currentSign.name}. Baja las manos para cargar la siguiente seña.`);
      awaitingResetRef.current = true;
      setIsAdvancing(true);
   }, [currentIndex, currentSign, isCompleting, isPracticeStarted, practiceSigns.length, recState.currentSign, recState.handsDetected]);

   const confidence = recState.currentSign ? Math.round(recState.currentSign.confidence * 100) : 0;
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
                     <Card className="flex-1 border-none shadow-lg bg-white overflow-hidden flex flex-col">
                        <CardBody className="p-6 flex flex-col h-full items-center text-center">
                           <p className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Seña objetivo</p>
                           <h2 className={`text-4xl font-black text-[var(--color-primary-600)] mb-3 transition-all duration-300 ${isAdvancing ? 'opacity-60 scale-95' : 'opacity-100 scale-100'}`}>
                              {currentSign?.name ?? 'Sin ejercicio'}
                           </h2>
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
                                <h3 className="text-2xl font-black text-[var(--color-text-primary)] transition-all duration-300 text-center leading-tight">
                                   {displayedDetectionLabel}
                                </h3>
                                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{statusMessage}</p>
                           </div>

                           <div className="w-full mt-auto">
                              <p className="text-center text-sm font-bold text-[var(--color-text-secondary)] mb-3">Confianza</p>
                              <div className="relative w-32 h-32 mx-auto">
                                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-neutral-100)" strokeWidth="10" />
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-success-500)" strokeWidth="10" strokeDasharray="283" strokeDashoffset={283 - (283 * confidence) / 100} className="transition-all duration-1000" />
                                 </svg>
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-black text-[var(--color-success-700)]">{confidence}%</span>
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
    </div>
  );
}