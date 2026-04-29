import { useState } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { MessageSquare, Ear, Hand, Send, CheckCircle2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackViewProps {
  onNavigateHome?: () => void;
}

export function FeedbackView({ onNavigateHome }: FeedbackViewProps = {}) {
  const [userType, setUserType] = useState<'oyente' | 'sordo' | null>(null);
  const [feedbackType, setFeedbackType] = useState<'general' | 'correction' | 'new_word'>('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let videoBase64 = null;
    let videoName = null;

    if (recordedBlob) {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(recordedBlob);
      videoBase64 = await base64Promise;
      videoName = `grabacion_${Date.now()}.webm`;
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          feedbackType,
          userName,
          userEmail,
          text: feedbackText,
          wordSuggestion,
          gifBase64: videoBase64,
          gifName: videoName
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert("Hubo un error enviando la retroalimentación. Inténtalo más tarde.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al enviar el formulario.");
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
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      alert("No se pudo acceder a la cámara.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
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
    
    // Auto-stop after 6 seconds to prevent huge files
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'image/gif') {
        if (file.size <= 5 * 1024 * 1024) { // Max 5MB aprox para 6s
          setGifFile(file);
        } else {
          alert('El archivo es muy pesado. Por favor sube un GIF de máximo 5MB (aprox. 6 segundos).');
        }
      } else {
        alert('Solo se permiten archivos en formato GIF.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col bg-[var(--color-neutral-50)]">
      <div className="flex-shrink-0 p-6 sm:p-8 bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
            <MessageSquare size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Retroalimentación</h1>
            <p className="text-sm text-neutral-500 font-medium mt-1">Ayúdanos a mejorar el asistente LSC</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center py-20">
                <CheckCircle2 size={80} className="text-green-500 mb-6" />
                <h2 className="text-3xl font-bold text-neutral-800 mb-4">¡Gracias por tu aporte, {userName || 'compañero'}!</h2>
                <p className="text-neutral-500 mb-4 max-w-md">Tu retroalimentación es vital para seguir mejorando la comunicación inclusiva en la Universidad.</p>
                {userType === 'sordo' && (
                  <div className="bg-yellow-100 text-yellow-800 p-4 rounded-xl mb-8 font-bold border border-yellow-200">
                    🏆 ¡Has ganado +50 puntos de contribuidor por ayudar a la comunidad!
                  </div>
                )}
                <Button onClick={resetForm} variant="outline" className="font-bold border-2">Enviar otra respuesta</Button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardBody className="p-6 sm:p-8 space-y-8">
                    
                    {/* Paso 1: Tipo de Usuario */}
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Paso 1: ¿Cómo te identificas?</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                          type="button"
                          onClick={() => { setUserType('oyente'); setFeedbackType('general'); }}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${userType === 'oyente' ? 'border-blue-500 bg-blue-50' : 'border-neutral-100 hover:border-blue-200'}`}
                        >
                          <Ear size={32} className={userType === 'oyente' ? 'text-blue-500' : 'text-neutral-400'} />
                          <div>
                            <p className={`font-bold ${userType === 'oyente' ? 'text-blue-700' : 'text-neutral-700'}`}>Persona Oyente</p>
                            <p className="text-xs text-neutral-500 mt-1">Deseo dar sugerencias sobre la app.</p>
                          </div>
                        </button>

                        <button 
                          type="button"
                          onClick={() => { setUserType('sordo'); setFeedbackType('correction'); }}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${userType === 'sordo' ? 'border-purple-500 bg-purple-50' : 'border-neutral-100 hover:border-purple-200'}`}
                        >
                          <Hand size={32} className={userType === 'sordo' ? 'text-purple-500' : 'text-neutral-400'} />
                          <div>
                            <p className={`font-bold ${userType === 'sordo' ? 'text-purple-700' : 'text-neutral-700'}`}>Persona Sorda</p>
                            <p className="text-xs text-neutral-500 mt-1">Deseo corregir o agregar señas.</p>
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
                          className="space-y-6 pt-4 border-t border-neutral-100"
                          onSubmit={handleSubmit}
                        >
                          {userType === 'sordo' && (
                            <div className="space-y-4">
                              <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Paso 2: ¿Qué deseas hacer?</label>
                              <div className="flex gap-2 bg-neutral-100 p-1 rounded-xl w-full sm:w-max">
                                <button type="button" onClick={() => setFeedbackType('correction')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${feedbackType === 'correction' ? 'bg-white shadow-sm text-purple-700' : 'text-neutral-500 hover:text-neutral-700'}`}>
                                  Corregir una Seña
                                </button>
                                <button type="button" onClick={() => setFeedbackType('new_word')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${feedbackType === 'new_word' ? 'bg-white shadow-sm text-purple-700' : 'text-neutral-500 hover:text-neutral-700'}`}>
                                  Sugerir Vocabulario
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-4">
                            <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                              {userType === 'oyente' ? 'Tus comentarios o sugerencias' : 
                               (feedbackType === 'correction' ? '¿Qué seña debemos corregir y por qué?' : '¿Qué palabra nueva deberíamos agregar?')}
                            </label>
                            
                            {feedbackType === 'new_word' && (
                              <input 
                                type="text" 
                                value={wordSuggestion}
                                onChange={(e) => setWordSuggestion(e.target.value)}
                                placeholder="Escribe la palabra (Ej. Universidad)"
                                className="w-full p-4 bg-neutral-50 border-2 rounded-xl focus:bg-white focus:border-purple-400 outline-none transition-colors border-neutral-100 text-neutral-800"
                                required
                              />
                            )}

                            <textarea
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              placeholder={userType === 'oyente' ? "Me gustaría que la app..." : "Detalla tu sugerencia o corrección..."}
                              className="w-full h-32 p-4 bg-neutral-50 border-2 rounded-xl focus:bg-white focus:border-[var(--color-primary-400)] outline-none resize-none transition-colors border-neutral-100 text-neutral-800"
                              required
                            />

                            {userType === 'sordo' && (
                              <div className="space-y-4 pt-4 border-t border-neutral-100">
                                <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Tus Datos (Para darte puntos)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <input 
                                    type="text" 
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Tu Nombre"
                                    className="w-full p-4 bg-neutral-50 border-2 rounded-xl focus:bg-white focus:border-purple-400 outline-none transition-colors border-neutral-100 text-neutral-800"
                                    required
                                  />
                                  <input 
                                    type="email" 
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                    placeholder="Tu Correo (Opcional)"
                                    className="w-full p-4 bg-neutral-50 border-2 rounded-xl focus:bg-white focus:border-purple-400 outline-none transition-colors border-neutral-100 text-neutral-800"
                                  />
                                </div>
                              </div>
                            )}

                            {userType === 'sordo' && (
                              <div className="mt-4 p-4 border-2 border-neutral-200 rounded-xl bg-neutral-50 text-center">
                                <h4 className="font-bold text-neutral-700 mb-2">Demostración en Video</h4>
                                <p className="text-xs text-neutral-500 mb-4">Graba un clip corto (máximo 6 segundos) mostrando la seña correcta.</p>
                                
                                {!stream && !recordedBlob && (
                                  <Button type="button" onClick={startCamera} variant="outline" className="mx-auto">
                                    <Camera size={18} className="mr-2" /> Encender Cámara
                                  </Button>
                                )}

                                {stream && !recordedBlob && (
                                  <div className="flex flex-col items-center">
                                    <div className="relative w-full max-w-sm rounded-lg overflow-hidden bg-black aspect-video mb-4 shadow-inner">
                                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }}></video>
                                      {isRecording && (
                                        <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                                          <div className="w-2 h-2 bg-white rounded-full"></div> Grabando...
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      {isRecording ? (
                                        <Button type="button" onClick={stopRecording} variant="error">Detener Grabación</Button>
                                      ) : (
                                        <Button type="button" onClick={startRecording} variant="primary">Iniciar Grabación</Button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {recordedBlob && (
                                  <div className="flex flex-col items-center">
                                    <div className="w-full max-w-sm rounded-lg overflow-hidden bg-black aspect-video mb-4 shadow-inner">
                                      <video src={URL.createObjectURL(recordedBlob)} controls className="w-full h-full object-cover"></video>
                                    </div>
                                    <div className="flex items-center gap-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold text-sm mb-4">
                                      <CheckCircle2 size={18} /> Video listo para enviar
                                    </div>
                                    <Button type="button" onClick={retakeVideo} variant="ghost" className="text-sm border-2">Volver a grabar</Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <Button type="submit" className="w-full py-5 text-lg font-bold shadow-lg" variant={userType === 'sordo' ? 'primary' : 'primary'} disabled={isSubmitting}>
                            <Send size={20} className="mr-2" /> {isSubmitting ? 'Enviando...' : 'Enviar Retroalimentación'}
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
