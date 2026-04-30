import { useState, useRef, useEffect } from 'react';
import { Card, CardBody } from '../components/lsc/Card';
import { Button } from '../components/lsc/Button';
import { Send, Languages, Mic, Volume2, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InstructionsModal } from '../components/lsc/InstructionsModal';

interface TranslatorViewProps {
  onNavigateHome?: () => void;
}

export function TranslatorView({ onNavigateHome }: TranslatorViewProps = {}) {
  const [translatorInput, setTranslatorInput] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Use SpeechRecognition API for Voice-to-Text
  const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const recognitionRef = useRef<any>(null);
  const textBeforeDictationRef = useRef<string>('');

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

  const handleTranslate = () => {
    // Simple LSC translation logic
    const connectors = ['el', 'la', 'los', 'las', 'de', 'del', 'y', 'o', 'a', 'en', 'con', 'por', 'para', 'un', 'una'];
    const result = translatorInput.toLowerCase().split(/\s+/)
      .filter(word => !connectors.includes(word.replace(/[.,!?;:]/g, '')))
      .join(' ').toUpperCase();
    setTranslatedText(result);
  };

  const playAudio = () => {
    if (!translatorInput) return;
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(translatorInput);
    utterance.lang = 'es-CO';
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col bg-[var(--color-neutral-50)] relative">
      <InstructionsModal 
        id="translator"
        title="Traductor a Glosa LSC"
        instructions={[
          "Escribe el texto en español que deseas traducir o usa el micrófono para dictar.",
          "Haz clic en 'Traducir a Glosa LSC' para ver la estructura gramatical simplificada para la comunidad sorda.",
          "Puedes reproducir el audio del texto escrito para comunicarte de manera oral si lo necesitas.",
          "Recuerda que la glosa elimina conectores innecesarios y resalta la idea principal."
        ]}
      />

      <div className="flex-shrink-0 p-6 sm:p-8 bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-primary-100)] p-3 rounded-2xl text-[var(--color-primary-600)]">
              <Languages size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">Traductor Principal</h1>
              <p className="text-sm text-neutral-500 font-medium mt-1">Convierte español a Glosa LSC</p>
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
                  Texto en Español
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
                  placeholder="Escribe o dicta tu mensaje aquí..."
                  className="w-full h-40 p-5 bg-neutral-50 border-2 rounded-2xl focus:bg-white focus:border-[var(--color-primary-400)] outline-none resize-none text-xl transition-colors border-neutral-100 text-neutral-800 leading-relaxed placeholder:text-neutral-300"
                />
              </div>

              <div className="mt-6">
                <Button 
                  onClick={handleTranslate} 
                  className="w-full py-5 text-lg font-bold shadow-lg" 
                  disabled={!translatorInput && !isRecording}
                >
                  <Send size={20} className="mr-2" /> Traducir a Glosa LSC
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
                      Resultado en Glosa
                    </p>
                    <p className="text-4xl sm:text-5xl font-black text-white leading-tight drop-shadow-sm">
                      {translatedText}
                    </p>
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
