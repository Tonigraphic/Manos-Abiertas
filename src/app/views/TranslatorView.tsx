import { useState, useRef, useEffect } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Send, Languages, Mic, Volume2, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InstructionsModal } from '../components/lsc/InstructionsModal';
import { translateLSCtoSpanish } from '../../lib/translationEngine';
import { LOCAL_TRANSLATION_MODEL, markLocalModelTimeout, shouldAttemptBrowserModel, translateWithLocalModel } from '../../services/localTranslationService';

interface TranslatorViewProps {
  onNavigateHome?: () => void;
}

type ApiTranslateResponse = {
  success?: boolean;
  provider?: string;
  model?: string;
  mode?: string;
  reason?: string;
  debugReason?: string;
  tokenSource?: string;
  translatedText?: string;
};

export function TranslatorView({ onNavigateHome }: TranslatorViewProps = {}) {
  const [translatorInput, setTranslatorInput] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translationProvider, setTranslationProvider] = useState('');
  const [translationModel, setTranslationModel] = useState('');
  const [translationReason, setTranslationReason] = useState('');
  const [translationTokenSource, setTranslationTokenSource] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const normalizeWord = (word: string) =>
    word
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase();

  const cleanRepeatedWords = (text: string) => {
    const words = text.split(/\s+/).filter(Boolean);
    const result: string[] = [];
    for (const word of words) {
      const prev = result[result.length - 1];
      if (prev && normalizeWord(prev) === normalizeWord(word)) continue;
      result.push(word);
    }
    return result.join(' ').replace(/\s+([,.;!?])/g, '$1').trim();
  };

  // Use SpeechRecognition API for Voice-to-Text
  const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const recognitionRef = useRef<any>(null);
  const textBeforeDictationRef = useRef<string>('');

  const formatBackendReason = (result: ApiTranslateResponse): string => {
    const reason = String(result.reason || '').trim();
    if (!reason) return 'Traducción resuelta por el backend';

    if (result.provider === 'huggingface') {
      return result.mode === 'classic-inference'
        ? 'Corrección IA aplicada mediante endpoint clásico de Hugging Face'
        : 'Corrección IA aplicada por Hugging Face';
    }

    if (/no se obtuvo respuesta válida de hugging face/i.test(reason)) {
      return 'Servicio IA temporalmente no disponible; se aplicó corrección local.';
    }

    if (/token no configurado/i.test(reason)) {
      return 'Servicio IA no configurado en este entorno; se aplicó corrección local.';
    }

    if (/timeout|red|conectar|network/i.test(reason)) {
      return 'Conectividad inestable con el servicio IA; se aplicó corrección local.';
    }

    return reason;
  };

  const isTransientBackendFailure = (result: ApiTranslateResponse): boolean => {
    const reason = String(result.reason || '').trim();
    const debugReason = String(result.debugReason || '').trim();
    const combined = `${reason} ${debugReason}`;

    return /fetch failed|network|timeout|conectar|caída|runtime|temporalmente no disponible/i.test(combined);
  };

  const getServerTimeoutMs = (inputText: string): number => {
    const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

    if (inputText.length > 600 || wordCount > 120) return 45000;
    if (inputText.length > 300 || wordCount > 60) return 30000;
    return 14000;
  };

  const requestServerTranslation = async (inputText: string, timeoutMs: number): Promise<ApiTranslateResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`API /api/translate respondió ${response.status}`);
      }

      const data = await response.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Respuesta inválida del backend de traducción');
      }

      return data as ApiTranslateResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const requestServerTranslationWithRetry = async (inputText: string): Promise<ApiTranslateResponse> => {
    const maxAttempts = 3;
    const timeoutMs = getServerTimeoutMs(inputText);
    const retryDelay = timeoutMs > 14000 ? 900 : 450;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await requestServerTranslation(inputText, timeoutMs);

        if (result.provider === 'huggingface' || !isTransientBackendFailure(result) || attempt === maxAttempts) {
          return result;
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw new Error('No fue posible completar la traducción del backend');
  };

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-CO';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const baseText = textBeforeDictationRef.current.trim();
        const dictationText = (finalTranscript + ' ' + interimTranscript).replace(/\s+/g, ' ').trim();
        setTranslatorInput(baseText ? `${baseText} ${dictationText}` : dictationText);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        textBeforeDictationRef.current = translatorInput;
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Tu navegador no soporta el reconocimiento de voz.");
      }
    }
  };

  const handleTranslate = async () => {
    const inputText = translatorInput.trim();
    if (!inputText) return;

    setIsTranslating(true);
    setTranslationTokenSource('');

    try {
      try {
        const serverResult = await requestServerTranslationWithRetry(inputText);
        const serverText = cleanRepeatedWords(String(serverResult.translatedText || '').trim());

        if (serverText) {
          setTranslatedText(serverText);
          setTranslationProvider(serverResult.provider || 'huggingface');
          setTranslationModel(serverResult.model || '');
          setTranslationReason(formatBackendReason(serverResult));
          setTranslationTokenSource(serverResult.tokenSource || '');
          return;
        }
      } catch (apiError) {
        console.warn('Translation API failed:', apiError);
      }

      let translated = '';
      let localErrorMessage = '';

      if (shouldAttemptBrowserModel()) {
        try {
          translated = await translateWithLocalModel(inputText);
        } catch (localError) {
          console.warn('Local model translation failed:', localError);
          localErrorMessage = localError instanceof Error ? localError.message : 'Error desconocido del modelo local';
          if (/timeout|espera agotado|red lenta/i.test(localErrorMessage)) {
            markLocalModelTimeout();
          }
        }
      } else {
        localErrorMessage = 'Red no apta para descargar el modelo local en navegador';
      }

      const normalized = translated.trim();
      const finalText = cleanRepeatedWords(
        normalized && normalized !== inputText ? normalized : translateLSCtoSpanish(inputText)
      );

      setTranslatedText(finalText);
      setTranslationProvider(normalized && normalized !== inputText ? 'local-onnx' : 'local-fallback');
      setTranslationModel(LOCAL_TRANSLATION_MODEL);
      setTranslationTokenSource('');
      setTranslationReason(normalized && normalized !== inputText
        ? 'Modelo pequeño ejecutado en el navegador'
        : localErrorMessage
          ? `Modelo local no disponible temporalmente: ${localErrorMessage}. Se usó la heurística local.`
          : 'El modelo local no produjo una mejora clara; se usó la heurística local');
    } catch (error) {
      console.error('Translation request failed:', error);
      setTranslationProvider('local-fallback');
      setTranslationModel('');
      setTranslationReason('No se pudo ejecutar el modelo local');
      setTranslatedText(translateLSCtoSpanish(inputText));
    } finally {
      setIsTranslating(false);
    }
  };

  const playAudio = () => {
    const textToPlay = translatedText || translatorInput;
    if (!textToPlay) return;
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(textToPlay);
    utterance.lang = 'es-CO';
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)] pb-20 md:pb-0 flex flex-col bg-[var(--color-neutral-50)] relative">
      <InstructionsModal 
        id="translator"
        title="Traductor LSC a Español"
        instructions={[
          "Escribe las señas escritas en español simplificado (sin conectores) o usa el micrófono para dictar.",
          "Haz clic en 'Traducir y Corregir' para ver la estructura gramatical del español correcto.",
          "Puedes reproducir el audio del texto corregido para comunicarte oralmente si lo necesitas.",
          "Esta herramienta ayuda a corregir la estructura del español, facilitando la redacción autónoma de personas sordas."
        ]}
      />

      <div className="flex-shrink-0 p-6 sm:p-8 bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-primary-100)] p-3 rounded-2xl text-[var(--color-primary-600)]">
              <Languages size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">Traductor LSC a Español</h1>
              <p className="text-sm text-neutral-500 font-medium mt-1">Convierte español sordo (sin conectores) a español correcto</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardBody className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4 sm:gap-0">
                <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                  Lengua de Señas Escrita (sin conectores)
                </label>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={playAudio}
                    className={`p-3 sm:p-2 rounded-xl transition-all flex items-center justify-center ${isPlaying ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                    title="Reproducir texto"
                  >
                    <Volume2 size={20} className={isPlaying ? 'animate-pulse' : ''} />
                  </button>
                  <button 
                    onClick={toggleRecording}
                    className={`p-3 sm:p-2 rounded-xl transition-all flex items-center justify-center gap-2 px-4 flex-1 sm:flex-none ${isRecording ? 'bg-red-500 text-white shadow-md shadow-red-200 animate-pulse' : 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)] hover:bg-[var(--color-primary-100)]'}`}
                  >
                    {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                    <span className="font-bold text-sm">{isRecording ? 'Detener' : 'Dictar'}</span>
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <textarea
                  value={translatorInput}
                  onChange={(e) => setTranslatorInput(e.target.value)}
                  placeholder="Escribe palabras clave, ej: 'yo ir universidad mañana' o 'profesor no venir ayer'..."
                  className="w-full h-40 p-5 bg-neutral-50 border-2 rounded-2xl focus:bg-white focus:border-[var(--color-primary-400)] outline-none resize-none text-xl transition-colors border-neutral-100 text-neutral-800 leading-relaxed placeholder:text-neutral-300"
                />
              </div>

              <div className="mt-6">
                <Button 
                  onClick={handleTranslate} 
                  className="w-full py-5 text-lg font-bold shadow-lg" 
                  disabled={(!translatorInput && !isRecording) || isTranslating}
                >
                  <Send size={20} className="mr-2" /> {isTranslating ? 'Traduciendo...' : 'Traducir y Corregir'}
                </Button>
              </div>
            </CardBody>
          </Card>

          <AnimatePresence>
            {translatedText && (
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] border-none shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                  <CardBody className="p-8 sm:p-10 relative z-10">
                    <p className="text-xs font-black text-[var(--color-primary-100)] uppercase mb-3 tracking-widest opacity-80">
                      Texto en Español Corregido
                    </p>
                    <p className="text-3xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow-sm">
                      {translatedText}
                    </p>
                    <p className="mt-4 text-xs font-semibold text-white/75">
                      {translationProvider === 'huggingface'
                        ? `Fuente: Hugging Face${translationModel ? ` · Modelo: ${translationModel}` : ''}`
                        : translationProvider === 'local-onnx'
                          ? `Fuente: modelo local${translationModel ? ` · ${translationModel}` : ''}`
                        : translationProvider === 'local'
                          ? 'Fuente: fallback local de desarrollo'
                          : 'Fuente: fallback local'}
                    </p>
                    {translationReason ? (
                      <p className="mt-1 text-xs text-white/60 leading-relaxed">
                        {translationReason}
                      </p>
                    ) : null}
                    {translationTokenSource ? (
                      <p className="mt-1 text-xs text-white/60">
                        {translationTokenSource === 'new' ? 'Token: nuevo (HF_TRANSLATION_TOKEN)' : translationTokenSource === 'legacy' ? 'Token: antiguo (HF_TOKEN)' : 'Token: no presente'}
                      </p>
                    ) : null}
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
