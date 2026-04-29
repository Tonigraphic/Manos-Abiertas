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
  const [wordSuggestion, setWordSuggestion] = useState('');
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let gifBase64 = null;
    let gifName = null;

    if (gifFile) {
      // Convertir el archivo a Base64 para enviarlo a la API
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(gifFile);
      gifBase64 = await base64Promise;
      gifName = gifFile.name;
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          feedbackType,
          text: feedbackText,
          wordSuggestion,
          gifBase64,
          gifName
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
    setGifFile(null);
    setUserType(null);
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
                <h2 className="text-3xl font-bold text-neutral-800 mb-4">¡Gracias por tu aporte!</h2>
                <p className="text-neutral-500 mb-8 max-w-md">Tu retroalimentación es vital para seguir mejorando la comunicación inclusiva en la Universidad.</p>
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
                              <div className="mt-4 p-4 border-2 border-dashed border-neutral-300 rounded-xl bg-neutral-50">
                                <label className="flex flex-col items-center justify-center cursor-pointer text-neutral-500 hover:text-purple-600 transition-colors">
                                  <Camera size={32} className="mb-2" />
                                  <span className="font-bold text-sm">Adjuntar GIF de demostración</span>
                                  <span className="text-xs text-neutral-400 mt-1">(Máximo 6 segundos / 5MB)</span>
                                  <input 
                                    type="file" 
                                    accept=".gif" 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                  />
                                </label>
                                {gifFile && (
                                  <div className="mt-3 bg-purple-100 text-purple-700 p-2 rounded-lg text-xs font-bold text-center">
                                    Archivo seleccionado: {gifFile.name}
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
