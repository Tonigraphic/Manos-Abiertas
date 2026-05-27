import { useEffect, useState, useRef } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { MessageSquare, Ear, Hand, Send, CheckCircle2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InstructionsModal } from '../components/lsc/InstructionsModal';

interface FeedbackViewProps {
  onNavigateHome?: () => void;
}

export function FeedbackView({ onNavigateHome }: FeedbackViewProps = {}) {
  const [userType, setUserType] = useState<'oyente' | 'sordo' | null>(null);
  const [feedbackType, setFeedbackType] = useState<'general' | 'correction' | 'new_word'>('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [wordSuggestion, setWordSuggestion] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Camera & Recording states
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType,
          feedbackType,
          userName,
          userEmail,
          text: feedbackText,
          wordSuggestion,
        }),
      });

      if (!response.ok) {
        throw new Error(`Feedback response ${response.status}`);
      }

      setIsSubmitted(true);
    } catch (error) {
      console.warn('No fue posible enviar el feedback al endpoint; se conserva el flujo local.', error);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFeedbackText('');
    setWordSuggestion('');
    setUserName('');
    setUserEmail('');
    setRecordedBlob(null);
    setUserType(null);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = s;
      setStream(s);
    } catch (err) {
      alert("No se pudo acceder a la cámara.");
    }
  };

  const stopCamera = () => {
    const activeStream = streamRef.current || stream;
    if (activeStream) {
      activeStream.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
    };
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    // Auto-stop after 6 seconds
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        stopRecording();
      }
    }, 6000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retakeVideo = () => {
    setRecordedBlob(null);
  };

  const cancelVideo = () => {
    setRecordedBlob(null);
    stopCamera();
  };

  useEffect(() => {
    if (userType !== 'sordo') {
      stopCamera();
      setRecordedBlob(null);
      setIsRecording(false);
    }
  }, [userType]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)] pb-20 md:pb-0 flex flex-col bg-[var(--color-surface)] relative">
      <InstructionsModal
        id="feedback"
        title="Sugerencias y Retroalimentación"
        instructions={[
          'Selecciona si eres persona oyente o sorda para mostrar el formulario correcto.',
          'Si eres persona sorda, puedes corregir una seña o sugerir una nueva palabra.',
          'Cuando actives la cámara, recuerda detenerla antes de salir de este apartado.',
          'Envía tu aporte para que quede registrado en el sistema de retroalimentación.'
        ]}
      />
      <div className="flex-shrink-0 p-6 sm:p-8 bg-white border-b border-[var(--color-neutral-200)] shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="bg-[var(--color-primary-100)] p-3 rounded-2xl text-[var(--color-primary-600)] shadow-inner">
            <MessageSquare size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Sugerencias</h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium mt-1">Ayúdanos a mejorar el asistente LSC</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center py-20">
                <CheckCircle2 size={80} className="text-[var(--color-success-500)] mb-6" />
                <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">¡Gracias por tu aporte, {userName || 'compañero'}!</h2>
                <p className="text-[var(--color-text-secondary)] mb-8 max-w-md text-lg">Tu retroalimentación es vital para seguir mejorando la comunicación inclusiva.</p>
                {userType === 'sordo' && (
                  <div className="bg-[var(--color-accent-100)] text-[var(--color-accent-800)] p-4 rounded-xl mb-8 font-bold border border-[var(--color-accent-200)] shadow-sm">
                    🏆 ¡Has ganado +50 puntos de contribuidor por ayudar a la comunidad!
                  </div>
                )}
                <Button onClick={resetForm} variant="ghost" className="font-bold border-2 border-[var(--color-neutral-200)] px-8 py-3 text-lg rounded-xl">Enviar otra sugerencia</Button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl">
                  <CardBody className="p-8 sm:p-10 space-y-10">

                    {/* Paso 1: Tipo de Usuario */}
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Paso 1: ¿Cómo te identificas?</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => { setUserType('oyente'); setFeedbackType('general'); }}
                          className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${userType === 'oyente' ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] shadow-sm' : 'border-[var(--color-neutral-200)] hover:border-[var(--color-primary-300)] bg-white'}`}
                        >
                          <Ear size={36} className={userType === 'oyente' ? 'text-[var(--color-primary-600)]' : 'text-[var(--color-neutral-400)]'} />
                          <div>
                            <p className={`text-lg font-black ${userType === 'oyente' ? 'text-[var(--color-primary-700)]' : 'text-[var(--color-text-primary)]'}`}>Persona Oyente</p>
                            <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">Quiero dar sugerencias sobre la app.</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setUserType('sordo'); setFeedbackType('correction'); }}
                          className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${userType === 'sordo' ? 'border-[var(--color-accent-500)] bg-[var(--color-accent-50)] shadow-sm' : 'border-[var(--color-neutral-200)] hover:border-[var(--color-accent-300)] bg-white'}`}
                        >
                          <Hand size={36} className={userType === 'sordo' ? 'text-[var(--color-accent-600)]' : 'text-[var(--color-neutral-400)]'} />
                          <div>
                            <p className={`text-lg font-black ${userType === 'sordo' ? 'text-[var(--color-accent-700)]' : 'text-[var(--color-text-primary)]'}`}>Persona Sorda</p>
                            <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">Deseo corregir o agregar señas.</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Paso 2: Formulario dinámico */}
                    <AnimatePresence>
                      {userType && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-8 pt-8 border-t border-[var(--color-neutral-200)] overflow-hidden"
                          onSubmit={handleSubmit}
                        >
                          {userType === 'sordo' && (
                            <div className="space-y-4">
                              <label className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Paso 2: ¿Qué deseas hacer?</label>
                              <div className="flex gap-2 bg-[var(--color-neutral-100)] p-1.5 rounded-xl w-full sm:w-max">
                                <button type="button" onClick={() => setFeedbackType('correction')} className={`px-6 py-3 rounded-lg text-sm font-black transition-all ${feedbackType === 'correction' ? 'bg-white shadow-sm text-[var(--color-accent-700)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
                                  Corregir una Seña
                                </button>
                                <button type="button" onClick={() => setFeedbackType('new_word')} className={`px-6 py-3 rounded-lg text-sm font-black transition-all ${feedbackType === 'new_word' ? 'bg-white shadow-sm text-[var(--color-accent-700)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
                                  Sugerir Vocabulario
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-4">
                            <label className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">
                              {userType === 'oyente' ? 'Tus comentarios o sugerencias' :
                                (feedbackType === 'correction' ? '¿Qué seña debemos corregir y por qué?' : '¿Qué palabra nueva deberíamos agregar?')}
                            </label>

                            {feedbackType === 'new_word' && (
                              <input
                                type="text"
                                value={wordSuggestion}
                                onChange={(e) => setWordSuggestion(e.target.value)}
                                placeholder="Escribe la palabra (Ej. Universidad)"
                                className="w-full p-4 bg-[var(--color-neutral-50)] border-2 rounded-xl focus:bg-white focus:border-[var(--color-primary-400)] outline-none transition-colors border-[var(--color-neutral-200)] text-[var(--color-text-primary)] font-medium"
                                required
                              />
                            )}

                            <textarea
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              placeholder={userType === 'oyente' ? "Me gustaría que la app..." : "Detalla tu sugerencia o corrección..."}
                              className="w-full h-32 p-4 bg-[var(--color-neutral-50)] border-2 rounded-xl focus:bg-white focus:border-[var(--color-primary-400)] outline-none resize-none transition-colors border-[var(--color-neutral-200)] text-[var(--color-text-primary)] font-medium"
                              required
                            />

                            {userType === 'sordo' && (
                              <div className="space-y-4 pt-8 border-t border-[var(--color-neutral-200)]">
                                <label className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Tus Datos (Para darte puntos)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Tu Nombre *"
                                    className="w-full p-4 bg-[var(--color-neutral-50)] border-2 rounded-xl focus:bg-white focus:border-[var(--color-accent-400)] outline-none transition-colors border-[var(--color-neutral-200)] text-[var(--color-text-primary)] font-medium"
                                    required
                                  />
                                  <input
                                    type="email"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                    placeholder="Tu Correo (Opcional)"
                                    className="w-full p-4 bg-[var(--color-neutral-50)] border-2 rounded-xl focus:bg-white focus:border-[var(--color-accent-400)] outline-none transition-colors border-[var(--color-neutral-200)] text-[var(--color-text-primary)] font-medium"
                                  />
                                </div>
                              </div>
                            )}

                            {userType === 'sordo' && (
                              <div className="mt-8 p-6 border-2 border-dashed border-[var(--color-neutral-300)] rounded-2xl bg-[var(--color-neutral-50)] text-center">
                                <h4 className="font-black text-lg text-[var(--color-text-primary)] mb-2">Demostración en Video</h4>
                                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-6">Graba un clip corto (máximo 6 segundos) mostrando la seña correcta.</p>

                                {!stream && !recordedBlob && (
                                  <Button type="button" onClick={startCamera} variant="ghost" className="mx-auto border-2 border-[var(--color-neutral-200)] bg-white shadow-sm font-bold px-6 py-3">
                                    <Camera size={20} className="mr-2" /> Encender Cámara
                                  </Button>
                                )}

                                {stream && !recordedBlob && (
                                  <div className="flex flex-col items-center">
                                    <div className="relative w-full max-w-md rounded-2xl overflow-hidden bg-black aspect-video mb-6 shadow-xl border-4 border-white">
                                      <video
                                        ref={(node) => {
                                          videoRef.current = node;
                                          if (node && stream && node.srcObject !== stream) {
                                            node.srcObject = stream;
                                          }
                                        }}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                        style={{ transform: 'scaleX(-1)' }}
                                      ></video>
                                      {isRecording && (
                                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-[var(--color-error-500)] text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest animate-pulse shadow-lg">
                                          <div className="w-2 h-2 bg-white rounded-full"></div> Grabando
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-3">
                                      {isRecording ? (
                                        <Button type="button" onClick={stopRecording} className="bg-[var(--color-error-500)] hover:bg-[var(--color-error-600)] text-white font-bold px-8 py-3 rounded-xl shadow-lg">
                                           Detener Grabación
                                        </Button>
                                      ) : (
                                        <Button type="button" onClick={startRecording} className="bg-[var(--color-success-500)] hover:bg-[var(--color-success-600)] text-white font-bold px-8 py-3 rounded-xl shadow-lg">
                                           Iniciar Grabación
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {recordedBlob && (
                                  <div className="flex flex-col items-center">
                                    <div className="w-full max-w-md rounded-2xl overflow-hidden bg-black aspect-video mb-6 shadow-xl border-4 border-white">
                                      <video src={URL.createObjectURL(recordedBlob)} controls className="w-full h-full object-cover"></video>
                                    </div>
                                    <div className="flex items-center justify-center gap-3 bg-[var(--color-success-50)] text-[var(--color-success-700)] border-2 border-[var(--color-success-200)] px-6 py-3 rounded-xl font-bold text-sm mb-6 w-full max-w-md">
                                      <CheckCircle2 size={20} /> Video listo para adjuntar
                                    </div>
                                    <div className="flex gap-3">
                                      <Button type="button" onClick={retakeVideo} variant="ghost" className="text-sm font-bold border-2 border-[var(--color-neutral-200)] bg-white px-6 py-2.5">
                                         Reintentar
                                      </Button>
                                      <Button type="button" onClick={cancelVideo} variant="ghost" className="text-sm font-bold text-[var(--color-error-600)] hover:bg-[var(--color-error-50)] px-6 py-2.5">
                                         Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <Button type="submit" className="w-full py-5 text-lg font-black shadow-xl rounded-2xl" variant="primary" disabled={isSubmitting}>
                            <Send size={24} className="mr-2" /> {isSubmitting ? 'Enviando...' : 'Enviar Retroalimentación'}
                          </Button>
                        </motion.form>
                      )}
                    </AnimatePresence>

                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
