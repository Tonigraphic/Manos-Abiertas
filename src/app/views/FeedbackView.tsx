import { useState, useRef, useEffect } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { MessageSquare, Ear, Hand, Send, CheckCircle2, Camera, Loader2, Filter, Calendar, User, Video, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackViewProps {
  onNavigateHome?: () => void;
}

function parseReport(text: string) {
  const lines = text.split('\n');
  const getVal = (prefix: string) => {
    const line = lines.find(l => l.startsWith(prefix));
    return line ? line.substring(prefix.length).trim() : '';
  };
  
  const commentsIndex = lines.findIndex(l => l.startsWith('Comentarios:'));
  const comments = commentsIndex !== -1 ? lines.slice(commentsIndex + 1).join('\n').trim() : '';

  return {
    userName: getVal('Nombre del Colaborador:'),
    userEmail: getVal('Email:'),
    userType: getVal('Tipo de Usuario:'),
    feedbackType: getVal('Tipo de Feedback:'),
    wordSuggestion: getVal('Sugerencia de Seña:'),
    comments: comments || getVal('Comentarios:')
  };
}

const getReadableDate = (folderPath: string) => {
  try {
    const rawTs = folderPath.split('/').pop() || '';
    const parts = rawTs.split('T');
    if (parts.length === 2) {
      const datePart = parts[0];
      const timePart = parts[1].replace(/-/g, ':').replace(/:([^:]*)$/, '.$1');
      const date = new Date(`${datePart}T${timePart}`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  } catch (e) {}
  return 'Fecha reciente';
};

export function FeedbackView({ onNavigateHome }: FeedbackViewProps = {}) {
  const [activeTab, setActiveTab] = useState<'submit' | 'view'>('submit');
  const [userType, setUserType] = useState<'oyente' | 'sordo' | null>(null);
  const [feedbackType, setFeedbackType] = useState<'general' | 'correction' | 'new_word'>('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [wordSuggestion, setWordSuggestion] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [approvedSuggestions, setApprovedSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUserType, setFilterUserType] = useState<string>('all');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSuggestions = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const suggestionsRepo = import.meta.env.VITE_HF_SUGGESTIONS_REPO || 'manosabiertas/Manos-Abiertas-LSC';
      const token = import.meta.env.VITE_HF_SUGGESTIONS_TOKEN || import.meta.env.VITE_HF_TRANSLATION_TOKEN || import.meta.env.VITE_HF_TOKEN;
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`https://huggingface.co/api/models/${suggestionsRepo}/tree/main/sugerencias?t=${Date.now()}`, { 
        headers: {
          ...headers,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de sugerencias.');
      }
      const folders = await response.json();
      
      const parsedSuggestions = await Promise.all(
        folders
          .filter((f: any) => f.type === 'directory')
          .map(async (folder: any) => {
            try {
              // 1. Obtener archivos dentro del directorio
              const filesRes = await fetch(`https://huggingface.co/api/models/${suggestionsRepo}/tree/main/${folder.path}?t=${Date.now()}`, {
                headers: {
                  ...headers,
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache'
                }
              });
              if (!filesRes.ok) return null;
              const files = await filesRes.json();
              const jsonFile = files.find((file: any) => file.path.endsWith('reporte.json'));
              const txtFile = files.find((file: any) => file.path.endsWith('reporte.txt'));
              
              if (jsonFile) {
                const rawRes = await fetch(`https://huggingface.co/${suggestionsRepo}/raw/main/${jsonFile.path}?t=${Date.now()}`, {
                  headers: {
                    ...headers,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  }
                });
                if (!rawRes.ok) return null;
                const data = await rawRes.json();
                return {
                  id: folder.path,
                  userName: data.userName,
                  userEmail: data.userEmail,
                  userType: data.userType,
                  feedbackType: data.feedbackType,
                  wordSuggestion: data.wordSuggestion,
                  comments: data.comments,
                  videoUrl: data.videoBase64 || null,
                  date: getReadableDate(folder.path)
                };
              } else if (txtFile) {
                const rawRes = await fetch(`https://huggingface.co/${suggestionsRepo}/raw/main/${txtFile.path}?t=${Date.now()}`, {
                  headers: {
                    ...headers,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  }
                });
                if (!rawRes.ok) return null;
                const text = await rawRes.text();
                
                const parsed = parseReport(text);
                const mediaFile = files.find((file: any) => 
                  file.path.endsWith('.webm') || 
                  file.path.endsWith('.mp4') || 
                  file.path.endsWith('.gif')
                );
                
                return {
                  id: folder.path,
                  ...parsed,
                  videoUrl: mediaFile ? `https://huggingface.co/${suggestionsRepo}/resolve/main/${mediaFile.path}` : null,
                  date: getReadableDate(folder.path)
                };
              } else {
                return null;
              };
            } catch (e) {
              console.error("Error cargando sugerencia:", folder.path, e);
              return null;
            }
          })
      );
      
      // Filtrar los nulos y ordenar por fecha (más reciente primero)
      setApprovedSuggestions(parsedSuggestions.filter(Boolean).reverse());
    } catch (err: any) {
      console.error(err);
      setErrorMsg('No hay aportes aprobados aún o hubo un problema al conectar con Hugging Face.');
    } finally {
      setIsLoading(false);
    }
  };

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
        const data = await response.json();
        if (data.simulated) {
          console.warn("API simulada en local. Intentando conexión directa a Hugging Face para guardar los datos reales...");
          throw { isSimulated: true };
        }
        setIsSubmitted(true);
        return;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw { status: response.status, errorData };
      }
    } catch (error: any) {
      if (error && error.status) {
        if (error.status === 403) {
          alert(`❌ Error 403 (Acceso Denegado): Tu token en Vercel no tiene permisos de escritura en el repositorio de Hugging Face.\n\nPor favor:\n1. Asegúrate de crear el token con rol 'Write' (Escritura) en Hugging Face.\n2. Asegúrate de ser colaborador del repositorio destino.`);
        } else {
          alert(`❌ Error del servidor (${error.status}): ${error.errorData?.details || 'Error al procesar sugerencia.'}`);
        }
        setIsSubmitting(false);
        return;
      }

      console.warn("Fallo el backend local o está simulado. Usando fallback cliente de conexión directa a Hugging Face...");
      const token = import.meta.env.VITE_HF_SUGGESTIONS_TOKEN || import.meta.env.VITE_HF_TRANSLATION_TOKEN || import.meta.env.VITE_HF_TOKEN;
      const repoId = import.meta.env.VITE_HF_SUGGESTIONS_REPO || 'manosabiertas/Manos-Abiertas-LSC';

      if (!token) {
        console.warn("Falta configurar el token VITE_HF_TRANSLATION_TOKEN o VITE_HF_SUGGESTIONS_TOKEN en .env.local. Simulando envío para pruebas...");
        setIsSubmitted(true);
        setIsSubmitting(false);
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const folderName = `sugerencias/${timestamp}`;
      const operations: any[] = [];

      // Añadir la operación del encabezado (summary)
      operations.push({
        key: 'header',
        value: {
          summary: `Nueva retroalimentación cliente: ${feedbackType}`,
          description: `Enviado por ${userName || 'Anónimo'}`
        }
      });

      const reportData = {
        userName: userName || 'Anónimo',
        userEmail: userEmail || 'No proporcionado',
        userType,
        feedbackType,
        wordSuggestion: wordSuggestion || '',
        comments: feedbackText,
        videoBase64: videoBase64 || null
      };

      operations.push({
        key: 'file',
        value: {
          path: `${folderName}/reporte.json`,
          content: JSON.stringify(reportData, null, 2),
        }
      });

      try {
        const hfRes = await fetch(`https://huggingface.co/api/models/${repoId}/commit/main?create_pr=1`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-ndjson',
          },
          body: operations.map(x => JSON.stringify(x)).join('\n'),
        });

        if (hfRes.ok) {
          setIsSubmitted(true);
        } else {
          const errText = await hfRes.text();
          console.error("Hugging Face API direct commit error:", errText);
          if (hfRes.status === 403) {
            alert(`❌ Error 403 (Acceso Denegado): Tu token no tiene permisos de escritura en el repositorio "${repoId}".\n\nPor favor:\n1. Asegúrate de crear el token con rol 'Write' (Escritura) en Hugging Face.\n2. Asegúrate de ser colaborador del repositorio "${repoId}". Si usas uno propio, configúralo en tu .env.local como: VITE_HF_SUGGESTIONS_REPO=tu-usuario/tu-repositorio.`);
          } else {
            alert(`❌ Error al subir sugerencia a Hugging Face (${hfRes.status}).`);
          }
        }
      } catch (networkError) {
        console.error("Direct connection to Hugging Face failed:", networkError);
        alert("❌ Error de red: No se pudo conectar directamente con Hugging Face.");
      }
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

  const cancelVideo = () => {
    setRecordedBlob(null);
    stopCamera();
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)] pb-20 md:pb-0 flex flex-col bg-[var(--color-neutral-50)]">
      <div className="flex-shrink-0 p-6 sm:p-8 bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
              <MessageSquare size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">Retroalimentación</h1>
              <p className="text-sm text-neutral-500 font-medium mt-1">Ayúdanos a mejorar el vocabulario LSC</p>
            </div>
          </div>
          
          <div className="flex bg-neutral-100 p-1.5 rounded-2xl w-full sm:w-max justify-center">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'submit' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              Enviar Aporte
            </button>
            <button
              onClick={() => { setActiveTab('view'); loadSuggestions(); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'view' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              Aportes Aprobados
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'submit' ? (
              isSubmitted ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center py-20">
                  <CheckCircle2 size={80} className="text-green-500 mb-6" />
                  <h2 className="text-3xl font-bold text-neutral-800 mb-4">¡Gracias por tu aporte, {userName || 'compañero'}!</h2>
                  <p className="text-neutral-500 mb-4 max-w-md">Tu sugerencia ha sido enviada para revisión. Una vez que el administrador la apruebe, se publicará en la sección de aportes comunitarios.</p>
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
                                <div className="flex flex-col sm:flex-row gap-2 bg-neutral-100 p-1.5 rounded-2xl w-full sm:w-max">
                                  <button type="button" onClick={() => setFeedbackType('correction')} className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold transition-all ${feedbackType === 'correction' ? 'bg-white shadow-sm text-purple-700' : 'text-neutral-500 hover:text-neutral-700'}`}>
                                    Corregir una Seña
                                  </button>
                                  <button type="button" onClick={() => setFeedbackType('new_word')} className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold transition-all ${feedbackType === 'new_word' ? 'bg-white shadow-sm text-purple-700' : 'text-neutral-500 hover:text-neutral-700'}`}>
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
                                      <div className="flex gap-2">
                                        <Button type="button" onClick={retakeVideo} variant="ghost" className="text-sm border-2">Reintentar</Button>
                                        <Button type="button" onClick={cancelVideo} variant="ghost" className="text-sm text-red-500 hover:bg-red-50">Cancelar</Button>
                                      </div>
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
              )
            ) : (
              <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {/* Filtros */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Filter size={18} />
                    <span className="text-sm font-bold">Filtros:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={filterUserType}
                      onChange={(e) => setFilterUserType(e.target.value)}
                      className="px-3 py-2 bg-neutral-50 border-2 border-neutral-100 rounded-xl text-sm font-semibold outline-none text-neutral-700 focus:border-blue-400"
                    >
                      <option value="all">Todos los Roles</option>
                      <option value="sordo">Comunidad Sorda</option>
                      <option value="oyente">Comunidad Oyente</option>
                    </select>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-2 bg-neutral-50 border-2 border-neutral-100 rounded-xl text-sm font-semibold outline-none text-neutral-700 focus:border-blue-400"
                    >
                      <option value="all">Todos los Tipos</option>
                      <option value="correction">Correcciones</option>
                      <option value="new_word">Vocabulario Sugerido</option>
                      <option value="general">Comentarios Generales</option>
                    </select>
                    <button
                      onClick={loadSuggestions}
                      className="p-2 bg-neutral-50 hover:bg-neutral-100 border-2 border-neutral-100 rounded-xl text-neutral-600 transition-colors"
                      title="Actualizar"
                    >
                      <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                    <Loader2 className="animate-spin mb-4" size={40} />
                    <p className="font-medium">Cargando aportes aprobados...</p>
                  </div>
                ) : errorMsg ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
                    <p className="text-neutral-500 font-medium mb-4">{errorMsg}</p>
                    <Button onClick={loadSuggestions} variant="outline" className="mx-auto">Reintentar</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {approvedSuggestions
                      .filter(item => {
                        const matchUser = filterUserType === 'all' || item.userType?.toLowerCase() === filterUserType;
                        const matchType = filterType === 'all' || item.feedbackType?.toLowerCase() === filterType;
                        return matchUser && matchType;
                      })
                      .map((item) => {
                        const isSordo = item.userType?.toLowerCase() === 'sordo';
                        const isNewWord = item.feedbackType?.toLowerCase() === 'new_word';
                        const isCorrection = item.feedbackType?.toLowerCase() === 'correction';
                        
                        let badgeColor = 'bg-blue-100 text-blue-700';
                        let typeText = 'Comentario General';
                        if (isNewWord) {
                          badgeColor = 'bg-green-100 text-green-700 border-green-200';
                          typeText = 'Vocabulario Sugerido';
                        } else if (isCorrection) {
                          badgeColor = 'bg-red-100 text-red-700 border-red-200';
                          typeText = 'Corrección de Seña';
                        }

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div className="p-6 sm:p-8 space-y-4">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-2xl ${isSordo ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    <User size={20} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-neutral-800">{item.userName || 'Colaborador Anónimo'}</h4>
                                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${isSordo ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                      {isSordo ? 'Persona Sorda' : 'Persona Oyente'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 text-right">
                                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badgeColor}`}>
                                    {typeText}
                                  </span>
                                  <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                                    <Calendar size={12} /> {item.date}
                                  </span>
                                </div>
                              </div>

                              <div className="pt-2">
                                {isNewWord && item.wordSuggestion && (
                                  <div className="mb-3 p-3 bg-green-50 text-green-900 border border-green-100 rounded-2xl font-bold">
                                    💡 Palabra Sugerida: <span className="text-green-700 font-black">{item.wordSuggestion}</span>
                                  </div>
                                )}
                                <p className="text-neutral-600 leading-relaxed font-medium whitespace-pre-wrap">
                                  {item.comments}
                                </p>
                              </div>

                              {item.videoUrl && (
                                <div className="mt-4 p-4 border border-neutral-100 rounded-3xl bg-neutral-50 flex flex-col items-center">
                                  <div className="flex items-center gap-2 mb-3 text-neutral-700 self-start">
                                    <Video size={16} />
                                    <span className="text-xs font-bold">Demostración en Señas</span>
                                  </div>
                                  <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-black aspect-video shadow-inner">
                                    <video src={item.videoUrl} controls className="w-full h-full object-cover"></video>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    {approvedSuggestions.filter(item => {
                      const matchUser = filterUserType === 'all' || item.userType?.toLowerCase() === filterUserType;
                      const matchType = filterType === 'all' || item.feedbackType?.toLowerCase() === filterType;
                      return matchUser && matchType;
                    }).length === 0 && (
                      <div className="text-center py-20 bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
                        <p className="text-neutral-400 font-medium">No se encontraron aportes con los filtros seleccionados.</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
